import { NextRequest } from "next/server";
import { z } from "zod";
import { created, handleApiError } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "DISPATCHER", "SUPPORT", "FINANCE", "CLIENT", "RIDER"]).default("ADMIN"),
});

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("form") ? Object.fromEntries(await request.formData()) : await request.json();
    const input = schema.parse(body);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        security: { create: { passwordHash: hashPassword(input.password), lastPasswordChangedAt: new Date() } },
        profile: { create: {} },
      },
    });
    return created({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    return handleApiError(error);
  }
}
