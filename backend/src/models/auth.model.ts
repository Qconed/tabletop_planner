// User-related types
export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string; // Never send this to client
  createdAt: Date;
  updatedAt: Date;
}

// Public user type (safe to send to client)
export interface PublicUser {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  user: PublicUser;
  message: string;
}

// JWT payload
export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

// Fastify request with user
export interface AuthenticatedRequest {
  user: JWTPayload;
}

// Error response type
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}