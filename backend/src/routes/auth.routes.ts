import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserService } from '../services/user.js';
import { JWTService } from '../services/jwt.js';
import type { AuthResponse, ErrorResponse } from '../models/auth.model.js';

// Input validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username too long'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export default async function authRoutes(fastify: FastifyInstance) {
  // Register endpoint
  fastify.post<{
    Body: z.infer<typeof registerSchema>;
    Reply: AuthResponse | ErrorResponse;
  }>('/register', {
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          username: { type: 'string', minLength: 3, maxLength: 30 },
          password: { type: 'string', minLength: 8 }
        },
        required: ['email', 'username', 'password']
      }
    }
  }, async (request, reply) => {
    try {
      // Validate input
      const validatedData = registerSchema.parse(request.body);

      // Create user
      const user = await UserService.createUser(validatedData);

      // Generate JWT token
      const token = await JWTService.generateToken({
        userId: user.id,
        email: user.email,
        username: user.username
      });

      // Set HTTP-only cookie
      reply.setCookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours in seconds
        path: '/'
      });

      return reply.code(201).send({
        user,
        message: 'User registered successfully'
      });

    } catch (error: any) {
      fastify.log.error('Registration error:', error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: error.errors.map(e => e.message).join(', '),
          statusCode: 400
        });
      }

      if (error.message.includes('Email already exists') || error.message.includes('Username already exists')) {
        return reply.code(409).send({
          error: 'Conflict',
          message: error.message,
          statusCode: 409
        });
      }

      if (error.message.includes('Password validation failed')) {
        return reply.code(400).send({
          error: 'Password Validation Error',
          message: error.message,
          statusCode: 400
        });
      }

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during registration',
        statusCode: 500
      });
    }
  });

  // Login endpoint
  fastify.post<{
    Body: z.infer<typeof loginSchema>;
    Reply: AuthResponse | ErrorResponse;
  }>('/login', {
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 }
        },
        required: ['email', 'password']
      }
    }
  }, async (request, reply) => {
    try {
      // Validate input
      const validatedData = loginSchema.parse(request.body);

      // Authenticate user
      const user = await UserService.authenticateUser(validatedData);

      if (!user) {
        return reply.code(401).send({
          error: 'Authentication Failed',
          message: 'Invalid email or password',
          statusCode: 401
        });
      }

      // Generate JWT token
      const token = await JWTService.generateToken({
        userId: user.id,
        email: user.email,
        username: user.username
      });

      // Set HTTP-only cookie
      reply.setCookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours in seconds
        path: '/'
      });

      return reply.send({
        user: UserService.toPublicUser(user),
        message: 'Login successful'
      });

    } catch (error: any) {
      fastify.log.error('Login error:', error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: error.errors.map(e => e.message).join(', '),
          statusCode: 400
        });
      }

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during login',
        statusCode: 500
      });
    }
  });

  // Logout endpoint
  fastify.post('/logout', async (request, reply) => {
    try {
      // Clear the authentication cookie
      reply.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      return reply.send({
        message: 'Logged out successfully'
      });

    } catch (error: any) {
      fastify.log.error('Logout error:', error);

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during logout',
        statusCode: 500
      });
    }
  });

  // Protected route to get current user
  fastify.get<{
    Reply: { user: any } | ErrorResponse;
  }>('/me', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      // Get the authenticated user from the request
      const userPayload = (request as any).user;
      
      if (!userPayload) {
        return reply.code(401).send({
          error: 'Authentication Failed',
          message: 'User not authenticated',
          statusCode: 401
        });
      }

      // Return the user data (already contained in the JWT payload)
      return reply.send({
        user: {
          id: userPayload.userId,
          email: userPayload.email,
          username: userPayload.username,
          createdAt: new Date() // This could be enhanced to fetch from database
        }
      });

    } catch (error: any) {
      fastify.log.error('Get user error:', error);

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        statusCode: 500
      });
    }
  });
}