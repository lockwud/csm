import { createHash, randomInt, timingSafeEqual } from "crypto";

const OTP_TTL_MINUTES = 10;
const OTP_RATE_WINDOW_MINUTES = 15;
const OTP_RATE_MAX_REQUESTS = 3;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

function secret() {
  return process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "sankofa-dev-secret";
}

export function createOtp() {
  return String(randomInt(100000, 999999));
}

export function hashOtp(email: string, otp: string) {
  return createHash("sha256").update(`${email.toLowerCase()}:${otp}:${secret()}`).digest("hex");
}

export function otpCookiePayload(email: string, otp: string) {
  return {
    email: email.toLowerCase(),
    hash: hashOtp(email, otp),
    expiresAt: Date.now() + OTP_TTL_MINUTES * 60_000,
  };
}

export function encodeOtpCookie(payload: ReturnType<typeof otpCookiePayload>) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeOtpCookie(value?: string) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as ReturnType<typeof otpCookiePayload>;
    if (!parsed.email || !parsed.hash || !parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function verifyOtpCookie(value: string | undefined, email: string, otp: string) {
  const payload = decodeOtpCookie(value);
  if (!payload || payload.expiresAt < Date.now() || payload.email !== email.toLowerCase()) return false;
  const expected = Buffer.from(payload.hash);
  const actual = Buffer.from(hashOtp(email, otp));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const emailOtpTtlMinutes = OTP_TTL_MINUTES;
export const emailOtpRateWindowMinutes = OTP_RATE_WINDOW_MINUTES;
export const emailOtpRateMaxRequests = OTP_RATE_MAX_REQUESTS;
export const emailOtpResendCooldownSeconds = OTP_RESEND_COOLDOWN_SECONDS;

type OtpRatePayload = {
  email: string;
  count: number;
  windowStartedAt: number;
  lastSentAt: number;
};

export function encodeOtpRateCookie(payload: OtpRatePayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeOtpRateCookie(value?: string): OtpRatePayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as OtpRatePayload;
    if (!parsed.email || !parsed.count || !parsed.windowStartedAt || !parsed.lastSentAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function nextOtpRate(value: string | undefined, email: string) {
  const now = Date.now();
  const existing = decodeOtpRateCookie(value);
  const normalizedEmail = email.toLowerCase();
  const windowMs = OTP_RATE_WINDOW_MINUTES * 60_000;
  const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;

  if (!existing || existing.email !== normalizedEmail || now - existing.windowStartedAt > windowMs) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
      payload: { email: normalizedEmail, count: 1, windowStartedAt: now, lastSentAt: now },
    };
  }

  if (now - existing.lastSentAt < cooldownMs) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((cooldownMs - (now - existing.lastSentAt)) / 1000),
      payload: existing,
    };
  }

  if (existing.count >= OTP_RATE_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((windowMs - (now - existing.windowStartedAt)) / 1000),
      payload: existing,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    payload: { ...existing, count: existing.count + 1, lastSentAt: now },
  };
}
