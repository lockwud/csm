import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiResult<T> = {
  ok: true;
  data: T;
  message?: string;
};

export type ApiFailure = {
  ok: false;
  error: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function ok<T>(data: T, init?: ResponseInit & { message?: string }) {
  return NextResponse.json<ApiResult<T>>(
    { ok: true, data, message: init?.message },
    { status: init?.status ?? 200, headers: init?.headers },
  );
}

export function created<T>(data: T, message = "Created") {
  return ok(data, { status: 201, message });
}

export function fail(status: number, error: string, details?: unknown) {
  return NextResponse.json<ApiFailure>({ ok: false, error, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.status, error.message, error.details);
  }

  if (error instanceof ZodError) {
    return fail(422, "Validation failed", error.flatten());
  }

  console.error(error);
  return fail(500, "Something went wrong. Please try again.");
}

export function apiError(error: unknown, fallback = "Request failed.") {
  if (error instanceof ApiError || error instanceof ZodError) {
    return handleApiError(error);
  }

  console.error(error);
  return fail(500, fallback);
}
