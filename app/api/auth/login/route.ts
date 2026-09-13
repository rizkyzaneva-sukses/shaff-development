import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { assertLoginAllowed, assertSameOrigin, clearLoginAttempts, createSession, jsonError } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 1) return Response.json({ error: "Email atau password salah" }, { status: 400 });
    await assertLoginAllowed(email);
    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid || user.status !== "ACTIVE") return Response.json({ error: "Email atau password salah" }, { status: 401 });
    await clearLoginAttempts(email);
    await createSession(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return Response.json({ user: { id: user.id, name: user.name, jobTitle: user.jobTitle, email: user.email, role: user.role } });
  } catch (error) {
    return jsonError(error);
  }
}
