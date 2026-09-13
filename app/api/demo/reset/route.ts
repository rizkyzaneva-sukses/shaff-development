import { resetDemoData } from "@/lib/demo-reset";
import { jsonError } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === "string" && body.password.trim() ? body.password.trim() : "demo123";

    const result = await resetDemoData(password);

    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
