import { resetDemoData } from "@/lib/demo-reset";
import { assertSameOrigin, jsonError } from "@/lib/auth";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Fitur reset data demo hanya tersedia di development" }, { status: 403 });
  }
  try {
    assertSameOrigin(request);
    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === "string" && body.password.trim() ? body.password.trim() : "demo123";

    const result = await resetDemoData(password);

    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
