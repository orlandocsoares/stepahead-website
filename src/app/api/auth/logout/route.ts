import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbQuery } from "@/lib/db";

export async function POST() {
  const cookieStore = cookies();
  const token = cookieStore.get("sm_session")?.value;

  // Apagar a sessão da BD
  if (token) {
    try {
      await dbQuery("DELETE FROM user_sessions WHERE token = $1", [token]);
    } catch {}
  }

  // Limpar o cookie
  cookieStore.set("sm_session", "", { expires: new Date(0), path: "/" });

  return NextResponse.json({ message: "Logout bem-sucedido" });
}