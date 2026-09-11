import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "FINANCE"]);
    const body = await request.json().catch(() => ({}));
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!phone || !message) return Response.json({ error: "Nomor dan pesan wajib diisi" }, { status: 400 });

    const wahaUrl = process.env.WAHA_URL;
    const wahaSession = process.env.WAHA_SESSION || "default";
    const wahaApiKey = process.env.WAHA_API_KEY;

    if (!wahaUrl) {
      // Fallback: return wa.me link
      const waLink = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
      return Response.json({ method: "link", url: waLink });
    }

    // Send via Waha API
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (wahaApiKey) headers["Authorization"] = `Bearer ${wahaApiKey}`;

    const response = await fetch(`${wahaUrl}/api/sendText`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        session: wahaSession,
        chatId: `${cleanPhone}@c.us`,
        text: message
      })
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "Unknown error");
      return Response.json({ error: `Gagal kirim WhatsApp: ${err}` }, { status: 502 });
    }

    const result = await response.json().catch(() => ({}));
    return Response.json({ method: "waha", success: true, result });
  } catch (error) { return jsonError(error); }
}
