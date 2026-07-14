import type { Prisma } from "@prisma/client";
import type { AuditAction } from "@/lib/types/prismaEnums";
import { prisma } from "@/lib/prisma";

export async function auditLog(input: {
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  message?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      message: input.message,
      metadata: input.metadata,
    },
  });
}
