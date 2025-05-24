import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { hashPassword, generateToken } from '../../../../src/lib/auth';
import { UserRole } from '../../../../src/generated/prisma';

// ロールマッピング関数
function mapRoleToUserRole(role: string): UserRole {
  switch (role.toLowerCase()) {
    case 'student':
      return 'STUDENT';
    case 'company':
      return 'COMPANY';
    case 'admin':
      return 'ADMIN';
    default:
      throw new Error(`Invalid role: ${role}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, profileData, name } = body;

    // バリデーション
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'メールアドレス、パスワード、ロールは必須です' },
        { status: 400 }
      );
    }

    // ロールの変換とバリデーション
    let userRole: UserRole;
    try {
      userRole = mapRoleToUserRole(role);
    } catch (error) {
      return NextResponse.json(
        { error: '無効なユーザーロールです' },
        { status: 400 }
      );
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 409 }
      );
    }

    // パスワードをハッシュ化
    const hashedPassword = await hashPassword(password);

    // トランザクションでユーザーとプロフィールを作成
    const result = await prisma.$transaction(async (tx) => {
      // ユーザー作成
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: userRole,
        },
      });

      // ロールに応じてプロフィール作成
      switch (userRole) {
        case 'STUDENT':
          await tx.studentProfile.create({
            data: {
              userId: user.id,
              firstName: profileData?.firstName || name?.split(' ')[0] || '',
              lastName: profileData?.lastName || name?.split(' ')[1] || '',
              university: profileData?.university,
              phoneNumber: profileData?.phoneNumber,
            },
          });
          break;

        case 'COMPANY':
          await tx.companyProfile.create({
            data: {
              userId: user.id,
              companyName: profileData?.companyName || name || '',
              industry: profileData?.industry,
              website: profileData?.website,
              description: profileData?.description,
            },
          });
          break;

        case 'ADMIN':
          await tx.adminProfile.create({
            data: {
              userId: user.id,
              firstName: profileData?.firstName || name?.split(' ')[0] || '',
              lastName: profileData?.lastName || name?.split(' ')[1] || '',
              position: profileData?.position,
            },
          });
          break;
      }

      return user;
    });

    // JWTトークン生成
    const token = generateToken({
      id: result.id,
      email: result.email,
      role: result.role,
    });

    return NextResponse.json({
      message: 'ユーザー登録が完了しました',
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
      },
      accessToken: token,
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // 開発環境では詳細なエラーメッセージを返す
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: 'ユーザー登録に失敗しました',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました' },
      { status: 500 }
    );
  }
}
