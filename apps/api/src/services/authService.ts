import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { database } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResult {
  user: Omit<User, 'password'>;
  tokens: AuthTokens;
}

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRES_IN: string;
  private readonly REFRESH_TOKEN_EXPIRES_IN: string;

  constructor() {
    this.JWT_SECRET = config.jwt.secret;
    this.JWT_REFRESH_SECRET = config.jwt.refreshSecret;
    this.ACCESS_TOKEN_EXPIRES_IN = config.jwt.expiresIn;
    this.REFRESH_TOKEN_EXPIRES_IN = config.jwt.refreshExpiresIn;
  }

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      // Find user by email
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      logger.info(`User logged in successfully: ${email}`);

      return {
        user: userWithoutPassword,
        tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    companyName?: string;
  }): Promise<LoginResult> {
    try {
      // Check if user already exists
      const existingUser = await this.findUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user (without database for now, return mock user)
      const newUser: User = {
        id: Date.now(), // Mock ID
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        companyName: userData.companyName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // For now, since database is disconnected, we'll create a mock user
      // In production, this would be saved to the database
      logger.info(`User registered successfully: ${userData.email}`);

      // Generate tokens
      const tokens = await this.generateTokens(newUser);

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = newUser;

      return {
        user: userWithoutPassword,
        tokens,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async logout(accessToken: string): Promise<void> {
    try {
      // In a real implementation, you would add the token to a blacklist
      // For now, we'll just log the logout
      const decoded = jwt.decode(accessToken) as any;
      logger.info(`User logged out: ${decoded?.email || 'unknown'}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentUser(accessToken: string): Promise<Omit<User, 'password'>> {
    try {
      const decoded = jwt.verify(accessToken, this.JWT_SECRET) as any;

      // In a real implementation, you would fetch the user from the database
      // For now, we'll return the decoded token data
      return {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        companyName: decoded.companyName,
        createdAt: decoded.createdAt,
        updatedAt: decoded.updatedAt,
      };
    } catch (error) {
      logger.error('Get current user error:', error);
      throw new Error('Invalid token');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          companyName: decoded.companyName,
        },
        this.JWT_SECRET,
        { expiresIn: this.ACCESS_TOKEN_EXPIRES_IN }
      );

      return {
        accessToken: newAccessToken,
        expiresIn: this.getTokenExpirationTime(this.ACCESS_TOKEN_EXPIRES_IN),
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    try {
      // No fake demo users - real authentication requires database integration
      // When database is connected, this would query the database for real users
      logger.warn(`Authentication attempt for email: ${email} - requires database integration`);
      return null;
    } catch (error) {
      logger.error('Find user error:', error);
      throw error;
    }
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      this.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpirationTime(this.ACCESS_TOKEN_EXPIRES_IN),
    };
  }

  private getTokenExpirationTime(expiresIn: string): number {
    const timeUnit = expiresIn.slice(-1);
    const timeValue = parseInt(expiresIn.slice(0, -1));

    switch (timeUnit) {
      case 's':
        return timeValue * 1000;
      case 'm':
        return timeValue * 60 * 1000;
      case 'h':
        return timeValue * 60 * 60 * 1000;
      case 'd':
        return timeValue * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000; // Default to 15 minutes
    }
  }
}