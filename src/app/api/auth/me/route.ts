import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ data: { user: null } });
  }

  const profileResult = await dbQuery(
    "SELECT * FROM profiles WHERE id = $1 LIMIT 1",
    [user.id]
  );

  return NextResponse.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        ...(profileResult.rows[0] ?? {}),
      },
    },
  });
}
