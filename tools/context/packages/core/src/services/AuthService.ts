import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { UserService } from './UserService';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupInput {
  email: string;
  password: string;
  fullName: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  private userService: UserService;
  private jwtSecret: string;
  private tokenExpiry: string | number;

  constructor(
    private db: DataSource,
    jwtSecret?: string,
    tokenExpiry?: string | number
  ) {
    this.userService = new UserService(db);
    this.jwtSecret = jwtSecret || process.env.JWT_SECRET || 'dev-secret-key';
    this.tokenExpiry = tokenExpiry || process.env.JWT_EXPIRY || 604800; // 7 days in seconds
  }

  /**
   * Hash a password using SHA-256
   */
  hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Verify a password against its hash
   */
  verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  /**
   * Generate a JWT token
   */
  generateToken(userId: string, email: string): string {
    const payload = { userId, email };
    // Convert expiry to numeric value (seconds)
    let expiresIn: number | undefined;
    if (typeof this.tokenExpiry === 'number') {
      expiresIn = this.tokenExpiry;
    } else if (typeof this.tokenExpiry === 'string') {
      // Parse string like "7d" to seconds
      const match = this.tokenExpiry.match(/^(\d+)([smhd])$/);
      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
        expiresIn = value * (multipliers[unit] || 1);
      } else {
        expiresIn = 604800; // default to 7 days
      }
    }
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, this.jwtSecret, options);
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Sign up a new user
   */
  async signup(input: SignupInput): Promise<AuthResponse> {
    const existing = await this.userService.getByEmail(input.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = this.hashPassword(input.password);
    const user = await this.userService.create(
      {
        email: input.email.toLowerCase(),
        fullName: input.fullName,
      },
      passwordHash
    );

    const token = this.generateToken(user.id, user.email);
    return { user, token };
  }

  /**
   * Login a user
   */
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    const user = await this.userService.getByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!this.verifyPassword(credentials.password, user.passwordHash)) {
      throw new Error('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    await this.userService.updateLastLogin(user.id);
    const token = this.generateToken(user.id, user.email);

    return { user, token };
  }

  /**
   * Refresh a token
   */
  async refreshToken(token: string): Promise<string> {
    const payload = this.verifyToken(token);
    if (!payload) {
      throw new Error('Invalid or expired token');
    }

    const user = await this.userService.getById(payload.userId);
    if (!user || user.status !== 'active') {
      throw new Error('User not found or inactive');
    }

    return this.generateToken(user.id, user.email);
  }

  /**
   * Validate a token and return user
   */
  async validateToken(token: string): Promise<User | null> {
    const payload = this.verifyToken(token);
    if (!payload) return null;

    const user = await this.userService.getById(payload.userId);
    if (!user || user.status !== 'active') return null;

    return user;
  }
}
