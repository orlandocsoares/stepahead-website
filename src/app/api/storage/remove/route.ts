import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { getSessionUser } from "@/lib/server-auth";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { message: "Sessao expirada." } }, { status: 401 });
  }

  const body = await request.json();
  const bucket = String(body.bucket ?? "");
  const paths = Array.isArray(body.paths) ? body.paths : [];

  if (!bucket || !paths.length) {
    return NextResponse.json({ data: null, error: { message: "bucket e paths sao obrigatorios." } }, { status: 400 });
  }

  const bucketDir = path.join(STORAGE_ROOT, bucket);

  for (const item of paths) {
    const finalPath = path.join(bucketDir, String(item));
    if (!finalPath.startsWith(bucketDir)) continue;

    try {
      await unlink(finalPath);
    } catch {
      // Ignore missing files.
    }
  }

  return NextResponse.json({ data: { success: true }, error: null });
}
