import type { z } from "zod";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Validates `raw` against `schema`, returning a discriminated result so every
 * route gets identical error formatting instead of hand-rolled field checks. */
export function parseBody<T>(schema: z.ZodType<T>, raw: unknown): ParseResult<T> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "Invalid request body" };
  }
  return { ok: true, data: result.data };
}
