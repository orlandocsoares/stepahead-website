import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { dbQuery } from "@/lib/db";

const SESSION_COOKIE = "sm_session";
const SESSION_DAYS = 30;

type SessionUser = {
  id: string;
  email: string;
  role?: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const result = await dbQuery<SessionUser>(
    `SELECT u.id, u.email, p.role
     FROM user_sessions s
     JOIN auth_users u ON u.id = s.user_id
     LEFT JOIN profiles p ON p.id = u.id
     WHERE s.token = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [token]
  );

  return result.rows[0] ?? null;
}

export async function setSession(userId: string) {
  const token = randomBytes(32).toString("hex");

  await dbQuery(
    `INSERT INTO user_sessions (token, user_id, expires_at)
     VALUES ($1, $2, NOW() + ($3::text || ' days')::interval)`,
    [token, userId, String(SESSION_DAYS)]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await dbQuery("DELETE FROM user_sessions WHERE token = $1", [token]);
  }

  cookieStore.delete(SESSION_COOKIE);
}
