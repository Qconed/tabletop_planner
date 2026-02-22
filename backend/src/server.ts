import Fastify from 'fastify';
import { env, serverConfig } from './config/index.js';

async function buildFastify() {
  const fastify = Fastify({
    logger: serverConfig.logger 
  });

  // Register basic plugins
  await fastify.register(import('@fastify/helmet')); // Security headers
  await fastify.register(import('@fastify/cors'), {
    origin: env.FRONTEND_ORIGIN,
    credentials: true // Important for cookies
  });

  // Register cookie support for HTTP-only cookies
  await fastify.register(import('@fastify/cookie'));

  // Register authentication middleware
  await fastify.register(import('./utils/auth-middleware.js'));

  // Register routes
  await fastify.register(import('./routes/auth.routes.js'), { prefix: '/api/auth' });

  // Health check route
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV 
    };
  });

  // Main route
  fastify.get('/', async (request, reply) => {
    return { 
      message: 'Fastify server is running!',
      version: '1.0.0',
      environment: env.NODE_ENV 
    };
  });

  return fastify;
}

// Run the server
const start = async () => {
  try {
    const fastify = await buildFastify();
    
    await fastify.listen({ 
      port: env.PORT, 
      host: env.HOST 
    });
    console.log(`Server is running on ${env.HOST}:${env.PORT} in ${env.NODE_ENV} mode`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start();