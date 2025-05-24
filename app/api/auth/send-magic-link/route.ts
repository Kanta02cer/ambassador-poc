import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { sendMagicLink } from '../../../../src/lib/email';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json();

    // バリデーション
    if (!email || !role) {
      return NextResponse.json(
        { error: 'メールアドレスとアカウントタイプが必要です' },
        { status: 400 }
      );
    }

    // 有効なロールかチェック
    if (!['STUDENT', 'COMPANY', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: '無効なアカウントタイプです' },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // Prismaクライアントのデバッグ情報
    console.log('Prisma client:', !!prisma);
    console.log('Available models:', Object.keys(prisma));
    console.log('authToken model:', !!prisma.authToken);

    // 既存ユーザーをチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // 既存ユーザーがいて、役割が異なる場合はエラー
    if (existingUser && existingUser.role !== role) {
      return NextResponse.json(
        { error: `このメールアドレスは既に${
          existingUser.role === 'STUDENT' ? '学生' :
          existingUser.role === 'COMPANY' ? '企業' : '管理者'
        }アカウントとして登録されています` },
        { status: 400 }
      );
    }

    // 最近のトークンをチェック（レート制限：5分間に1回まで）
    let recentToken = null;
    try {
      recentToken = await prisma.authToken.findFirst({
        where: {
          email,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // 5分前より後
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('AuthToken query error:', error);
      console.error('Prisma models available:', Object.keys(prisma));
      return NextResponse.json(
        { error: 'データベースアクセスエラーが発生しました。アプリケーションの再起動が必要です。' },
        { status: 500 }
      );
    }

    if (recentToken) {
      return NextResponse.json(
        { error: '認証メールは5分間に1回のみ送信可能です。しばらく待ってから再度お試しください。' },
        { status: 429 }
      );
    }

    // 古いトークンを削除（クリーンアップ）
    await prisma.authToken.deleteMany({
      where: {
        email,
        OR: [
          { used: true },
          { expiresAt: { lt: new Date() } },
        ],
      },
    });

    // 新しいトークンを生成
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15分後

    // トークンをデータベースに保存
    await prisma.authToken.create({
      data: {
        email,
        token,
        role,
        expiresAt,
        userId: existingUser?.id,
      },
    });

    // メール送信（開発環境では失敗を無視）
    let emailResult: { success: boolean; messageId?: string; magicLink?: string } = { success: false };
    try {
      emailResult = await sendMagicLink({ email, role, token });
    } catch (emailError) {
      console.log('Email sending failed (development mode):', emailError);
      // 開発環境では成功として扱う
      if (process.env.NODE_ENV !== 'production') {
        emailResult = { success: true, messageId: 'dev-mode' };
      }
    }

    // 開発環境では、メール送信失敗でもトークンを削除しない
    if (!emailResult.success && process.env.NODE_ENV === 'production') {
      // メール送信失敗時はトークンを削除（本番環境のみ）
      await prisma.authToken.delete({
        where: { token },
      });

      return NextResponse.json(
        { error: 'メールの送信に失敗しました。しばらく時間をおいて再度お試しください。' },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/auth/verify?token=${token}`;

    return NextResponse.json({
      success: true,
      message: emailResult.success 
        ? `${email} に認証メールを送信しました。メールに記載されたリンクをクリックしてログインを完了してください。`
        : `開発環境: メール送信は無効ですが、以下のURLで直接認証できます: ${verifyUrl}`,
      // 開発環境でのデバッグ情報
      ...(process.env.NODE_ENV !== 'production' && {
        debug: {
          token,
          expiresAt,
          messageId: emailResult.messageId,
          verifyUrl,
          magicLink: emailResult.magicLink,
        },
      }),
    });

  } catch (error) {
    console.error('Magic link send error:', error);
    return NextResponse.json(
      { error: '認証メールの送信中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 