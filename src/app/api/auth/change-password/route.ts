import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return fail(401, "Authentication required");

    const input = schema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { id: session.sub }, include: { security: true } });
    if (!user?.security || !verifyPassword(input.currentPassword, user.security.passwordHash)) {
      return fail(400, "Current password is incorrect");
    }

    await prisma.userSecurity.update({
      where: { userId: user.id },
      data: {
        passwordHash: hashPassword(input.newPassword),
        lastPasswordChangedAt: new Date(),
      },
    });

    return ok({ changed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
