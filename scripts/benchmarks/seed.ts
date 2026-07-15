import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { hash } from 'bcryptjs';
import { prisma } from '../../src/lib/prisma';

const PERSONAS = {
  light: { accounts: 2, transactionsPerAccount: 50, categories: 5 },
  moderate: { accounts: 5, transactionsPerAccount: 400, categories: 15 },
  heavy: { accounts: 10, transactionsPerAccount: 5000, categories: 50 }
};

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedPersona(name: string, config: typeof PERSONAS.light) {
  console.log(`Seeding persona: ${name}...`);
  const passwordHash = await hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: `benchmark-${name}@example.com`,
      password: passwordHash,
      name: `${name} Benchmark`,
      currency: 'KES',
    }
  });

  const categories = [];
  for (let i = 0; i < config.categories; i++) {
    const cat = await prisma.category.create({
      data: {
        userId: user.id,
        name: `Category ${i}`,
        type: i % 2 === 0 ? 'expense' : 'income'
      }
    });
    categories.push(cat);
  }

  for (let a = 0; a < config.accounts; a++) {
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: `Account ${a}`,
        type: 'CHECKING',
        currency: 'KES',
      }
    });

    const txs = [];
    for (let t = 0; t < config.transactionsPerAccount; t++) {
      const type = t % 10 === 0 ? 'income' : 'expense';
      const cat = categories.find(c => c.type === type) || categories[0];
      
      txs.push({
        userId: user.id,
        accountId: account.id,
        categoryId: cat.id,
        name: `Transaction ${t}`,
        baseAmountMinor: Math.floor(Math.random() * 100000),
        type,
        currency: 'KES',
        date: randomDate(new Date(2020, 0, 1), new Date()),
        createdAt: new Date(),
      });
    }

    // Chunk insert
    const chunkSize = 5000;
    for (let i = 0; i < txs.length; i += chunkSize) {
      const chunk = txs.slice(i, i + chunkSize);
      await prisma.transaction.createMany({ data: chunk });
    }
  }

  console.log(`Persona ${name} seeded: ${config.accounts} accounts, ${config.accounts * config.transactionsPerAccount} transactions.`);
}

async function main() {
  await prisma.transaction.deleteMany({ where: { user: { email: { startsWith: 'benchmark-' } } } });
  await prisma.account.deleteMany({ where: { user: { email: { startsWith: 'benchmark-' } } } });
  await prisma.category.deleteMany({ where: { user: { email: { startsWith: 'benchmark-' } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'benchmark-' } } });

  await seedPersona('light', PERSONAS.light);
  await seedPersona('moderate', PERSONAS.moderate);
  await seedPersona('heavy', PERSONAS.heavy);
  
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
