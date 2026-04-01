import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import {
  registerRequestSchema,
  loginRequestSchema,
  authResponseSchema,
  errorResponseSchema,
  logoutResponseSchema,
  meResponseSchema,
  type RegisterRequest,
  type LoginRequest,
  type AuthResponse,
  type ErrorResponse,
  type LogoutResponse,
  type MeResponse,
  type JWTPayload
} from '../schemas/auth.schemas.js';

export class AuthController {
  /**
   * Handle user registration
   */
  static async register(
    request: FastifyRequest<{ Body: RegisterRequest }>,
    reply: FastifyReply
  ): Promise<AuthResponse | ErrorResponse> {
    try {
      // Validate input with Zod
      const validatedData = registerRequestSchema.parse(request.body);

      // Register user via auth service
      const { user, token } = await AuthService.register(validatedData);

      // Set HTTP-only cookie
      reply.setCookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours in seconds
        path: '/'
      });

      // Validate and return response
      const response = authResponseSchema.parse({
        user,
        message: 'User registered successfully'
      });

      return reply.code(201).send(response);

    } catch (error: any) {
      return AuthController.handleError(error, reply, 'registration');
    }
  }

  /**
   * Handle user login
   */
  static async login(
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply
  ): Promise<AuthResponse | ErrorResponse> {
    try {
      // Validate input with Zod
      const validatedData = loginRequestSchema.parse(request.body);

      // Login user via auth service
      const result = await AuthService.login(validatedData);

      if (!result) {
        const errorResponse = errorResponseSchema.parse({
          error: 'Authentication Failed',
          message: 'Invalid email or password',
          statusCode: 401
        });
        return reply.code(401).send(errorResponse);
      }

      const { user, token } = result;

      // Set HTTP-only cookie
      reply.setCookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours in seconds
        path: '/'
      });

      // Validate and return response
      const response = authResponseSchema.parse({
        user,
        message: 'Login successful'
      });

      return reply.send(response);

    } catch (error: any) {
      return AuthController.handleError(error, reply, 'login');
    }
  }

  /**
   * Handle user logout
   */
  static async logout(
    _request: FastifyRequest,
    reply: FastifyReply
  ): Promise<LogoutResponse | ErrorResponse> {
    try {
      // Clear the authentication cookie
      reply.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development',
        sameSite: 'strict',
        path: '/'
      });

      // Validate and return response
      const response = logoutResponseSchema.parse({
        message: 'Logged out successfully'
      });

      return reply.send(response);

    } catch (error: any) {
      return AuthController.handleError(error, reply, 'logout');
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<MeResponse | ErrorResponse> {
    try {
      const userPayload = (request as any).user as JWTPayload;

      if (!userPayload) {
        const errorResponse = errorResponseSchema.parse({
          error: 'Authentication Failed',
          message: 'User not authenticated',
          statusCode: 401
        });
        return reply.code(401).send(errorResponse);
      }

      // Get current user data via auth service
      const user = await AuthService.getCurrentUser(userPayload);

      // Validate and return response
      const response = meResponseSchema.parse({ user });

      return reply.send(response);

    } catch (error: any) {
      return AuthController.handleError(error, reply, 'get current user');
    }
  }

  /**
   * Centralized error handling
   */
  private static handleError(
    error: any,
    reply: FastifyReply,
    operation: string
  ): ErrorResponse {
    // Log error for debugging
    console.error(`${operation} error:`, error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorResponse = errorResponseSchema.parse({
        error: 'Validation Error',
        message: error.errors.map(e => e.message).join(', '),
        statusCode: 400
      });
      reply.code(400).send(errorResponse);
      return errorResponse;
    }

    // Handle known business logic errors
    if (error.message.includes('Email already exists') ||
      error.message.includes('Username already exists')) {
      const errorResponse = errorResponseSchema.parse({
        error: 'Conflict',
        message: error.message,
        statusCode: 409
      });
      reply.code(409).send(errorResponse);
      return errorResponse;
    }

    if (error.message.includes('Password validation failed')) {
      const errorResponse = errorResponseSchema.parse({
        error: 'Password Validation Error',
        message: error.message,
        statusCode: 400
      });
      reply.code(400).send(errorResponse);
      return errorResponse;
    }

    if (error.message.includes('User not found')) {
      const errorResponse = errorResponseSchema.parse({
        error: 'Not Found',
        message: error.message,
        statusCode: 404
      });
      reply.code(404).send(errorResponse);
      return errorResponse;
    }

    // Handle generic server errors
    const errorResponse = errorResponseSchema.parse({
      error: 'Internal Server Error',
      message: `An unexpected error occurred during ${operation}`,
      statusCode: 500
    });
    reply.code(500).send(errorResponse);
    return errorResponse;
  }
}