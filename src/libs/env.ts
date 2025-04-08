import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    ENCRYPTION_KEY: z.string(),
    UPSTASH_VECTOR_REST_URL: z.string(),
    UPSTASH_VECTOR_REST_TOKEN: z.string(),
});

const env = envSchema.parse(process.env);

export default env;
