import { NextRequest } from "next/server";
import { z } from "zod";
import { created, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { upsertConfigurationItem } from "@/lib/services/settingsService";

const schema = z.object({ label: z.string().min(2), active: z.boolean().default(true), value: z.unknown().optional() });
export async function GET() { try { return ok(await prisma.configurationItem.findMany({ where: { category: { name: "order-types" } } })); } catch (error) { return handleApiError(error); } }
export async function POST(request: NextRequest) { try { return created(await upsertConfigurationItem("order-types", schema.parse(await request.json()) as never)); } catch (error) { return handleApiError(error); } }
