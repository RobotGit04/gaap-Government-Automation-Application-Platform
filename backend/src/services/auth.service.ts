import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { JWTPayload } from '../types';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'gaap-secret-key-change-in-production';
  private readonly JWT_EXPIRES_IN = '7d';

  async register(data: {
    email: string;
    phone: string;
    name: string;
    password: string;
    role?: string;
  }) {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    });

    if (existingUser) {
      throw Object.assign(new Error('User with this email or phone already exists'), { statusCode: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        name: data.name,
        passwordHash,
        role: (data.role as any) || 'CITIZEN',
      },
      select: { id: true, email: true, phone: true, name: true, role: true, createdAt: true },
    });

    const token = this.generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const token = this.generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, phone: true, name: true, role: true,
        isVerified: true, createdAt: true,
        _count: { select: { applications: true } },
      },
    });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
  }

  private generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
  }
}
