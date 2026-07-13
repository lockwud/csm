import type { NextRequest } from "next/server";
import type { z } from "zod";
import { created, handleApiError, ok } from "./response";

export async function listRoute<T>(request: NextRequest, handler: (request: NextRequest) => Promise<T>) {
  try {
    return ok(await handler(request));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function createRoute<T>(schema: z.ZodType, request: NextRequest, handler: (data: z.infer<typeof schema>) => Promise<T>) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await request.json() : Object.fromEntries(await request.formData());
    return created(await handler(schema.parse(body)));
  } catch (error) {
    return handleApiError(error);
  }
}
