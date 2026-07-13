import { NextRequest } from "next/server";
import { z } from "zod";
import { created, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({ name: z.string().min(2), city: z.string().min(2), region: z.string().optional(), baseFee: z.coerce.number().default(0), active: z.boolean().default(true) });
export async function GET() { try { return ok(await prisma.serviceZone.findMany({ include: { pricingRules: true } })); } catch (error) { return handleApiError(error); } }
export async function POST(request: NextRequest) { try { return created(await prisma.serviceZone.create({ data: schema.parse(await request.json()) })); } catch (error) { return handleApiError(error); } }
