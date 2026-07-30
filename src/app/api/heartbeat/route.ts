import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbQuery } from "@/lib/db";

const SESSION_COOKIE = "sm_session";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  await dbQuery(
    `UPDATE user_sessions SET last_seen_at = NOW() WHERE token = $1 AND expires_at > NOW()`,
    [token]
  );

  return NextResponse.json({ ok: true });
}
