import { NextResponse } from "next/server";
import { mkdir, writeFile, access } from "fs/promises";
import path from "path";
import { getSessionUser } from "@/lib/server-auth";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { message: "Sessao expirada." } }, { status: 401 });
  }

  const formData = await request.formData();
  const bucket = String(formData.get("bucket") ?? "");
  const relativePath = String(formData.get("path") ?? "");
  const upsert = String(formData.get("upsert") ?? "false") === "true";
  const file = formData.get("file") as File | null;

  if (!bucket || !relativePath || !file) {
    return NextResponse.json({ data: null, error: { message: "bucket, path e file sao obrigatorios." } }, { status: 400 });
  }

  const bucketDir = path.join(STORAGE_ROOT, bucket);
  const finalPath = path.join(bucketDir, relativePath);

  if (!finalPath.startsWith(bucketDir)) {
    return NextResponse.json({ data: null, error: { message: "Path invalido." } }, { status: 400 });
  }

  await mkdir(path.dirname(finalPath), { recursive: true });

  if (!upsert) {
    try {
      await access(finalPath);
      return NextResponse.json({ data: null, error: { message: "Ficheiro ja existe." } }, { status: 409 });
    } catch {
      // File does not exist, continue.
    }
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(finalPath, bytes);

  return NextResponse.json({ data: { path: relativePath }, error: null });
}
