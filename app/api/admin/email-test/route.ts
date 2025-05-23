import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '../../../../src/lib/auth';
import { testEmailConnection, sendTestEmail, diagnoseEmailConfig } from '../../../../src/lib/email-config';

// メール設定診断
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    
    // 管理者のみアクセス可能
    if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'アクセス権限がありません' },
        { status: 403 }
      );
    }

    // メール設定診断
    const diagnosis = diagnoseEmailConfig();
    
    // SMTP接続テスト
    const connectionTest = await testEmailConnection();

    return NextResponse.json({
      diagnosis,
      connectionTest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email config diagnosis error:', error);
    return NextResponse.json(
      { error: 'メール設定診断に失敗しました' },
      { status: 500 }
    );
  }
}

// テストメール送信
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    
    // 管理者のみアクセス可能
    if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'アクセス権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // テストメール送信
    const result = await sendTestEmail(email);

    if (result.success) {
      return NextResponse.json({
        message: 'テストメールを送信しました',
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'テストメール送信に失敗しました' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Test email sending error:', error);
    return NextResponse.json(
      { error: 'テストメール送信に失敗しました' },
      { status: 500 }
    );
  }
} 