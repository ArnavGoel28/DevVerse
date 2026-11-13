import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// NFR-SE-03: GitHub tokens are encrypted at rest with AES-256-GCM.
// The key is derived from GITHUB_TOKEN_ENCRYPTION_KEY (any long random string), so a leaked
// Firestore document alone is useless.

function keyFrom(secret: string): Buffer {
  if (!secret || secret.length < 16) throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY must be at least 16 characters");
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFrom(secret), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), data.toString("base64")].join(":");
}

export function decryptSecret(payload: string, secret: string): string {
  const [version, iv, tag, data] = payload.split(":");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unknown encrypted format");
  const decipher = createDecipheriv("aes-256-gcm", keyFrom(secret), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
