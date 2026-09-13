import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

export function hashSecret(secret: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(secret, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifySecret(secret: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const suppliedHash = scryptSync(secret, salt, KEY_LENGTH);
  const storedHash = Buffer.from(hash, "hex");
  if (suppliedHash.length !== storedHash.length) return false;
  return timingSafeEqual(suppliedHash, storedHash);
}
