import { z } from 'zod';

// Request validation schemas
export const registerRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username too long'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const loginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Response validation schemas
export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  createdAt: z.date()
});

export const authResponseSchema = z.object({
  user: publicUserSchema,
  message: z.string()
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number()
});

export const logoutResponseSchema = z.object({
  message: z.string()
});

export const meResponseSchema = z.object({
  user: publicUserSchema
});

// JWT payload schema
export const jwtPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  username: z.string()
});

// TypeScript types derived from schemas
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
export type JWTPayload = z.infer<typeof jwtPayloadSchema>;

// Fastify JSON schemas for documentation (derived from Zod schemas)
export const fastifySchemas = {
  registerRequest: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      username: { type: 'string', minLength: 3, maxLength: 30 },
      password: { type: 'string', minLength: 8 }
    },
    required: ['email', 'username', 'password']
  },
  loginRequest: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 1 }
    },
    required: ['email', 'password']
  }
};