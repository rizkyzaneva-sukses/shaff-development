import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_DEMO_PASSWORD || 'demo123';
  const hash = hashSync(password, 10);
  
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users`);
  
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash }
    });
    console.log(`Updated: ${user.email}`);
  }
  
  console.log('All passwords updated!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
