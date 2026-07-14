import { createHmac, timingSafeEqual } from "node:crypto";
import type { UserRole } from "@/lib/types/prismaEnums";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  clientId?: string | null;
  riderId?: string | null;
  exp: number;
};

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function secret() {
  return process.env.JWT_SECRET || "local-dev-secret-change-me";
}

export function signSession(payload: Omit<SessionPayload, "exp">, ttlSeconds = 60 * 60 * 24 * 7) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  const signature = createHmac("sha256", secret()).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifySession(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = createHmac("sha256", secret()).update(`${header}.${body}`).digest("base64url");
  const valid =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
}
