import { UserService } from './user.js';
import { JWTService } from './jwt.js';
import type { 
  RegisterRequest, 
  LoginRequest, 
  PublicUser, 
  JWTPayload 
} from '../schemas/auth.schemas.js';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(userData: RegisterRequest): Promise<{ user: PublicUser; token: string }> {
    try {
      // Create user through user service
      const user = await UserService.createUser(userData);
      
      // Generate JWT token
      const token = await JWTService.generateToken({
        userId: user.id,
        email: user.email,
        username: user.username
      });
      
      return { user, token };
    } catch (error) {
      // Re-throw with proper context
      throw error;
    }
  }

  /**
   * Login user with credentials
   */
  static async login(credentials: LoginRequest): Promise<{ user: PublicUser; token: string } | null> {
    try {
      // Authenticate user
      const user = await UserService.authenticateUser(credentials);
      
      if (!user) {
        return null;
      }

      // Convert to public user
      const publicUser = UserService.toPublicUser(user);
      
      // Generate JWT token
      const token = await JWTService.generateToken({
        userId: user.id,
        email: user.email,
        username: user.username
      });
      
      return { user: publicUser, token };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user data from JWT payload
   */
  static async getCurrentUser(userPayload: JWTPayload): Promise<PublicUser> {
    try {
      // Fetch fresh user data from database
      const user = await UserService.findUserById(userPayload.userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return UserService.toPublicUser(user);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate JWT token and return user payload
   */
  static async validateToken(token: string): Promise<JWTPayload | null> {
    try {
      const payload = await JWTService.verifyToken(token);
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh user token
   */
  static async refreshToken(userPayload: JWTPayload): Promise<string> {
    try {
      // Verify user still exists
      const user = await UserService.findUserById(userPayload.userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate new token with fresh data
      return await JWTService.generateToken({
        userId: user.id,
        email: user.email,
        username: user.username
      });
    } catch (error) {
      throw error;
    }
  }
}