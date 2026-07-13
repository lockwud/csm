import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fail, handleApiError } from "@/lib/api/response";
import {
  createOtp,
  emailOtpRateMaxRequests,
  emailOtpRateWindowMinutes,
  emailOtpTtlMinutes,
  encodeOtpCookie,
  encodeOtpRateCookie,
  nextOtpRate,
  otpCookiePayload,
} from "@/lib/auth/emailOtp";
import { sendSignupOtpEmail } from "@/lib/email/mailer";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await request.json());
    const rate = nextOtpRate(request.cookies.get("signup_email_otp_rate")?.value, input.email);
    if (!rate.allowed) {
      return fail(429, `Please wait ${rate.retryAfterSeconds} seconds before requesting another code.`);
    }

    const otp = createOtp();
    const result = await sendSignupOtpEmail({
      to: input.email,
      name: input.name,
      otp,
      expiresMinutes: emailOtpTtlMinutes,
    });

    const response = NextResponse.json({
      ok: true,
      data: { sent: result.sent, expiresMinutes: emailOtpTtlMinutes },
      message: result.sent ? "Verification code sent" : "Verification code generated",
    });
    response.cookies.set("signup_email_otp", encodeOtpCookie(otpCookiePayload(input.email, otp)), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: emailOtpTtlMinutes * 60,
      path: "/",
    });
    response.cookies.set("signup_email_otp_rate", encodeOtpRateCookie(rate.payload), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: emailOtpRateWindowMinutes * 60,
      path: "/",
    });
    response.headers.set("X-RateLimit-Limit", String(emailOtpRateMaxRequests));
    response.headers.set("X-RateLimit-Remaining", String(Math.max(0, emailOtpRateMaxRequests - rate.payload.count)));
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
