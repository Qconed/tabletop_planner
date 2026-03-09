import jwt from 'jsonwebtoken';
import { env } from '../config/index.js';
import type { JWTPayload } from '../schemas/user.schemas.js';

export class JWTService {
  /**
   * Generate a JWT token for a user
   */
  static async generateToken(payload: JWTPayload): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        env.JWT_SECRET,
        {
          expiresIn: env.JWT_EXPIRES_IN,
          issuer: 'tabletop-planner',
          audience: 'tabletop-planner-users'
        } as any, // Cast to 'any' because jsonwebtoken's SignOptions type is strict about expiresIn and doesn't accept string union types well
        (error, token) => {
          if (error || !token) {
            reject(error || new Error('Failed to generate token'));
          } else {
            resolve(token);
          }
        }
      );
    });
  }

  /**
   * Verify and decode a JWT token
   */
  static async verifyToken(token: string): Promise<JWTPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        env.JWT_SECRET,
        {
          issuer: 'tabletop-planner',
          audience: 'tabletop-planner-users'
        },
        (error, decoded) => {
          if (error || !decoded || typeof decoded === 'string') {
            reject(error || new Error('Invalid token'));
          } else {
            // Validate the decoded payload structure
            const payload = decoded as any;
            if (!payload.userId || !payload.email || !payload.username) {
              reject(new Error('Invalid token payload'));
            } else {
              resolve({
                userId: payload.userId,
                email: payload.email,
                username: payload.username
              });
            }
          }
        }
      );
    });
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1] || null;
  }
}