import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [iterationsRaw, salt, hashHex] = stored.split(":");
  if (!iterationsRaw || !salt || !hashHex) return false;

  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations < 10000) return false;

  const hashBuffer = Buffer.from(hashHex, "hex");
  const testHash = pbkdf2Sync(password, salt, iterations, hashBuffer.length, DIGEST);

  if (hashBuffer.length !== testHash.length) return false;
  return timingSafeEqual(hashBuffer, testHash);
}
