import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8080),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  
  // Security
  WEBHOOK_SECRET: z.string().min(16, 'Webhook secret must be at least 16 characters'),
  CORS_ORIGIN: z.string().default('*'),
  
  // External services
  ORCHESTRATOR_URL: z.string().url('Invalid orchestrator URL'),
  
  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().default(60000),
  
  // Timeouts
  HTTP_TIMEOUT: z.coerce.number().default(30000),
  ORCHESTRATOR_TIMEOUT: z.coerce.number().default(60000),
  
  // Developer context
  DEV_ID: z.string().default('dev')
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
