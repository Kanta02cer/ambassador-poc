// WebSocket通信で使用する通知の型定義

export interface BaseNotification {
  id: string;
  type: NotificationType;
  userId: number;
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
  isRead: boolean;
  priority: NotificationPriority;
}

export type NotificationType = 
  | 'APPLICATION_SUBMITTED'     // 応募が提出された
  | 'APPLICATION_STATUS_CHANGED' // 応募状況が変更された
  | 'PROGRAM_PUBLISHED'         // 新しいプログラムが公開された
  | 'PROGRAM_UPDATED'           // プログラムが更新された
  | 'BADGE_REQUEST_SUBMITTED'   // バッジ申請が提出された
  | 'BADGE_REQUEST_APPROVED'    // バッジ申請が承認された
  | 'BADGE_REQUEST_REJECTED'    // バッジ申請が却下された
  | 'MESSAGE_RECEIVED'          // メッセージを受信した
  | 'SYSTEM_ANNOUNCEMENT';      // システムからのお知らせ

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface WebSocketMessage {
  type: 'notification' | 'ping' | 'pong' | 'auth' | 'subscribe' | 'unsubscribe';
  payload?: any;
}

export interface NotificationWebSocketMessage extends WebSocketMessage {
  type: 'notification';
  payload: BaseNotification;
}

export interface AuthWebSocketMessage extends WebSocketMessage {
  type: 'auth';
  payload: {
    token: string;
  };
}

export interface SubscribeWebSocketMessage extends WebSocketMessage {
  type: 'subscribe';
  payload: {
    channels: string[];
  };
}

// クライアント側で管理する通知状態
export interface NotificationState {
  notifications: BaseNotification[];
  unreadCount: number;
  isConnected: boolean;
  lastConnectionTime?: string;
}

// 通知の設定
export interface NotificationSettings {
  enableSound: boolean;
  enableDesktop: boolean;
  enableEmail: boolean;
  types: {
    [K in NotificationType]: {
      enabled: boolean;
      sound: boolean;
      desktop: boolean;
      email: boolean;
    };
  };
}

// 通知チャンネル（購読するチャンネル）
export type NotificationChannel = 
  | `user:${number}`          // 特定ユーザー向け
  | `role:${string}`          // ロール別（student, company, admin）
  | `program:${number}`       // 特定プログラム向け
  | 'system'                  // システム全体
  | 'public';                 // 公開チャンネル 