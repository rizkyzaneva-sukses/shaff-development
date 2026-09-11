import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const allowed: Record<string, string> = { "application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx", "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx" };

function root() { const configured = process.env.FILE_STORAGE_PATH; return configured ? path.resolve(/* turbopackIgnore: true */ configured) : path.join(process.cwd(), "data", "private"); }

function safePath(key: string) { const base = root(); const target = path.resolve(base, key); if (target !== base && !target.startsWith(`${base}${path.sep}`)) throw new Error("INVALID_STORAGE_KEY"); return target; }

export async function savePrivateFile(file: File) {
  const extension = allowed[file.type];
  if (!extension || file.size <= 0 || file.size > MAX_UPLOAD_BYTES) throw new Error("INVALID_FILE");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (file.type === "application/pdf" && bytes.subarray(0, 5).toString() !== "%PDF-") throw new Error("INVALID_FILE");
  if (file.type === "image/png" && bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("INVALID_FILE");
  if (file.type === "image/jpeg" && (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9)) throw new Error("INVALID_FILE");
  if (extension === ".docx" || extension === ".xlsx" || extension === ".pptx") {
    if (bytes.subarray(0, 2).toString("hex") !== "504b" || bytes.includes(Buffer.from("vbaProject.bin"))) throw new Error("INVALID_FILE");
  }
  const key = `${randomUUID()}${extension}`;
  const target = safePath(key);
  await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
  await writeFile(target, bytes, { mode: 0o600 });
  return { key, sizeBytes: bytes.length, mimeType: file.type };
}

export async function readPrivateFile(key: string) { return readFile(/* turbopackIgnore: true */ safePath(key)); }
export async function deletePrivateFile(key: string) { await unlink(safePath(key)).catch(() => undefined); }
