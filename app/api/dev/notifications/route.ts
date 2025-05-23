import { NextRequest, NextResponse } from 'next/server';

// 開発モード専用の模擬通知API
export async function POST(request: NextRequest) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'この機能は開発モードでのみ利用可能です' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { type = 'test', message = 'テスト通知です' } = body;

    // クライアントサイドで通知をシミュレート
    const mockNotification = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      type: 'SYSTEM_ANNOUNCEMENT',
      userId: 0,
      title: '開発モード通知',
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'medium',
      data: { development: true }
    };

    return NextResponse.json({
      message: '開発モード通知を作成しました',
      notification: mockNotification,
      instructions: [
        '1. ブラウザの開発者ツールを開く',
        '2. コンソールで以下を実行:',
        `window.dispatchEvent(new CustomEvent('dev-notification', { detail: ${JSON.stringify(mockNotification)} }))`
      ]
    });

  } catch (error) {
    console.error('Dev notification error:', error);
    return NextResponse.json(
      { error: '開発通知の作成に失敗しました' },
      { status: 500 }
    );
  }
}

// 利用可能な通知タイプを取得
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'この機能は開発モードでのみ利用可能です' },
      { status: 403 }
    );
  }

  const notificationTypes = [
    { type: 'APPLICATION_SUBMITTED', description: '応募が提出された', icon: '📝' },
    { type: 'APPLICATION_STATUS_CHANGED', description: '応募状況が変更された', icon: '🔄' },
    { type: 'PROGRAM_PUBLISHED', description: '新しいプログラムが公開された', icon: '🆕' },
    { type: 'PROGRAM_UPDATED', description: 'プログラムが更新された', icon: '📢' },
    { type: 'BADGE_REQUEST_SUBMITTED', description: 'バッジ申請が提出された', icon: '🏆' },
    { type: 'BADGE_REQUEST_APPROVED', description: 'バッジ申請が承認された', icon: '✅' },
    { type: 'BADGE_REQUEST_REJECTED', description: 'バッジ申請が却下された', icon: '❌' },
    { type: 'MESSAGE_RECEIVED', description: 'メッセージを受信した', icon: '💬' },
    { type: 'SYSTEM_ANNOUNCEMENT', description: 'システムからのお知らせ', icon: '📢' }
  ];

  return NextResponse.json({
    types: notificationTypes,
    usage: {
      endpoint: '/api/dev/notifications',
      method: 'POST',
      body: {
        type: 'notification_type',
        message: 'カスタムメッセージ'
      }
    }
  });
} 