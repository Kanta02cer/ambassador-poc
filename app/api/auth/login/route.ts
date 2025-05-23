import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { verifyPassword, generateToken } from '../../../../src/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // バリデーション
    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      );
    }

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        companyProfile: true,
        adminProfile: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // アカウントの有効性チェック
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'アカウントが無効になっています' },
        { status: 401 }
      );
    }

    // パスワード検証
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // JWTトークン生成
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // プロフィール情報の取得
    let profileData = null;
    switch (user.role) {
      case 'STUDENT':
        profileData = user.studentProfile;
        break;
      case 'COMPANY':
        profileData = user.companyProfile;
        break;
      case 'ADMIN':
        profileData = user.adminProfile;
        break;
    }

    return NextResponse.json({
      message: 'ログインが完了しました',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: profileData,
      },
      accessToken: token,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    );
  }
}
