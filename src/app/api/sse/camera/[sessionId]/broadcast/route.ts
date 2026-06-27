import { NextRequest, NextResponse } from "next/server";
import { broadcastToSession } from "../route";

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const body = await req.json();
  broadcastToSession(sessionId, body);
  return NextResponse.json({ ok: true });
}
