import { prisma } from './prisma';

export async function logActivity({
  userId,
  action,
  resource,
  metadata = null,
  ipAddress = null,
}: {
  userId: string;
  action: string;
  resource: string;
  metadata?: any;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
