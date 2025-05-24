'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocketNotifications } from '../lib/websocket-client';
import { BaseNotification, NotificationPriority } from '../lib/websocket-types';

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    requestNotificationPermission,
    // 開発用機能
    ...devFeatures
  } = useWebSocketNotifications();

  // デスクトップ通知許可状況を確認
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    } else {
      setHasPermission(false);
    }
  }, []);

  // 通知許可をリクエスト
  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setHasPermission(permission === 'granted');
  };

  // 通知の優先度に応じたスタイル
  const getPriorityStyle = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'high':
        return 'border-l-4 border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-4 border-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-4 border-gray-500 bg-gray-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  // 通知タイプのアイコン
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED':
        return '📝';
      case 'APPLICATION_STATUS_CHANGED':
        return '🔄';
      case 'PROGRAM_PUBLISHED':
        return '🆕';
      case 'PROGRAM_UPDATED':
        return '📢';
      case 'BADGE_REQUEST_SUBMITTED':
        return '🏆';
      case 'BADGE_REQUEST_APPROVED':
        return '✅';
      case 'BADGE_REQUEST_REJECTED':
        return '❌';
      case 'MESSAGE_RECEIVED':
        return '💬';
      case 'SYSTEM_ANNOUNCEMENT':
        return '📢';
      default:
        return '🔔';
    }
  };

  // 時間フォーマット
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return date.toLocaleDateString('ja-JP');
  };

  const handleNotificationClick = (notification: BaseNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // ユーザーの役割に応じて適切な詳細ページに遷移
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;
        
        if (userRole === 'COMPANY') {
          window.location.href = `/company/notifications/${notification.id}`;
        } else {
          window.location.href = `/notifications/${notification.id}`;
        }
      } catch (error) {
        // トークンの解析に失敗した場合はデフォルトの学生用ページに遷移
        window.location.href = `/notifications/${notification.id}`;
      }
    } else {
      // トークンがない場合はログインページに遷移
      window.location.href = '/auth/login';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 通知ベルアイコン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${
          isConnected 
            ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50' 
            : 'text-gray-400'
        }`}
        title={isConnected ? '通知' : '通知機能は無効です'}
      >
        {/* ベルアイコン */}
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-3.47-3.47a.75.75 0 01-.22-.53V9a6 6 0 10-12 0v3.5c0 .199-.079.39-.22.53L1 17h5m9 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {/* 未読カウントバッジ */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* 接続状態インジケーター */}
        <span 
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      </button>

      {/* 通知パネル */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96">
          {/* ヘッダー */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">通知</h3>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    すべて既読
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* 接続状態 */}
            <div className="flex items-center mt-2 text-sm">
              <span 
                className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <span className={isConnected ? 'text-green-600' : 'text-yellow-600'}>
                {process.env.NODE_ENV === 'development' 
                  ? (isConnected ? 'リアルタイム接続中' : '開発モード（WebSocket無効）')
                  : (isConnected ? 'リアルタイム接続中' : '接続が切断されています')
                }
              </span>
            </div>
          </div>

          {/* デスクトップ通知許可 */}
          {hasPermission === false && (
            <div className="p-4 bg-yellow-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">
                    デスクトップ通知を有効にしてリアルタイムでお知らせを受け取りましょう
                  </p>
                </div>
                <button
                  onClick={handleRequestPermission}
                  className="ml-3 text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                >
                  有効にする
                </button>
              </div>
            </div>
          )}

          {/* 開発環境用テストボタン */}
          {process.env.NODE_ENV === 'development' && 'generateTestNotification' in devFeatures && (
            <div className="p-4 bg-blue-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-blue-800">
                    開発モード：テスト通知を生成
                  </p>
                </div>
                <button
                  onClick={() => (devFeatures as any).generateTestNotification()}
                  className="ml-3 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  テスト通知
                </button>
              </div>
            </div>
          )}

          {/* 通知リスト */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.47-3.47a.75.75 0 01-.22-.53V9a6 6 0 10-12 0v3.5c0 .199-.079.39-.22.53L1 17h5m9 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>通知はありません</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    } ${getPriorityStyle(notification.priority)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* アイコン */}
                      <span className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      
                      {/* コンテンツ */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium truncate ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${
                          !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {notification.message}
                        </p>
                        
                        {/* 未読インジケーター */}
                        {!notification.isRead && (
                          <div className="flex items-center mt-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            <span className="text-xs text-blue-600 font-medium">未読</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 削除ボタン */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 