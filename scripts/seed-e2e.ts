import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'e2e@example.com';
  const password = await bcrypt.hash('Password123!', 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password,
    },
    create: {
      email,
      password,
      name: 'E2E Tester',
      accountType: 'individual',
      currency: 'KES',
    },
  });
  console.log('Seeded E2E user:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
