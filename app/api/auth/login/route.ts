import { NextRequest, NextResponse } from 'next/server';

// ユーザー型定義
interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  createdAt: string;
}

// 簡易JWT生成（本番では jsonwebtoken ライブラリ使用）
function generateToken(user: User): string {
  return `dummy-jwt-${user.id}-${Date.now()}`;
}

// メモリ上のユーザーデータ
const users: User[] = [
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
    const { email, password } = await request.json();

    // バリデーション
    if (!email || !password) {
      return NextResponse.json({
        statusCode: 400,
        message: 'Email and password are required',
      }, { status: 400 });
    }

    // ユーザー検索
    const user = users.find(u => u.email === email);
    if (!user) {
      return NextResponse.json({
        statusCode: 401,
        message: 'Invalid credentials (user not found)',
      }, { status: 401 });
    }

    // パスワード照合
    if (user.password !== password) {
      return NextResponse.json({
        statusCode: 401,
        message: 'Invalid credentials (password mismatch)',
      }, { status: 401 });
    }

    // JWTトークン生成
    const accessToken = generateToken(user);

    // レスポンス（パスワードは除外）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userResponse } = user;

    return NextResponse.json({
      message: 'Login successful',
      accessToken,
      user: userResponse,
    }, { status: 200 });

  } catch {
    return NextResponse.json({
      statusCode: 500,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
