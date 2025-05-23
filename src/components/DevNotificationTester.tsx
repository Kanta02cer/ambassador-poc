'use client';

import React, { useState } from 'react';
import { useWebSocketNotifications } from '../lib/websocket-client';
import { BaseNotification } from '../lib/websocket-types';

export default function DevNotificationTester() {
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('SYSTEM_ANNOUNCEMENT');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const { playNotificationSound } = useWebSocketNotifications();

  // 開発モードでない場合は表示しない
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const sendTestNotification = () => {
    const testNotification: BaseNotification = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      type: notificationType as any,
      userId: 1,
      title: '🧪 テスト通知',
      message: message || 'これはテスト通知です',
      timestamp: new Date().toISOString(),
      isRead: false,
      priority,
      data: { development: true }
    };

    // カスタムイベントで通知をシミュレート
    window.dispatchEvent(new CustomEvent('dev-notification', { 
      detail: testNotification 
    }));

    // 通知音もテスト
    playNotificationSound(priority);
  };

  const requestDesktopPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('🎉 デスクトップ通知が有効になりました！', {
          body: 'リアルタイム通知を受け取れるようになりました',
          icon: '/favicon.ico'
        });
      }
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <div className="flex items-center mb-3">
        <span className="text-xl mr-2">🧪</span>
        <h3 className="font-semibold text-yellow-800">通知テスター</h3>
        <span className="text-xs bg-yellow-200 text-yellow-700 px-2 py-1 rounded ml-2">
          DEV
        </span>
      </div>

      <div className="space-y-3">
        {/* メッセージ入力 */}
        <div>
          <label className="block text-xs font-medium text-yellow-700 mb-1">
            メッセージ
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="テストメッセージを入力"
            className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </div>

        {/* 通知タイプ */}
        <div>
          <label className="block text-xs font-medium text-yellow-700 mb-1">
            通知タイプ
          </label>
          <select
            value={notificationType}
            onChange={(e) => setNotificationType(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-400"
          >
            <option value="SYSTEM_ANNOUNCEMENT">📢 システムアナウンス</option>
            <option value="APPLICATION_SUBMITTED">📝 応募提出</option>
            <option value="APPLICATION_STATUS_CHANGED">🔄 応募状況変更</option>
            <option value="PROGRAM_PUBLISHED">🆕 プログラム公開</option>
            <option value="BADGE_REQUEST_APPROVED">✅ バッジ承認</option>
            <option value="MESSAGE_RECEIVED">💬 メッセージ受信</option>
          </select>
        </div>

        {/* 優先度 */}
        <div>
          <label className="block text-xs font-medium text-yellow-700 mb-1">
            優先度
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-400"
          >
            <option value="low">🔸 低</option>
            <option value="medium">🔶 中</option>
            <option value="high">🔸 高</option>
            <option value="urgent">🚨 緊急</option>
          </select>
        </div>

        {/* アクションボタン */}
        <div className="flex space-x-2">
          <button
            onClick={sendTestNotification}
            className="flex-1 bg-yellow-600 text-white text-xs px-3 py-2 rounded hover:bg-yellow-700 transition"
          >
            🔔 通知送信
          </button>
          <button
            onClick={requestDesktopPermission}
            className="flex-1 bg-blue-600 text-white text-xs px-3 py-2 rounded hover:bg-blue-700 transition"
          >
            🖥 許可要求
          </button>
        </div>

        {/* 説明 */}
        <div className="text-xs text-yellow-600 border-t border-yellow-200 pt-2">
          開発モード専用のテスト機能です。本番環境では表示されません。
        </div>
      </div>
    </div>
  );
} 