import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  EXTERNAL_API_TIMEOUT_MS: z.coerce.number().default(5000),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;

export const features = {
  ai: !!env.GOOGLE_GENERATIVE_AI_API_KEY,
  email: !!env.RESEND_API_KEY,
  redis: !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
};
