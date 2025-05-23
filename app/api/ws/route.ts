import { NextRequest } from 'next/server';
import { notificationManager } from '../../../src/lib/websocket-server';

// WebSocketサーバーの管理用API
export async function GET(request: NextRequest) {
  try {
    // WebSocketサーバーの統計情報を返す
    const stats = {
      connectedClients: notificationManager.getConnectedClientsCount(),
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    return Response.json(stats);
  } catch (error) {
    console.error('WebSocket stats error:', error);
    return Response.json(
      { error: 'WebSocket統計情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// WebSocketサーバーの健全性をチェック
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'test_notification':
        // テスト通知送信
        const { userId, message } = body;
        if (userId && message) {
          notificationManager.sendUserNotification(
            userId,
            'SYSTEM_ANNOUNCEMENT',
            'テスト通知',
            message,
            'medium',
            { test: true }
          );
          return Response.json({ message: 'テスト通知を送信しました' });
        }
        break;

      case 'broadcast':
        // 全体ブロードキャスト
        const { title, broadcastMessage } = body;
        if (title && broadcastMessage) {
          notificationManager.sendSystemNotification(
            'SYSTEM_ANNOUNCEMENT',
            title,
            broadcastMessage,
            'medium'
          );
          return Response.json({ message: 'ブロードキャストを送信しました' });
        }
        break;

      default:
        return Response.json(
          { error: '不正なアクションです' },
          { status: 400 }
        );
    }

    return Response.json(
      { error: '必要なパラメータが不足しています' },
      { status: 400 }
    );

  } catch (error) {
    console.error('WebSocket action error:', error);
    return Response.json(
      { error: 'WebSocketアクションの実行に失敗しました' },
      { status: 500 }
    );
  }
} 