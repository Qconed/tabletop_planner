import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env files
// Try to load from parent directory first (for Docker), then fallback to current directory
dotenvConfig({ path: '../.env.dev' });
dotenvConfig({ path: '.env.dev' });
dotenvConfig(); // Also load from default .env if it exists

// Define the schema for environment variables
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // Database Configuration  
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // CORS Configuration
  FRONTEND_ORIGIN: z.string().url('FRONTEND_ORIGIN must be a valid URL').default('http://localhost:4200'),
});

// Parse and validate environment variables
function validateEnv() {
  try {
    const parsed = envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      HOST: process.env.HOST,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
    });

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // log the zod errors obtained
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      throw new Error(`Environment validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}

// Export the validated configuration
export const env = validateEnv();

// Export the type for use throughout the application
export type Env = typeof env;