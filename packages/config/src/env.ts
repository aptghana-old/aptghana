import { z } from "zod";

// Schema-validated accessor for process.env. Additive: existing direct
// `process.env.X` reads elsewhere in the codebase are untouched by this —
// this is the documented pattern for new code (see ARCHITECTURE.md).
const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  MEILISEARCH_HOST: z.string().min(1),
  MEILISEARCH_ADMIN_KEY: z.string().min(1),
  MEILISEARCH_SEARCH_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  PAYSTACK_SECRET_KEY: z.string().min(1),
  ODOO_URL: z.string().min(1),
  ODOO_DB: z.string().min(1),
  STORAGE_ENDPOINT: z.string().min(1),
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(1),
  STORAGE_BUCKET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().min(1),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (!cached) {
    cached = envSchema.parse(process.env);
  }
  return cached;
}
