import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";

const idr = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&": return "&" + "amp;";
      case "<": return "&" + "lt;";
      case ">": return "&" + "gt;";
      case '"': return "&" + "quot;";
      case "'": return "&" + "#39;";
      default: return character;
    }
  });
}

function invoiceScope(userId: string, role: string) {
  if (role === "ADMIN" || role === "FINANCE") return {};
  return { client: { leadId: userId } };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser(["ADMIN", "FINANCE", "LEAD"]);
    const invoice = await prisma.invoice.findFirst({
      where: { id, ...invoiceScope(user.id, user.role) },
      include: {
        items: true,
        payments: { where: { status: "VALID" } },
        client: true,
        program: true,
        createdBy: { select: { name: true } }
      }
    });
    if (!invoice) return Response.json({ error: "Invoice tidak ditemukan" }, { status: 404 });

    const org = await prisma.organizationSettings.findUnique({ where: { id: "organization" } });
    const paidAmount = invoice.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
    const balance = invoice.totalAmount - paidAmount;

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Invoice ${escapeHtml(invoice.invoiceNumber ?? "Draft")}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "DM Sans", -apple-system, sans-serif; color: #172522; padding: 40px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .brand { font-size: 24px; font-weight: 700; color: #193b3a; }
  .brand small { display: block; font-size: 10px; font-weight: 400; color: #82908c; letter-spacing: 0.1em; text-transform: uppercase; }
  .invoice-title { text-align: right; }
  .invoice-title h1 { font-size: 28px; color: #193b3a; }
  .invoice-title .number { font-size: 14px; color: #82908c; margin-top: 4px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
  .info-box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #82908c; margin-bottom: 8px; }
  .info-box p { font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  thead th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #82908c; text-align: left; padding: 10px 0; border-bottom: 2px solid #e4ebe6; }
  tbody td { padding: 12px 0; border-bottom: 1px solid #e4ebe6; font-size: 13px; }
  .text-right { text-align: right; }
  .total-row td { font-weight: 600; border-top: 2px solid #193b3a; border-bottom: none; }
  .summary { display: flex; justify-content: flex-end; }
  .summary-box { width: 280px; }
  .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
  .summary-row.total { font-weight: 700; font-size: 16px; border-top: 2px solid #193b3a; margin-top: 8px; padding-top: 12px; }
  .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e4ebe6; font-size: 11px; color: #82908c; text-align: center; }
  .no-print-bar { position: sticky; top: 0; background: #283529; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .btn-print { background: #506545; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
  .btn-print:hover { background: #3f5037; }
  .btn-close { background: rgba(255,255,255,0.15); color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 13px; }
  @media print { .no-print { display: none !important; } body { padding: 20px; } }
</style>
</head>
<body>
<div class="no-print no-print-bar">
  <span style="font-size: 13px; font-weight: 500;">Pratinjau Invoice · ${escapeHtml(invoice.invoiceNumber ?? "Draft")}</span>
  <div style="display: flex; gap: 8px;">
    <button type="button" class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
    <button type="button" class="btn-close" onclick="window.close()">Tutup</button>
  </div>
</div>
<div class="header">
  <div class="brand">${escapeHtml(org?.name ?? "Shaff Development")}<small>${escapeHtml(org?.address ?? "")}</small></div>
  <div class="invoice-title">
    <h1>INVOICE</h1>
    <div class="number">${escapeHtml(invoice.invoiceNumber ?? "Draft")}</div>
  </div>
</div>
<div class="info-grid">
  <div class="info-box">
    <h3>Ditagihkan kepada</h3>
    <p><strong>${escapeHtml(invoice.client.businessName)}</strong><br>${escapeHtml(invoice.client.address ?? "")}</p>
  </div>
  <div class="info-box" style="text-align: right">
    <h3>Detail Invoice</h3>
    <p>Tanggal terbit: ${new Date(invoice.issueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br>
    Jatuh tempo: ${new Date(invoice.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br>
    Program: ${escapeHtml(invoice.program.name)}</p>
  </div>
</div>
<table>
  <thead><tr><th>Deskripsi</th><th class="text-right">Qty</th><th class="text-right">Harga Satuan</th><th class="text-right">Jumlah</th></tr></thead>
  <tbody>
    ${invoice.items.map((item: { description: string; quantity: number; unitPrice: number; amount: number }) => `<tr><td>${escapeHtml(item.description)}</td><td class="text-right">${item.quantity}</td><td class="text-right">${idr(item.unitPrice)}</td><td class="text-right">${idr(item.amount)}</td></tr>`).join("")}
  </tbody>
</table>
<div class="summary">
  <div class="summary-box">
    <div class="summary-row"><span>Total</span><span>${idr(invoice.totalAmount)}</span></div>
    ${paidAmount > 0 ? `<div class="summary-row"><span>Sudah dibayar</span><span>${idr(paidAmount)}</span></div>` : ""}
    <div class="summary-row total"><span>${balance > 0 ? "Sisa tagihan" : "Lunas"}</span><span>${idr(balance)}</span></div>
  </div>
</div>
${org?.bankName ? `<div style="margin-top: 30px; font-size: 12px; color: #45605b;"><strong>Pembayaran ke:</strong><br>${escapeHtml(org.bankName)} — ${escapeHtml(org.bankAccountName ?? "")} — ${escapeHtml(org.bankAccountNo ?? "")}</div>` : ""}
<div class="footer">Dicetak oleh ${escapeHtml(user.name)} · ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
<script>
  if (new URLSearchParams(window.location.search).get('autoprint') === '1') {
    window.addEventListener('load', () => setTimeout(() => window.print(), 300));
  }
</script>
</body>
</html>`;

    const filename = encodeURIComponent(`Invoice-${invoice.invoiceNumber ?? "draft"}.html`);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename*=UTF-8''${filename}`
      }
    });
  } catch (error) { return jsonError(error); }
}
