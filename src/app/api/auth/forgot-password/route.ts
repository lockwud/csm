import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError, ok } from "@/lib/api/response";
import {
  createOtp,
  emailOtpResendCooldownSeconds,
  emailOtpTtlMinutes,
  encodeOtpCookie,
  encodeOtpRateCookie,
  nextOtpRate,
  otpCookiePayload,
  verifyOtpCookie,
} from "@/lib/auth/emailOtp";
import { hashPassword } from "@/lib/auth/session";
import { sendForgotPasswordEmail } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  action: z.enum(["send-otp", "reset-password"]).default("send-otp"),
  email: z.string().email(),
  otp: z.string().length(6).optional(),
  password: z.string().min(8).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const isForm = contentType.includes("form");
    const body = isForm ? Object.fromEntries(await request.formData()) : await request.json();
    const input = schema.parse(body);
    const email = input.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (input.action === "reset-password") {
      if (!input.otp || !input.password) throw new ApiError(422, "Enter the code and your new password.");
      if (!verifyOtpCookie(request.cookies.get("password_reset_otp")?.value, email, input.otp)) {
        throw new ApiError(422, "Enter the valid password reset code sent to your email.");
      }

      if (user) {
        const passwordHash = hashPassword(input.password);
        await prisma.userSecurity.upsert({
          where: { userId: user.id },
          update: {
            passwordHash,
            lastPasswordChangedAt: new Date(),
          },
          create: {
            userId: user.id,
            passwordHash,
            lastPasswordChangedAt: new Date(),
          },
        });
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: "UPDATE",
            entityType: "User",
            entityId: user.id,
            message: "Password was reset with email OTP",
          },
        });
      }

      const response = ok({ message: "Your password has been reset. You can now sign in." });
      response.cookies.delete("password_reset_otp");
      response.cookies.delete("password_reset_otp_rate");
      return response;
    }

    const rate = nextOtpRate(request.cookies.get("password_reset_otp_rate")?.value, email);
    if (!rate.allowed) {
      throw new ApiError(429, `Please wait ${rate.retryAfterSeconds} seconds before requesting another code.`, { retryAfterSeconds: rate.retryAfterSeconds });
    }

    if (user) {
      const otp = createOtp();
      await sendForgotPasswordEmail({
        to: user.email,
        name: user.name,
        otp,
        expiresMinutes: emailOtpTtlMinutes,
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

      const response = ok({ message: "If the account exists, a reset code has been sent.", expiresMinutes: emailOtpTtlMinutes, resendAfterSeconds: emailOtpResendCooldownSeconds });
      response.cookies.set("password_reset_otp", encodeOtpCookie(otpCookiePayload(email, otp)), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: emailOtpTtlMinutes * 60,
      });
      response.cookies.set("password_reset_otp_rate", encodeOtpRateCookie(rate.payload), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 15 * 60,
      });
      return response;
    }

    if (isForm) return NextResponse.redirect(new URL("/login?reset=requested", request.url), { status: 303 });
    const response = ok({ message: "If the account exists, a reset code has been sent.", expiresMinutes: emailOtpTtlMinutes, resendAfterSeconds: emailOtpResendCooldownSeconds });
    response.cookies.set("password_reset_otp_rate", encodeOtpRateCookie(rate.payload), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 15 * 60,
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
