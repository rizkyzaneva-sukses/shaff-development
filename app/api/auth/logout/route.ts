import { assertSameOrigin, jsonError, revokeCurrentSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await revokeCurrentSession();
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
