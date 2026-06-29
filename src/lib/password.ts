import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split(":");
    // dummy hash garante tempo constante mesmo em formato inválido
    if (parts.length !== 3) {
      pbkdf2Sync("dummy", "dummy-salt", ITERATIONS, KEY_LENGTH, DIGEST);
      return false;
    }
    const [iterationsRaw, salt, hashHex] = parts;
    const iterations = Math.max(Number(iterationsRaw) || ITERATIONS, 10000);
    const hashBuffer = Buffer.from(hashHex, "hex");
    const testHash = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST);
    // buffers de tamanho fixo KEY_LENGTH — sem early exit por tamanho
    const a = hashBuffer.length === KEY_LENGTH ? hashBuffer : Buffer.alloc(KEY_LENGTH);
    const b = testHash;
    return timingSafeEqual(a, b) && hashBuffer.length === KEY_LENGTH;
  } catch {
    pbkdf2Sync("dummy", "dummy-salt", ITERATIONS, KEY_LENGTH, DIGEST);
    return false;
  }
}
