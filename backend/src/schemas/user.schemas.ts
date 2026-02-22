import type { JWTPayload } from './auth.schemas.js';
// Re-export types from the new schema-based approach for backward compatibility
export type {
  PublicUser,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  ErrorResponse,
  JWTPayload
} from './auth.schemas.js';

// Legacy User interface (with passwordHash) - still used by UserService
export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string; // Never send this to client
  createdAt: Date;
  updatedAt: Date;
}

// Fastify request with user - enhanced with proper typing
export interface AuthenticatedRequest {
  user: JWTPayload;
}