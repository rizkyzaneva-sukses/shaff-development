const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const result = await prisma.invoiceSequence.upsert({
      where: { year: 2026 },
      create: { year: 2026, nextNumber: 1 },
      update: { nextNumber: { increment: 1 } }
    });
    console.log('InvoiceSequence:', JSON.stringify(result));
    
    const inv = await prisma.invoice.findUnique({ where: { id: 'cmtx00krh006b123i63bxqf53' }, include: { items: true } });
    console.log('Invoice found:', inv ? inv.id + ' status=' + inv.status + ' approval=' + inv.approvalStatus : 'NOT FOUND');
    console.log('Items count:', inv?.items?.length);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
