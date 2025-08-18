import crypto from "crypto";

function getKey(): Buffer {
  const b64 = process.env.PROFILE_SECRET_KEY;
  if (!b64) throw new Error("PROFILE_SECRET_KEY is not set");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("PROFILE_SECRET_KEY must be 32 bytes in base64");
  return key;
}

/** Повертає формат: v1:<ivB64>:<ctB64>:<tagB64> */
export function encryptPassword(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${ct.toString("base64")}:${tag.toString("base64")}`;
}

/** Розшифрування (на майбутнє, у API НЕ використовуємо) */
export function decryptPassword(enc: string): string {
  const [v, ivB64, ctB64, tagB64] = enc.split(":");
  if (v !== "v1") throw new Error("Unknown cipher version");
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}
