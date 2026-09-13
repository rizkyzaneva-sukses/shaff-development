import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BoundedRateLimiter, getTrustedClientKey } from "@/lib/security/rate-limit";

const publicApi = new Set(["/api/auth/login", "/api/auth/logout", "/api/auth/me", "/api/auth/activate", "/api/auth/reset", "/api/health"]);
const securityHeaders = { "Content-Security-Policy": "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; connect-src 'self';", "Referrer-Policy": "strict-origin-when-cross-origin", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Permissions-Policy": "camera=(), microphone=(), geolocation=()", "Cross-Origin-Opener-Policy": "same-origin" };
const requestLimiter = new BoundedRateLimiter(120, 60_000, 20_000);

function secure(response: NextResponse) { for (const [key, value] of Object.entries(securityHeaders)) response.headers.set(key, value); return response; }

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("sd_session")?.value;
  const clientKey = getTrustedClientKey(request) || "unknown-client";
  const requestLimit = requestLimiter.check(clientKey);
  if (!requestLimit.allowed && pathname.startsWith("/api/")) {
    const response = NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 });
    response.headers.set("Retry-After", String(requestLimit.retryAfterSeconds));
    return secure(response);
  }
  if (pathname.startsWith("/dashboard") && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return secure(NextResponse.redirect(login));
  }
  if (pathname.startsWith("/api/") && !publicApi.has(pathname) && !session) {
    return secure(NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 }));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/api/:path*"] };
