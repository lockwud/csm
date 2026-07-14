export type JsonValue = unknown;
export type JsonObject = Record<string, unknown>;

export function asJsonObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}
