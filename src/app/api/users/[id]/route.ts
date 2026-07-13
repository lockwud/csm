import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "DISPATCHER", "SUPPORT", "FINANCE", "CLIENT", "RIDER"]).optional(),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]).optional(),
  department: z.string().optional(),
  password: z.string().min(8).optional().or(z.literal("")),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = updateUserSchema.parse(await request.json());
    const existing = await prisma.user.findUnique({ where: { id }, include: { client: true, rider: true } });
    const nextRole = input.role ?? existing?.role;
    const relationData =
      nextRole === "CLIENT" && !existing?.client
        ? {
            client: {
              create: {
                businessName: input.department || input.name || existing?.name || "Client",
                contactName: input.name || existing?.name || "Client",
                phone: input.phone || existing?.phone || "0000000000",
                email: input.email || existing?.email || undefined,
              },
            },
            rider: existing?.rider ? { disconnect: true } : undefined,
          }
        : nextRole === "RIDER" && !existing?.rider
          ? {
              rider: {
                create: {
                  name: input.name || existing?.name || "Rider",
                  phone: input.phone || existing?.phone || `rider-${Date.now()}`,
                  zone: input.department || "Accra",
                  status: "OFFLINE" as const,
                },
              },
              client: existing?.client ? { disconnect: true } : undefined,
            }
          : nextRole !== "CLIENT" && nextRole !== "RIDER"
            ? {
                client: existing?.client ? { disconnect: true } : undefined,
                rider: existing?.rider ? { disconnect: true } : undefined,
              }
            : {};
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        status: input.status,
        ...relationData,
        profile: {
          upsert: {
            create: { jobTitle: input.department || "Operations" },
            update: { jobTitle: input.department },
          },
        },
        security: input.password
          ? {
              upsert: {
                create: { passwordHash: hashPassword(input.password), lastPasswordChangedAt: new Date() },
                update: { passwordHash: hashPassword(input.password), lastPasswordChangedAt: new Date() },
              },
            }
          : undefined,
      },
      include: { profile: true, client: true, rider: true },
    });
    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
