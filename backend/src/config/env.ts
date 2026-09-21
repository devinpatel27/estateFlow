import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.union([z.string(), z.number()]).default(3000).transform(Number),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/realview-crm'),
  JWT_SECRET: z.string().default('realview_realty_crm_super_secure_jwt_secret_key_2026_xyz'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ADMIN_NAME: z.string().default('Master Admin'),
  ADMIN_EMAIL: z.string().default('admin@realviewrealty.com'),
  ADMIN_PASSWORD: z.string().default('Admin@12345'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.union([z.string(), z.number()]).default(5242880).transform(Number),
  FRONTEND_URL: z.string().default('https://crm.realviewrealty.com'),
  WEBSITE_URL: z.string().default('https://realviewrealty.com'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('⚠️ Environment variable parsing issues:', parsed.error.flatten().fieldErrors);
}

export const env = parsed.success
  ? parsed.data
  : envSchema.parse({ ...process.env, PORT: process.env.PORT || 5000 });
export type Env = typeof env;
