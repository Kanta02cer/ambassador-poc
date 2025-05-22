import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '../../../../src/types';

// メモリ上のユーザーデータ（本番ではDB使用）
const users: Array<{
  id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: string;
}> = [
  // テスト用の初期データ
  {
    id: 1,
    email: "student@test.com",
    password: "password123",
    name: "テスト学生",
    role: "student",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    email: "company@test.com", 
    password: "password123",
    name: "テスト企業",
    role: "company",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    email: "admin@test.com",
    password: "password123", 
    name: "テスト管理者",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
];

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    // バリデーション
    const missingFields = [];
    if (!email) missingFields.push({ field: 'email', message: 'Email is required' });
    if (!password) missingFields.push({ field: 'password', message: 'Password is required' });
    if (!name) missingFields.push({ field: 'name', message: 'Name is required' });
    if (!role) missingFields.push({ field: 'role', message: 'Role is required' });
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        statusCode: 400,
        message: 'Validation failed',
        errors: missingFields
      }, { status: 400 });
    }

    // メール形式チェック
    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        statusCode: 400,
        message: 'Invalid email format',
      }, { status: 400 });
    }

    // パスワード強度チェック
    if (password.length < 8) {
      return NextResponse.json({
        statusCode: 400,
        message: 'Password must be at least 8 characters long',
      }, { status: 400 });
    }

    // ロールチェック
    if (!['student', 'company', 'admin'].includes(role)) {
      return NextResponse.json({
        statusCode: 400,
        message: 'Invalid role',
      }, { status: 400 });
    }

    // 重複チェック
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return NextResponse.json({
        statusCode: 409,
        message: 'Email already exists',
      }, { status: 409 });
    }

    // 新規ユーザー作成
    const newUser = {
      id: users.length + 1,
      email,
      password, // 本番ではハッシュ化必須
      name,
      role: role as UserRole,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    // レスポンス（パスワードは除外）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userResponse } = newUser;
    
    return NextResponse.json({
      message: 'User registered successfully',
      user: userResponse,
    }, { status: 201 });

  } catch {
    return NextResponse.json({
      statusCode: 500,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
