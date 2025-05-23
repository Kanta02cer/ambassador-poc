import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '../generated/prisma';

// JWTペイロードの型定義
export interface JWTPayload {
  id: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// パスワードをハッシュ化
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// パスワードを検証
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// JWTトークンを生成
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign(payload, secret, {
    expiresIn: '24h', // 24時間有効
  });
};

// JWTトークンを検証
export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch {
    throw new Error('Invalid or expired token');
  }
};

// AuthorizationヘッダーからBearerトークンを抽出
export const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // "Bearer "を除去
}; 