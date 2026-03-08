import crypto from "crypto";

const algorithm = "aes-256-gcm";

const key = crypto
  .createHash("sha256")
  .update(process.env.MESSAGE_SECRET as string)
  .digest();

export const encrypt = (text: string) => {

  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");

};

export const decrypt = (data: string) => {

  const buffer = Buffer.from(data, "base64");

  const iv = buffer.subarray(0, 16);
  const tag = buffer.subarray(16, 32);
  const encrypted = buffer.subarray(32);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString("utf8");

};