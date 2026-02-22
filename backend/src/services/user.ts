import { PrismaClient } from '@prisma/client';
import { PasswordService } from './password.js';
import type { User, PublicUser, RegisterRequest, LoginRequest } from '../types/auth.js';

const prisma = new PrismaClient();

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: RegisterRequest): Promise<PublicUser> {
    // Validate password
    const passwordValidation = PasswordService.validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash password
    const passwordHash = await PasswordService.hash(userData.password);

    try {
      const user = await prisma.user.create({
        data: {
          email: userData.email.toLowerCase(),
          username: userData.username,
          passwordHash
        }
      });

      return this.toPublicUser(user);
    } catch (error: any) {
      // Handle unique constraint violations
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('email')) {
          throw new Error('Email already exists');
        }
        if (target?.includes('username')) {
          throw new Error('Username already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Authenticate a user with email and password
   */
  static async authenticateUser(credentials: LoginRequest): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email.toLowerCase() }
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await PasswordService.verify(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Find user by ID
   */
  static async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  /**
   * Find user by email
   */
  static async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
  }

  /**
   * Convert User to PublicUser (remove sensitive fields)
   */
  static toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt
    };
  }

  /**
   * Close database connection
   */
  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}