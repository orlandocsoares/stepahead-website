import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";
import { auditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const session = await getSessionUser();
  const cookieStore = cookies();
  const token = cookieStore.get("sm_session")?.value;

  if (token) {
    try {
      await dbQuery("DELETE FROM user_sessions WHERE token = $1", [token]);
    } catch {}
  }

  if (session) {
    await auditLog("logout", { actorId: session.id, ip: request.headers.get("x-forwarded-for") ?? undefined });
  }

  cookieStore.set("sm_session", "", { expires: new Date(0), path: "/" });
  return NextResponse.json({ message: "Logout bem-sucedido" });
}