import 'dotenv/config';
import { prisma } from '../../src/lib/prisma';

async function main() {
  const result = await prisma.account.updateMany({
    where: { userId: 'cmrjag4x4000004joej6vkb5p' },
    data: { allowNegativeBalance: true }
  });
  console.log('Updated accounts:', result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
