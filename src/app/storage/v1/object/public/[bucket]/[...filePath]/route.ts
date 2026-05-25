import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

const BUCKET_ALIAS_MAP: Record<string, string> = {
  "logo-sabermais": "Logo Sabermais",
  "logo-institutos": "Logo Institutos",
  "nuvem-loop": "Nuvem LooP",
};

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
  _request: Request,
  context: { params: Promise<{ bucket: string; filePath: string[] }> }
) {
  try {
    const { bucket, filePath } = await context.params;
    const normalizedBucket = String(bucket);
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
        "cache-control": "public, max-age=60",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
