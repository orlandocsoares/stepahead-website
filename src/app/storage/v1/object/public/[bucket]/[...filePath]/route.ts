import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getSessionUser } from "@/lib/server-auth";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

const BUCKET_ALIAS_MAP: Record<string, string> = {
  "logo-sabermais": "Logo Sabermais",
  "logo-institutos": "Logo Institutos",
  "nuvem-loop": "Nuvem LooP",
};

// Buckets acessíveis sem autenticação (assets públicos do site)
const PUBLIC_BUCKETS = new Set(["logo-sabermais", "logo-institutos", "nuvem-loop"]);

function inferContentType(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".mp4")) return "video/mp4";
  return "application/octet-stream";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ bucket: string; filePath: string[] }> }
) {
  try {
    const { bucket, filePath } = await context.params;
    const normalizedBucket = String(bucket);

    // Buckets privados (ex: materiais) exigem sessão autenticada
    if (!PUBLIC_BUCKETS.has(normalizedBucket)) {
      const session = await getSessionUser();
      if (!session) {
        return new NextResponse("Não autorizado.", { status: 401 });
      }
    }

    const bucketName = BUCKET_ALIAS_MAP[normalizedBucket] ?? normalizedBucket;
    const relative = filePath.map((part) => decodeURIComponent(part)).join("/");

    const bucketDir = path.join(STORAGE_ROOT, bucketName);
    const absolute = path.join(bucketDir, relative);

    if (!absolute.startsWith(bucketDir)) {
      return new NextResponse("Invalid file path.", { status: 400 });
    }

    const data = await readFile(absolute);
    const contentType = inferContentType(relative);

    return new NextResponse(data, {
      headers: {
        "content-type": contentType,
        "cache-control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
