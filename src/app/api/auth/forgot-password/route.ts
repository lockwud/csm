import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { sendForgotPasswordEmail } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const isForm = contentType.includes("form");
    const body = isForm ? Object.fromEntries(await request.formData()) : await request.json();
    const input = schema.parse(body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (user) {
      await sendForgotPasswordEmail({
        to: user.email,
        name: user.name,
        resetUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin}/forgot-password`,
      });
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "UPDATE",
          entityType: "User",
          entityId: user.id,
          message: "Password reset was requested",
        },
      });
    }

    if (isForm) return NextResponse.redirect(new URL("/login?reset=requested", request.url), { status: 303 });
    return ok({ message: "If the account exists, reset support has been notified." });
  } catch (error) {
    return handleApiError(error);
  }
}
