import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { generateToken } from '../../../../src/lib/auth';
import { UserRole } from '../../../../src/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: '認証トークンが見つかりません' },
        { status: 400 }
      );
    }

    // トークンを検証
    const authToken = await prisma.authToken.findUnique({
      where: { token },
    });

    if (!authToken) {
      return NextResponse.json(
        { error: '無効な認証トークンです' },
        { status: 400 }
      );
    }

    // トークンの有効期限をチェック
    if (authToken.expiresAt < new Date()) {
      // 期限切れのトークンを削除
      await prisma.authToken.delete({
        where: { token },
      });

      return NextResponse.json(
        { error: '認証トークンの有効期限が切れています。再度ログインをお試しください。' },
        { status: 400 }
      );
    }

    // 既に使用されたトークンかチェック
    if (authToken.used) {
      return NextResponse.json(
        { error: 'このトークンは既に使用されています' },
        { status: 400 }
      );
    }

    // トランザクションで処理
    const result = await prisma.$transaction(async (tx) => {
      // ユーザーを取得または作成
      let user = await tx.user.findUnique({
        where: { email: authToken.email },
      });

      if (!user) {
        // 新しいユーザーを作成
        user = await tx.user.create({
          data: {
            email: authToken.email,
            role: authToken.role as UserRole,
            isActive: true,
          },
        });

        // 役割に応じてプロフィールを作成
        switch (authToken.role) {
          case 'STUDENT':
            await tx.studentProfile.create({
              data: {
                userId: user.id,
                firstName: '',
                lastName: '',
              },
            });
            break;

          case 'COMPANY':
            await tx.companyProfile.create({
              data: {
                userId: user.id,
                companyName: '',
              },
            });
            break;

          case 'ADMIN':
            await tx.adminProfile.create({
              data: {
                userId: user.id,
                firstName: '',
                lastName: '',
              },
            });
            break;
        }
      } else {
        // 既存ユーザーの場合、アクティブ状態にする
        if (!user.isActive) {
          user = await tx.user.update({
            where: { id: user.id },
            data: { isActive: true },
          });
        }
      }

      // トークンを使用済みにマーク
      await tx.authToken.update({
        where: { token },
        data: { used: true },
      });

      return user;
    });

    // JWTトークンを生成
    const jwtToken = generateToken({
      id: result.id,
      email: result.email,
      role: result.role,
    });

    // 役割に応じたリダイレクトURL
    const redirectUrl = getRedirectUrl(result.role);

    return NextResponse.json({
      success: true,
      message: 'ログインが完了しました',
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
        isActive: result.isActive,
      },
      accessToken: jwtToken,
      redirectUrl,
    });

  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.json(
      { error: '認証処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

function getRedirectUrl(role: string): string {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'COMPANY':
      return '/company/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/';
  }
} 