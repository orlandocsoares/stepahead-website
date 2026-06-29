import { NextResponse } from "next/server";
import { mkdir, writeFile, access } from "fs/promises";
import path from "path";
import { getSessionUser } from "@/lib/server-auth";

// Remover limite de tamanho do body imposto pelo Next.js (por defeito 4 MB)
export const config = { api: { bodyParser: false } };
export const maxDuration = 300; // 5 min — necessário para uploads grandes

const STORAGE_ROOT = path.join(process.cwd(), "storage");

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "text/plain",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
]);

// Apenas letras, números, traços, underscores, pontos — sem path traversal
const SAFE_FILENAME = /^[\w.\-]+$/;

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

  // Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ data: null, error: { message: "Tipo de ficheiro não permitido." } }, { status: 415 });
  }

  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ data: null, error: { message: "Ficheiro demasiado grande (máx 2 GB)." } }, { status: 413 });
  }

  // Validar nome do ficheiro (componente final do path)
  const fileName = relativePath.split("/").pop() ?? "";
  if (!SAFE_FILENAME.test(fileName)) {
    return NextResponse.json({ data: null, error: { message: "Nome de ficheiro inválido." } }, { status: 400 });
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
