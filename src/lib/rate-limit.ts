/**
 * Rate limiter em memória baseado em sliding window.
 *
 * Não requer Redis — adequado para instâncias únicas (single-container).
 * Para múltiplas instâncias, substituir por Upstash ou Redis partilhado.
 *
 * Uso:
 *   const result = rateLimiter.check("login", ip, { max: 5, windowMs: 60_000 });
 *   if (!result.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface Attempt {
  timestamps: number[];
}

interface RateLimitOptions {
  /** Número máximo de tentativas na janela */
  max: number;
  /** Duração da janela em milissegundos */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  /** Tentativas restantes até ao limite */
  remaining: number;
  /** Segundos até a janela resetar */
  retryAfterSecs: number;
}

class RateLimiter {
  /** Mapa: `"namespace:key"` → lista de timestamps de tentativas */
  private store = new Map<string, Attempt>();

  /** Limpeza periódica de entradas expiradas (evita memory leak) */
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Limpar entradas velhas a cada 5 minutos
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      // Não bloquear o processo Node quando não há mais nada a fazer
      if (this.cleanupInterval.unref) this.cleanupInterval.unref();
    }
  }

  check(namespace: string, key: string, opts: RateLimitOptions): RateLimitResult {
    const id = `${namespace}:${key}`;
    const now = Date.now();
    const windowStart = now - opts.windowMs;

    const entry = this.store.get(id) ?? { timestamps: [] };

    // Descartar tentativas fora da janela corrente
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);

    if (entry.timestamps.length >= opts.max) {
      const oldest = entry.timestamps[0];
      const retryAfterSecs = Math.ceil((oldest + opts.windowMs - now) / 1000);
      this.store.set(id, entry);
      return { allowed: false, remaining: 0, retryAfterSecs };
    }

    entry.timestamps.push(now);
    this.store.set(id, entry);

    return {
      allowed: true,
      remaining: opts.max - entry.timestamps.length,
      retryAfterSecs: 0,
    };
  }

  /** Limpa entradas completamente expiradas para evitar memory leak */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      // Remove entradas sem timestamps recentes (assume janela máxima de 1h)
      if (entry.timestamps.every(t => now - t > 60 * 60 * 1000)) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton partilhado por todos os route handlers no mesmo processo
export const rateLimiter = new RateLimiter();

/**
 * Extrai o IP real do pedido, respeitando proxies de confiança (Nginx, etc.).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
