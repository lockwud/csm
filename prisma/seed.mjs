import { createHash, pbkdf2Sync, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$310000$${salt}$${hash}`;
}

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@sankofaexpress.com" },
    include: { security: true, profile: true },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "admin@sankofaexpress.com",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        profile: {
          create: {
            jobTitle: "System Administrator",
            timezone: "Africa/Accra",
          },
        },
        security: {
          create: {
            passwordHash: hashPassword("Admin@2026"),
            lastPasswordChangedAt: new Date(),
            recoveryCodesHash: [
              createHash("sha256").update("sankofa-recovery").digest("hex"),
            ],
          },
        },
      },
    });
    console.log("SUPER_ADMIN created: admin@sankofaexpress.com / Admin@2026");
  } else {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        name: "Super Admin",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        profile: existingAdmin.profile
          ? {
              update: {
                jobTitle: existingAdmin.profile.jobTitle ?? "System Administrator",
                timezone: existingAdmin.profile.timezone ?? "Africa/Accra",
              },
            }
          : {
              create: {
                jobTitle: "System Administrator",
                timezone: "Africa/Accra",
              },
            },
        security: existingAdmin.security
          ? {
              update: {
                passwordHash: hashPassword("Admin@2026"),
                lastPasswordChangedAt: new Date(),
              },
            }
          : {
              create: {
                passwordHash: hashPassword("Admin@2026"),
                lastPasswordChangedAt: new Date(),
              },
            },
      },
    });
    console.log("SUPER_ADMIN reset: admin@sankofaexpress.com / Admin@2026");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
