// Environment validation schema
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),
  
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'Clerk publishable key required'),
  CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key required'),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/onboarding'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/onboarding'),
  
  // AI Services
  GEMINI_API_KEY: z.string().min(1, 'Gemini API key required'),
  
  // Inngest
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  
  // Optional services
  REDIS_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  ANALYTICS_ID: z.string().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VERCEL_URL: z.string().optional(),
});

// Validate environment variables
export const env = envSchema.parse(process.env);

// Environment-specific configurations
export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // API URLs
  baseUrl: env.VERCEL_URL 
    ? `https://${env.VERCEL_URL}` 
    : 'http://localhost:3000',
    
  // Feature flags
  features: {
    analytics: !!env.ANALYTICS_ID,
    errorReporting: !!env.SENTRY_DSN,
    redis: !!env.REDIS_URL,
  }
};

// Export validated environment
export default env;
