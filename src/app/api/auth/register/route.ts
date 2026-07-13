import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, created, handleApiError } from "@/lib/api/response";
import { verifyOtpCookie } from "@/lib/auth/emailOtp";
import { createSessionCookie, hashPassword } from "@/lib/auth/session";
import { sendAccountVerifiedEmail } from "@/lib/email/mailer";
import { homeForRole } from "@/lib/auth/roleHome";
import { prisma } from "@/lib/prisma";

const optionalText = z.preprocess((value) => value === "" ? undefined : value, z.string().optional());
const optionalNumber = z.preprocess((value) => value === "" || value === undefined ? undefined : Number(value), z.number().min(0).optional());
const ghanaCardRegex = /^GHA-\d{9}-\d$/i;
const ghanaDriverLicenseRegex = /^[A-Z]{1,3}[- ]?\d{6,10}(?:[- ]?[A-Z0-9])?$/i;

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  emailOtp: z.string().length(6),
  password: z.string().min(8),
  phone: z.string().min(6),
  role: z.enum(["CLIENT", "RIDER"]).default("CLIENT"),
  businessName: optionalText,
  contactName: optionalText,
  clientPurpose: optionalText,
  pickupArea: optionalText,
  mainPackageType: optionalText,
  zone: optionalText,
  address: optionalText,
  idNumber: optionalText,
  riderLicenseNumber: optionalText,
  yearsExperience: optionalNumber,
  preferredArea: optionalText,
  vehicleType: z.enum(["MOTORBIKE", "SALOON", "PICKUP", "VAN", "TRUCK"]).default("MOTORBIKE"),
  registrationNumber: optionalText,
  licensePlate: optionalText,
  vehicleLicenseNumber: optionalText,
  emergencyName: optionalText,
  emergencyPhone: optionalText,
  emergencyRelationship: optionalText,
  verificationConsent: optionalText,
}).superRefine((input, context) => {
  if (input.role !== "RIDER") return;

  const requiredFields: Array<keyof typeof input> = [
    "zone",
    "address",
    "idNumber",
    "riderLicenseNumber",
    "registrationNumber",
    "licensePlate",
    "vehicleLicenseNumber",
    "emergencyName",
    "emergencyPhone",
    "emergencyRelationship",
  ];

  for (const field of requiredFields) {
    if (!input[field]) {
      context.addIssue({
        code: "custom",
        path: [field],
        message: "Required for rider verification",
      });
    }
  }

  if (input.verificationConsent !== "yes") {
    context.addIssue({
      code: "custom",
      path: ["verificationConsent"],
      message: "Rider verification consent is required",
    });
  }

  if (input.idNumber && !ghanaCardRegex.test(input.idNumber.trim())) {
    context.addIssue({
      code: "custom",
      path: ["idNumber"],
      message: "Enter a valid Ghana Card / ECOWAS ID number, for example GHA-123456789-1",
    });
  }

  if (input.riderLicenseNumber && !ghanaDriverLicenseRegex.test(input.riderLicenseNumber.trim())) {
    context.addIssue({
      code: "custom",
      path: ["riderLicenseNumber"],
      message: "Enter a valid Ghana rider or driver license number, for example D123456789",
    });
  }
});

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("form") ? Object.fromEntries(await request.formData()) : await request.json();
    const input = schema.parse(body);
    if (!verifyOtpCookie(request.cookies.get("signup_email_otp")?.value, input.email, input.emailOtp)) {
      throw new ApiError(422, "Enter the verification code sent to your email.");
    }
    const isRider = input.role === "RIDER";
    const onboardingPreferences = isRider
      ? {
          onboardingType: "RIDER",
          verificationStatus: "PENDING_REVIEW",
          address: input.address,
          idNumber: input.idNumber,
          riderLicenseNumber: input.riderLicenseNumber,
          yearsExperience: input.yearsExperience,
          preferredArea: input.preferredArea,
          vehicle: {
            type: input.vehicleType,
            registrationNumber: input.registrationNumber,
            licensePlate: input.licensePlate,
            vehicleLicenseNumber: input.vehicleLicenseNumber,
          },
          emergencyContact: {
            name: input.emergencyName,
            phone: input.emergencyPhone,
            relationship: input.emergencyRelationship,
          },
          verificationConsent: input.verificationConsent === "yes",
          submittedAt: new Date().toISOString(),
        }
      : {
          onboardingType: "CLIENT",
          clientPurpose: input.clientPurpose,
          pickupArea: input.pickupArea,
          mainPackageType: input.mainPackageType,
          submittedAt: new Date().toISOString(),
        };

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        client: input.role === "CLIENT"
          ? {
              create: {
                businessName: input.businessName || input.name,
                contactName: input.contactName || input.name,
                phone: input.phone,
                email: input.email,
              },
            }
          : undefined,
        rider: input.role === "RIDER"
          ? {
              create: {
                name: input.name,
                phone: input.phone,
                zone: input.zone || "Accra",
                vehicleType: input.vehicleType,
                status: "OFFLINE",
              },
            }
          : undefined,
        security: { create: { passwordHash: hashPassword(input.password), lastPasswordChangedAt: new Date() } },
        profile: { create: { preferences: onboardingPreferences } },
      },
      include: { client: true, rider: true },
    });
    await createSessionCookie({ sub: user.id, email: user.email, name: user.name, role: user.role, clientId: user.clientId, riderId: user.riderId, exp: 0 });
    const redirectTo = homeForRole(user.role);
    await sendAccountVerifiedEmail({
      to: user.email,
      name: user.name,
      role: user.role,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin}${redirectTo}`,
    });
    if (contentType.includes("form")) {
      const response = NextResponse.redirect(new URL(redirectTo, request.url), { status: 303 });
      response.cookies.delete("signup_email_otp");
      return response;
    }
    const response = created({ id: user.id, email: user.email, role: user.role, redirectTo });
    response.cookies.delete("signup_email_otp");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
