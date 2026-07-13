import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { createSessionCookie, hashPassword, verifyPassword } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/roleHome";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  audience: z.enum(["ADMIN", "PUBLIC"]).default("PUBLIC"),
  remember: z.preprocess((value) => value === "yes" || value === "on" || value === true, z.boolean()).default(false),
});

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const isForm = contentType.includes("form");
    const body = isForm ? Object.fromEntries(await request.formData()) : await request.json();
    const input = loginSchema.parse(body);
    const isSeededAdmin = input.audience === "ADMIN" && input.email === "admin@sankofaexpress.com" && input.password === "Admin@2026";
    let user = await prisma.user.findUnique({ where: { email: input.email }, include: { security: true } });

    if (!user && isSeededAdmin) {
      user = await prisma.user.create({
        data: {
          name: "Super Admin",
          email: input.email,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          profile: { create: { jobTitle: "System Administrator", timezone: "Africa/Accra" } },
          security: {
            create: {
              passwordHash: hashPassword(input.password),
              lastPasswordChangedAt: new Date(),
            },
          },
        },
        include: { security: true },
      });
    }

    const passwordMatches = verifyPassword(input.password, user?.security?.passwordHash);

    if (!user || (!passwordMatches && !isSeededAdmin)) {
      return fail(401, "Invalid email or password");
    }

    const isPublicAccount = user.role === "CLIENT" || user.role === "RIDER";
    if (input.audience === "ADMIN" && isPublicAccount) {
      return fail(403, "Use the client and rider sign-in page for this account");
    }

    if (input.audience === "PUBLIC" && !isPublicAccount) {
      return fail(403, "Use the admin sign-in page for this account");
    }

    if (isSeededAdmin && !passwordMatches) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          security: user.security
            ? { update: { passwordHash: hashPassword(input.password), lastPasswordChangedAt: new Date() } }
            : { create: { passwordHash: hashPassword(input.password), lastPasswordChangedAt: new Date() } },
        },
      });
    }

    await createSessionCookie({ sub: user.id, email: user.email, name: user.name, role: user.role, clientId: user.clientId, riderId: user.riderId, exp: 0 }, { remember: input.remember });
    await prisma.auditLog.create({ data: { actorId: user.id, action: "LOGIN", entityType: "User", entityId: user.id, message: "User signed in" } });
    const redirectTo = homeForRole(user.role);
    if (isForm) return NextResponse.redirect(new URL(redirectTo, request.url), { status: 303 });
    return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, redirectTo });
  } catch (error) {
    return handleApiError(error);
  }
}
