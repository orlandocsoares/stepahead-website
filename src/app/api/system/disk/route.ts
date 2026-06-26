import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { getSessionUser } from "@/lib/server-auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    // df na pasta de uploads (ou root se não existir)
    const output = execSync("df -Pk /opt/apps/sabermais 2>/dev/null || df -Pk /", {
      encoding: "utf8",
      timeout: 5000,
    });

    // Formato: Filesystem  1024-blocks  Used  Available  Capacity%  Mounted
    const lines = output.trim().split("\n");
    const parts = lines[lines.length - 1].trim().split(/\s+/);

    const total = parseInt(parts[1]) * 1024;      // bytes
    const used  = parseInt(parts[2]) * 1024;
    const avail = parseInt(parts[3]) * 1024;
    const pct   = Math.round((used / total) * 100);

    return NextResponse.json({ total, used, avail, pct });
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o disco" }, { status: 500 });
  }
}
