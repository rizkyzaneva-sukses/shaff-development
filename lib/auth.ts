import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { BoundedRateLimiter, getTrustedClientKey } from "@/lib/security/rate-limit";

export const SESSION_COOKIE = "sd_session";
const SESSION_DAYS = 30;
const loginLimiter = new BoundedRateLimiter(8, 15 * 60_000, 10_000);
const clientLoginLimiter = new BoundedRateLimiter(30, 15 * 60_000, 10_000);

export class AuthError extends Error {
  status: number;
  constructor(message = "Autentikasi diperlukan", status = 401) {
    super(message);
    this.status = status;
  }
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function rateLimitKeys(email: string) {
  const requestHeaders = await headers();
  const client = getTrustedClientKey({ headers: requestHeaders }) || "unknown-client";
  return { identity: `${client}:${email.toLowerCase()}`, client };
}

export async function assertLoginAllowed(email: string) {
  const keys = await rateLimitKeys(email);
  const identityResult = loginLimiter.check(keys.identity);
  const clientResult = clientLoginLimiter.check(keys.client);
  if (!identityResult.allowed || !clientResult.allowed) {
    throw new AuthError("Terlalu banyak percobaan. Coba lagi beberapa menit lagi.", 429);
  }
}

export async function clearLoginAttempts(email: string) {
  const keys = await rateLimitKeys(email);
  loginLimiter.clear(keys.identity);
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

const MUTATING_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function assertSameOrigin(request: Request) {
  const method = (request.method || "GET").toUpperCase();
  const isMutating = !MUTATING_SAFE_METHODS.has(method);

  // Defensive: browsers set Sec-Fetch-Site on cross-site requests. Reject them outright.
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite === "cross-site") throw new AuthError("Origin request tidak valid", 403);

  const origin = request.headers.get("origin");
  if (!origin) {
    // GET/HEAD/OPTIONS legitimately omit Origin (navigation and same-origin fetches).
    if (!isMutating) return;
    throw new AuthError("Origin request tidak valid", 403);
  }
  if (!origin.trim() || origin.trim().toLowerCase() === "null") throw new AuthError("Origin request tidak valid", 403);
  let candidate: URL;
  try { candidate = new URL(origin); } catch { throw new AuthError("Origin request tidak valid", 403); }
  if (candidate.username || candidate.password || candidate.pathname !== "/" || candidate.search || candidate.hash) {
    throw new AuthError("Origin request tidak valid", 403);
  }

  const configuredOrigin = process.env.APP_ORIGIN || process.env.PUBLIC_APP_URL;
  if (configuredOrigin) {
    try {
      if (candidate.origin === new URL(configuredOrigin).origin) return;
    } catch {
      // ignore invalid config URL
    }
  }

  try {
    if (candidate.origin === new URL(request.url).origin) return;
  } catch {
    // ignore
  }

  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (forwardedHost) {
    const cleanHost = forwardedHost.split(",")[0].trim();
    const hostWithoutPort = cleanHost.split(":")[0];
    if (candidate.host === cleanHost || candidate.hostname === hostWithoutPort) {
      return;
    }
  }

  throw new AuthError("Origin request tidak valid", 403);
}

export function requestIdempotencyKey(request: Request) {
  const value = request.headers.get("idempotency-key")?.trim();
  if (!value) return null;
  if (value.length < 16 || value.length > 120 || !/^[A-Za-z0-9._:-]+$/.test(value)) throw new AuthError("Idempotency-Key tidak valid", 400);
  return value;
}

export { hashToken };
