import { NextResponse } from "next/server";
import { getSessionUser, clearSession } from "@/lib/server-auth";
import { auditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const session = await getSessionUser();

  await clearSession();

  if (session) {
    await auditLog("logout", { actorId: session.id, ip: request.headers.get("x-forwarded-for") ?? undefined });
  }

  return NextResponse.json({ message: "Logout bem-sucedido" });
}