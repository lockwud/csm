import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signSession, verifySession, type SessionPayload } from "./jwt";

export const sessionCookieName = "sankofa_session";

export function hashPassword(password: string) {
  const salt = crypto.randomUUID().replaceAll("-", "");
  const hash = pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$310000$${salt}$${hash}`;
}

export function verifyPassword(password: string, passwordHash?: string | null) {
  if (!passwordHash) return false;
  const [algorithm, iterations, salt, hash] = passwordHash.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterations || !salt || !hash) return false;
  const candidate = pbkdf2Sync(password, salt, Number(iterations), 32, "sha256").toString("hex");
  return hash.length === candidate.length && timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

export async function createSessionCookie(user: SessionPayload) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, signSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getSession() {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(sessionCookieName)?.value);
}

export async function requireUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.sub },
    include: { profile: true, security: true, client: true, rider: true },
  });
}
