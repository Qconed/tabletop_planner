import type { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller.js';
import { 
  fastifySchemas,
  type RegisterRequest,
  type LoginRequest,
  type AuthResponse,
  type ErrorResponse,
  type LogoutResponse,
  type MeResponse
} from '../schemas/auth.schemas.js';

export default async function authRoutes(fastify: FastifyInstance) {
  // Register endpoint
  fastify.post<{
    Body: RegisterRequest;
    Reply: AuthResponse | ErrorResponse;
  }>('/register', {
    schema: {
      body: fastifySchemas.registerRequest
    }
  }, AuthController.register);

  // Login endpoint
  fastify.post<{
    Body: LoginRequest;
    Reply: AuthResponse | ErrorResponse;
  }>('/login', {
    schema: {
      body: fastifySchemas.loginRequest
    }
  }, AuthController.login);

  // Logout endpoint
  fastify.post<{
    Reply: LogoutResponse | ErrorResponse;
  }>('/logout', AuthController.logout);

  // Protected route to get current user
  fastify.get<{
    Reply: MeResponse | ErrorResponse;
  }>('/me', {
    preHandler: fastify.authenticate
  }, AuthController.getCurrentUser);
}