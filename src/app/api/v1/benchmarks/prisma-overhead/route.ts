import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode');
  const userId = 'test-user';
  const accountId = 'test-account';
  const txId = uuidv4();
  const date = new Date();
  
  try {
    if (mode === 'separate') {
      // 6 separate Prisma calls
      await prisma.account.findFirst({ where: { id: accountId } });
      await prisma.transaction.groupBy({ by: ['type'], where: { accountId }, _sum: { baseAmountMinor: true } });
      await prisma.transfer.aggregate({ where: { fromAccountId: accountId }, _sum: { amountMinor: true } });
      await prisma.transfer.aggregate({ where: { toAccountId: accountId }, _sum: { baseAmountMinor: true } });
      await prisma.transaction.create({
        data: { id: txId, userId, accountId, name: 'Test', type: 'expense', baseAmountMinor: 100n, date, currency: 'KES' }
      });
      await prisma.auditLog.create({
        data: { userId, action: 'CREATE', resource: 'Tx', metadata: {} }
      });
      return NextResponse.json({ success: true });
    } 
    
    if (mode === 'sequential') {
      // 1 sequential transaction
      await prisma.$transaction([
        prisma.account.findFirst({ where: { id: accountId } }),
        prisma.transaction.groupBy({ by: ['type'], where: { accountId }, _sum: { baseAmountMinor: true } }),
        prisma.transfer.aggregate({ where: { fromAccountId: accountId }, _sum: { amountMinor: true } }),
        prisma.transfer.aggregate({ where: { toAccountId: accountId }, _sum: { baseAmountMinor: true } }),
        prisma.transaction.create({
          data: { id: txId, userId, accountId, name: 'Test', type: 'expense', baseAmountMinor: 100n, date, currency: 'KES' }
        }),
        prisma.auditLog.create({
          data: { userId, action: 'CREATE', resource: 'Tx', metadata: {} }
        })
      ]);
      return NextResponse.json({ success: true });
    }

    if (mode === 'raw') {
      // 1 raw SQL query
      await prisma.$executeRawUnsafe(`
        BEGIN;
        SELECT id FROM "Account" WHERE id = '${accountId}' LIMIT 1;
        SELECT type, SUM("baseAmountMinor") FROM "Transaction" WHERE "accountId" = '${accountId}' GROUP BY type;
        SELECT SUM("amountMinor") FROM "Transfer" WHERE "fromAccountId" = '${accountId}';
        SELECT SUM("baseAmountMinor") FROM "Transfer" WHERE "toAccountId" = '${accountId}';
        INSERT INTO "Transaction" (id, "userId", "accountId", name, type, "baseAmountMinor", date, currency, "createdAt", "updatedAt") 
        VALUES ('${txId}', '${userId}', '${accountId}', 'Test', 'expense', 100, NOW(), 'KES', NOW(), NOW());
        INSERT INTO "AuditLog" (id, "userId", action, resource, metadata, "createdAt") 
        VALUES ('${uuidv4()}', '${userId}', 'CREATE', 'Tx', '{}', NOW());
        COMMIT;
      `);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
