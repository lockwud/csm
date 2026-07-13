import { NextRequest } from "next/server";
import { z } from "zod";
import { created, handleApiError, ok } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "DISPATCHER", "SUPPORT", "FINANCE", "CLIENT", "RIDER"]),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]).default("ACTIVE"),
  department: z.string().optional(),
  password: z.string().min(8).optional(),
});

function relationData(input: z.infer<typeof userSchema>) {
  if (input.role === "CLIENT") {
    return {
      client: {
        create: {
          businessName: input.department || input.name,
          contactName: input.name,
          phone: input.phone || "0000000000",
          email: input.email,
        },
      },
    };
  }

  if (input.role === "RIDER") {
    return {
      rider: {
        create: {
          name: input.name,
          phone: input.phone || `rider-${Date.now()}`,
          zone: input.department || "Accra",
          status: "OFFLINE" as const,
        },
      },
    };
  }

  return {};
}

export async function GET() {
  try {
    return ok(await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { profile: true, client: true, rider: true },
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = userSchema.parse(await request.json());
    const password = input.password || `Sankofa@${new Date().getFullYear()}`;
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        status: input.status,
        ...relationData(input),
        profile: { create: { jobTitle: input.department || (input.role === "SUPER_ADMIN" ? "System Administrator" : "Operations") } },
        security: { create: { passwordHash: hashPassword(password), lastPasswordChangedAt: new Date() } },
      },
      include: { profile: true, client: true, rider: true },
    });
    return created({ user, temporaryPassword: input.password ? undefined : password });
  } catch (error) {
    return handleApiError(error);
  }
}
