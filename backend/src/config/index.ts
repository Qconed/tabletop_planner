// Central configuration exports
export { env, type Env } from './env.js';

// Database configuration will be added here later
// export { dbConfig } from './database.js';

// Server configuration
export const serverConfig = {
  // Fastify server options
  trustProxy: process.env.NODE_ENV === 'production',
  logger: process.env.NODE_ENV === 'development' ? true : {
    level: 'warn'
  }
} as const;