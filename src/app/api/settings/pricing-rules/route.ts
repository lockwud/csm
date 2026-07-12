import { NextRequest } from "next/server";
import { z } from "zod";
import { created, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({ zoneId: z.string().optional(), deliveryType: z.enum(["STANDARD", "EXPRESS", "SAME_DAY", "SCHEDULED", "BULK"]).default("STANDARD"), baseFee: z.coerce.number().default(0), perKmFee: z.coerce.number().default(0), codFeePercent: z.coerce.number().default(0), active: z.boolean().default(true) });
export async function GET() { try { return ok(await prisma.pricingRule.findMany({ include: { zone: true } })); } catch (error) { return handleApiError(error); } }
export async function POST(request: NextRequest) { try { return created(await prisma.pricingRule.create({ data: schema.parse(await request.json()) })); } catch (error) { return handleApiError(error); } }
