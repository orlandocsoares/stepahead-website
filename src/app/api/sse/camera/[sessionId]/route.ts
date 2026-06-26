import { NextRequest } from "next/server";

// Mapa em memória: sessionId → lista de controllers SSE activos
const sessions = new Map<string, ReadableStreamDefaultController[]>();

export function addClient(sessionId: string, controller: ReadableStreamDefaultController) {
  if (!sessions.has(sessionId)) sessions.set(sessionId, []);
  sessions.get(sessionId)!.push(controller);
}

export function removeClient(sessionId: string, controller: ReadableStreamDefaultController) {
  const list = sessions.get(sessionId);
  if (!list) return;
  const next = list.filter(c => c !== controller);
  if (next.length === 0) sessions.delete(sessionId);
  else sessions.set(sessionId, next);
}

export function broadcastToSession(sessionId: string, data: object) {
  const list = sessions.get(sessionId);
  if (!list) return;
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const ctrl of list) {
    try { ctrl.enqueue(msg); } catch {}
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  let controller!: ReadableStreamDefaultController;
  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      addClient(sessionId, controller);
      // Heartbeat para manter conexão viva
      ctrl.enqueue(": ping\n\n");
    },
    cancel() {
      removeClient(sessionId, controller);
    },
  });

  // Heartbeat a cada 25s para evitar timeout do browser
  const timer = setInterval(() => {
    try { controller.enqueue(": ping\n\n"); } catch { clearInterval(timer); }
  }, 25000);

  req.signal.addEventListener("abort", () => {
    clearInterval(timer);
    removeClient(sessionId, controller);
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
