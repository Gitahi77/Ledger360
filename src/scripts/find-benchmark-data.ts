import { prisma } from '../lib/prisma';

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");
  
  const account = await prisma.account.findFirst({ where: { userId: user.id } });
  const category = await prisma.category.findFirst({ where: { userId: user.id } });
  
  console.log(`x-benchmark-user-id: ${user.id}`);
  console.log(`accountId: ${account?.id}`);
  console.log(`categoryId: ${category?.id}`);
}

main().catch(console.error);
