import { getCurrentUser, jsonError } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ user: null }, { status: 401 });
    return Response.json({ user: { id: user.id, name: user.name, jobTitle: user.jobTitle, email: user.email, role: user.role } });
  } catch (error) {
    return jsonError(error);
  }
}
