bwimport { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

const MAX_MESSAGE_LENGTH = 4_000;
const UPSTREAM_TIMEOUT_MS = 8_000;

function validWahaUrl(value: string) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
    return process.env.NODE_ENV !== 'production' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function cleanPhone(value: string) {
  const digits = value.replace(/[^0-9]/g, '');
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireUser(["ADMIN", "FINANCE"]);
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 12_000) return Response.json({ error: "Permintaan terlalu besar" }, { status: 413 });
    const body = await request.json().catch(() => ({}));
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const clean = cleanPhone(phone);

    if (!clean || !message || message.length > MAX_MESSAGE_LENGTH) {
      return Response.json({ error: "Nomor atau pesan tidak valid" }, { status: 400 });
    }

    const wahaUrl = process.env.WAHA_URL?.trim();
    const wahaSession = process.env.WAHA_SESSION || "default";
    const wahaApiKey = process.env.WAHA_API_KEY;

    if (!wahaUrl) {
      const waLink = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
      return Response.json({ method: "link", url: waLink });
    }
    if (!validWahaUrl(wahaUrl)) {
      console.error("whatsapp_upstream_misconfigured");
      return Response.json({ error: "Layanan WhatsApp belum dikonfigurasi dengan benar" }, { status: 503 });
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (wahaApiKey) headers["Authorization"] = `Bearer ${wahaApiKey}`;

    const response = await fetch(`${wahaUrl.replace(/\/$/, "")}/api/sendText`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        session: wahaSession,
        chatId: `${clean}@c.us`,
        text: message
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });

    if (!response.ok) {
      console.error("whatsapp_upstream_rejected", { status: response.status });
      return Response.json({ error: "Gagal mengirim pesan WhatsApp" }, { status: 502 });
    }

    return Response.json({ method: "waha", success: true });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "unknown";
    console.error("whatsapp_request_failed", errorName);
    if (errorName === "TimeoutError" || errorName === "AbortError") {
      return Response.json({ error: "Layanan WhatsApp tidak merespons" }, { status: 504 });
    }
    return jsonError(error);
  }
}
