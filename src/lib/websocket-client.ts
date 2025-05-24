'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  BaseNotification, 
  NotificationState, 
  WebSocketMessage,
  NotificationChannel,
  NotificationSettings
} from './websocket-types';

interface UseWebSocketNotificationsOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enableSound?: boolean;
  enableDesktop?: boolean;
}

export function useWebSocketNotifications(options: UseWebSocketNotificationsOptions = {}) {
  const {
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    enableSound = true,
    enableDesktop = true
  } = options;

  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isConnected: false
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 通知音の初期化
  const initializeAudio = useCallback(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('AudioContext not supported:', error);
      }
    }
  }, []);

  // 通知音再生
  const playNotificationSound = useCallback((priority: string) => {
    if (!enableSound || !audioContextRef.current) return;

    try {
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // 優先度に応じて音程を変更
      const frequency = priority === 'urgent' ? 800 : priority === 'high' ? 600 : 400;
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }, [enableSound]);

  // デスクトップ通知
  const showDesktopNotification = useCallback((notification: BaseNotification) => {
    if (!enableDesktop || typeof window === 'undefined') return;

    if ('Notification' in window && Notification.permission === 'granted') {
      const desktopNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      });

      // 3秒後に自動で閉じる（緊急でない場合）
      if (notification.priority !== 'urgent') {
        setTimeout(() => desktopNotification.close(), 3000);
      }

      desktopNotification.onclick = () => {
        window.focus();
        desktopNotification.close();
      };
    }
  }, [enableDesktop]);

  // 通知受信処理
  const handleNotification = useCallback((notification: BaseNotification) => {
    setState(prev => {
      const existingIndex = prev.notifications.findIndex(n => n.id === notification.id);
      
      let updatedNotifications;
      if (existingIndex >= 0) {
        // 既存の通知を更新
        updatedNotifications = [...prev.notifications];
        updatedNotifications[existingIndex] = notification;
      } else {
        // 新しい通知を追加（最新順）
        updatedNotifications = [notification, ...prev.notifications];
        
        // 通知音再生
        playNotificationSound(notification.priority);
        
        // デスクトップ通知表示
        showDesktopNotification(notification);
      }

      const unreadCount = updatedNotifications.filter(n => !n.isRead).length;

      return {
        ...prev,
        notifications: updatedNotifications,
        unreadCount
      };
    });
  }, [playNotificationSound, showDesktopNotification]);

  // WebSocket接続
  const connect = useCallback(() => {
    // 開発環境では WebSocket 接続を無効化
    if (process.env.NODE_ENV === 'development') {
      console.log('🚧 WebSocket disabled in development mode');
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        lastConnectionTime: new Date().toISOString() 
      }));
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found for WebSocket connection');
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔔 WebSocket connected');
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          lastConnectionTime: new Date().toISOString() 
        }));
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'notification':
              handleNotification(message.payload);
              break;
            case 'auth':
              console.log('WebSocket authenticated:', message.payload);
              break;
            case 'pong':
              // ハートビート応答（特に処理不要）
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setState(prev => ({ ...prev, isConnected: false }));

        // 自動再接続
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.error('❌ Max reconnection attempts reached');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [handleNotification, maxReconnectAttempts, reconnectInterval]);

  // WebSocket切断
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  // メッセージ送信
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // チャンネル購読
  const subscribeToChannels = useCallback((channels: NotificationChannel[]) => {
    sendMessage({
      type: 'subscribe',
      payload: { channels }
    });
  }, [sendMessage]);

  // チャンネル購読解除
  const unsubscribeFromChannels = useCallback((channels: NotificationChannel[]) => {
    sendMessage({
      type: 'unsubscribe',
      payload: { channels }
    });
  }, [sendMessage]);

  // 通知を既読にする
  const markAsRead = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: prev.notifications.filter(n => n.id !== notificationId && !n.isRead).length
    }));
  }, []);

  // 全ての通知を既読にする
  const markAllAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0
    }));
  }, []);

  // 通知を削除
  const removeNotification = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== notificationId),
      unreadCount: prev.notifications.filter(n => n.id !== notificationId && !n.isRead).length
    }));
  }, []);

  // 通知許可をリクエスト
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'not-supported';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }, []);

  // 開発環境用：テスト通知を生成
  const generateTestNotification = useCallback((type?: string) => {
    if (process.env.NODE_ENV !== 'development') return;

    // ログインユーザーIDを取得（ない場合は1をデフォルト）
    let userId = 1;
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.id || 1;
      }
    } catch (error) {
      // トークンの解析に失敗した場合はデフォルト値を使用
    }

    const testNotifications = [
      {
        id: `test-${Date.now()}`,
        type: 'APPLICATION_STATUS_CHANGED' as const,
        userId,
        title: '応募状況が更新されました',
        message: 'テック企業インターンの選考結果が発表されました',
        timestamp: new Date().toISOString(),
        priority: 'high' as const,
        isRead: false,
        data: { programId: 1, applicationId: 1 }
      },
      {
        id: `test-${Date.now() + 1}`,
        type: 'PROGRAM_PUBLISHED' as const,
        userId,
        title: '新しいプログラムが公開されました',
        message: '【株式会社Example】マーケティングアンバサダー募集開始',
        timestamp: new Date().toISOString(),
        priority: 'medium' as const,
        isRead: false,
        data: { programId: 2 }
      },
      {
        id: `test-${Date.now() + 2}`,
        type: 'BADGE_REQUEST_APPROVED' as const,
        userId,
        title: 'バッジが承認されました！',
        message: '「プロジェクトリーダー」バッジが正式に認定されました',
        timestamp: new Date().toISOString(),
        priority: 'urgent' as const,
        isRead: false,
        data: { badgeId: 1 }
      }
    ];

    const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    handleNotification(randomNotification);
  }, [handleNotification]);

  // 初期化
  useEffect(() => {
    initializeAudio();
    
    if (autoConnect) {
      connect();
    }

    // 開発モード用のカスタムイベントリスナー
    const handleDevNotification = (event: CustomEvent) => {
      if (process.env.NODE_ENV === 'development') {
        handleNotification(event.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('dev-notification', handleDevNotification as EventListener);
      
      // 開発環境でのテスト通知の生成（10秒後）
      if (process.env.NODE_ENV === 'development') {
        const testTimeout = setTimeout(() => {
          generateTestNotification();
        }, 10000);

        return () => {
          disconnect();
          clearTimeout(testTimeout);
          window.removeEventListener('dev-notification', handleDevNotification as EventListener);
        };
      }
    }

    return () => {
      disconnect();
      if (typeof window !== 'undefined') {
        window.removeEventListener('dev-notification', handleDevNotification as EventListener);
      }
    };
  }, [autoConnect, connect, disconnect, initializeAudio, handleNotification, generateTestNotification]);

  return {
    // 状態
    ...state,
    
    // アクション
    connect,
    disconnect,
    sendMessage,
    subscribeToChannels,
    unsubscribeFromChannels,
    markAsRead,
    markAllAsRead,
    removeNotification,
    requestNotificationPermission,
    
    // ヘルパー
    playNotificationSound,
    
    // 開発用
    ...(process.env.NODE_ENV === 'development' && { generateTestNotification })
  };
}

// 通知設定管理Hook
export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    // ローカルストレージから設定を読み込み
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notificationSettings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // デフォルト設定にフォールバック
        }
      }
    }

    // デフォルト設定
    return {
      enableSound: true,
      enableDesktop: true,
      enableEmail: true,
      types: {
        APPLICATION_SUBMITTED: { enabled: true, sound: true, desktop: true, email: true },
        APPLICATION_STATUS_CHANGED: { enabled: true, sound: true, desktop: true, email: true },
        PROGRAM_PUBLISHED: { enabled: true, sound: false, desktop: true, email: false },
        PROGRAM_UPDATED: { enabled: true, sound: false, desktop: true, email: false },
        BADGE_REQUEST_SUBMITTED: { enabled: true, sound: true, desktop: true, email: true },
        BADGE_REQUEST_APPROVED: { enabled: true, sound: true, desktop: true, email: true },
        BADGE_REQUEST_REJECTED: { enabled: true, sound: true, desktop: true, email: true },
        MESSAGE_RECEIVED: { enabled: true, sound: true, desktop: true, email: false },
        SYSTEM_ANNOUNCEMENT: { enabled: true, sound: false, desktop: true, email: false }
      }
    };
  });

  // 設定保存
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('notificationSettings', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  return {
    settings,
    updateSettings
  };
} 