import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export async function GET() {
  const result = await dbQuery(
    `SELECT DISTINCT area FROM arquivos WHERE area IS NOT NULL AND area != '' ORDER BY area`
  );
  const areas = (result.rows as any[]).map(r => r.area);
  return NextResponse.json({ areas });
}
