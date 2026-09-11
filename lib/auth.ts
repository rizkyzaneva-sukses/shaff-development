import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE = "sd_session";
const SESSION_DAYS = 30;
const attempts = new Map<string, { count: number; resetAt: number }>();

export class AuthError extends Error {
  status: number;
  constructor(message = "Autentikasi diperlukan", status = 401) {
    super(message);
    this.status = status;
  }
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function rateLimitKey(email: string) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || requestHeaders.get("x-real-ip") || "unknown";
  return `${ip}:${email.toLowerCase()}`;
}

export async function assertLoginAllowed(email: string) {
  const now = Date.now();
  if (attempts.size > 5000) attempts.forEach((value, storedKey) => { if (value.resetAt < now) attempts.delete(storedKey); });
  const key = await rateLimitKey(email);
  const current = attempts.get(key);
  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return;
  }
  if (current.count >= 8) throw new AuthError("Terlalu banyak percobaan. Coba lagi beberapa menit lagi.", 429);
  current.count += 1;
}

export async function clearLoginAttempts(email: string) {
  attempts.delete(await rateLimitKey(email));
}

export async function createSession(userId: string) {
  const raw = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000);
  await prisma.session.create({ data: { tokenHash: hashToken(raw), userId, expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

export async function getCurrentUser() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(raw), }, include: { user: true } });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") return null;
  if (session.lastSeenAt.getTime() < Date.now() - 5 * 60_000) await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
  return session.user;
}

export async function requireUser(roles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  if (roles && !roles.includes(user.role)) throw new AuthError("Anda tidak memiliki akses untuk tindakan ini", 403);
  return user;
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (raw) await prisma.session.updateMany({ where: { tokenHash: hashToken(raw), revokedAt: null }, data: { revokedAt: new Date() } });
  cookieStore.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export function jsonError(error: unknown) {
  if (error instanceof AuthError) return Response.json({ error: error.message }, { status: error.status });
  console.error("request_error", error instanceof Error ? error.message : "unknown");
  return Response.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const requestOrigin = new URL(request.url).origin;
  if (origin !== requestOrigin) throw new AuthError("Origin request tidak valid", 403);
}

export function requestIdempotencyKey(request: Request) {
  const value = request.headers.get("idempotency-key")?.trim();
  if (!value) return null;
  if (value.length < 16 || value.length > 120 || !/^[A-Za-z0-9._:-]+$/.test(value)) throw new AuthError("Idempotency-Key tidak valid", 400);
  return value;
}

export { hashToken };
