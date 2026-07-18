import 'dotenv/config';
import { prisma } from '../../src/lib/prisma';

async function main() {
  const u = await prisma.user.findFirst({
    include: { accounts: true, categories: true }
  });
  if (u) {
    console.log('USER=' + u.id);
    console.log('ACC=' + u.accounts[0].id);
    console.log('CAT=' + u.categories[0].id);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
