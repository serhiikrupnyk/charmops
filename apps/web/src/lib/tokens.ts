import crypto from "crypto";

export function generateInviteToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url"); // URL-safe
}

export function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}
