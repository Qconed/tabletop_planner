export interface PublicUser {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: PublicUser;
  message: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}