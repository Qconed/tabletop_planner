import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { JWTService } from '../services/jwt.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: { // user might be undefined when making the request, forces checking it
      userId: string;
      email: string;
      username: string;
    };
  }
}

export default async function authMiddleware(fastify: FastifyInstance) {
  // Register authentication decorator
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      let token: string | null = null;

      // Try to get token from HTTP-only cookie first
      if (request.cookies?.auth_token) {
        token = request.cookies.auth_token;
      } else {
        // Fallback to Authorization header for API clients
        const authHeader = request.headers.authorization;
        token = JWTService.extractTokenFromHeader(authHeader);
      }

      if (!token) {
        return reply.code(401).send({
          error: 'Authentication Required',
          message: 'No authentication token provided',
          statusCode: 401
        });
      }

      // Verify and decode token
      const payload = await JWTService.verifyToken(token);

      // Attach user info to request
      (request as any).user = payload;

    } catch (error: any) {
      fastify.log.error('Authentication error:', error);

      return reply.code(401).send({
        error: 'Authentication Failed',
        message: error.message || 'Invalid or expired token',
        statusCode: 401
      });
    }
  });
}