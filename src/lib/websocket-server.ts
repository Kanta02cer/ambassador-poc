import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import jwt from 'jsonwebtoken';
import { 
  BaseNotification, 
  WebSocketMessage, 
  NotificationChannel,
  NotificationType,
  NotificationPriority
} from './websocket-types';

interface AuthenticatedClient {
  ws: WebSocket;
  userId: number;
  userRole: string;
  channels: Set<string>;
  lastPing: number;
}

export class NotificationWebSocketManager {
  private clients: Map<string, AuthenticatedClient> = new Map();
  private wss: WebSocketServer | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupHeartbeat();
  }

  // WebSocketサーバーの初期化
  public initialize(server: any, path = '/ws') {
    this.wss = new WebSocketServer({ 
      server,
      path,
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('🔔 WebSocket notification server initialized');
  }

  // クライアント検証
  private verifyClient(info: { req: IncomingMessage }): boolean {
    try {
      const url = new URL(info.req.url || '', 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) {
        console.log('WebSocket connection rejected: No token provided');
        return false;
      }

      // JWT検証
      jwt.verify(token, process.env.JWT_SECRET || '');
      return true;
    } catch (error) {
      console.log('WebSocket connection rejected: Invalid token');
      return false;
    }
  }

  // 新しい接続の処理
  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    try {
      const url = new URL(req.url || '', 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1008, 'No token provided');
        return;
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET || '') as any;
      const clientId = this.generateClientId();
      
      const client: AuthenticatedClient = {
        ws,
        userId: payload.id,
        userRole: payload.role,
        channels: new Set([`user:${payload.id}`, `role:${payload.role.toLowerCase()}`]),
        lastPing: Date.now()
      };

      this.clients.set(clientId, client);
      
      console.log(`🔗 Client connected: ${clientId} (User: ${payload.id}, Role: ${payload.role})`);

      // メッセージハンドラーの設定
      ws.on('message', (data) => this.handleMessage(clientId, data));
      ws.on('close', () => this.handleDisconnection(clientId));
      ws.on('pong', () => this.handlePong(clientId));

      // 接続確認メッセージ
      this.sendToClient(clientId, {
        type: 'auth',
        payload: { status: 'authenticated', userId: payload.id }
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  // メッセージ処理
  private handleMessage(clientId: string, data: any) {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      const message: WebSocketMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'ping':
          client.lastPing = Date.now();
          this.sendToClient(clientId, { type: 'pong' });
          break;
          
        case 'subscribe':
          if (message.payload?.channels) {
            message.payload.channels.forEach((channel: string) => {
              if (this.isValidChannel(client, channel)) {
                client.channels.add(channel);
              }
            });
          }
          break;
          
        case 'unsubscribe':
          if (message.payload?.channels) {
            message.payload.channels.forEach((channel: string) => {
              client.channels.delete(channel);
            });
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket message handling error:', error);
    }
  }

  // 切断処理
  private handleDisconnection(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`🔌 Client disconnected: ${clientId} (User: ${client.userId})`);
      this.clients.delete(clientId);
    }
  }

  // Pong受信処理
  private handlePong(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastPing = Date.now();
    }
  }

  // チャンネル有効性確認
  private isValidChannel(client: AuthenticatedClient, channel: string): boolean {
    // ユーザー自身のチャンネル
    if (channel === `user:${client.userId}`) return true;
    
    // ロールチャンネル
    if (channel === `role:${client.userRole.toLowerCase()}`) return true;
    
    // システムチャンネル（管理者のみ）
    if (channel === 'system' && client.userRole === 'ADMIN') return true;
    
    // 公開チャンネル
    if (channel === 'public') return true;
    
    // プログラムチャンネル（企業ユーザーは自社プログラムのみ）
    if (channel.startsWith('program:') && client.userRole === 'COMPANY') {
      // ここで企業が管理するプログラムかチェック（実装省略）
      return true;
    }
    
    return false;
  }

  // 個別クライアントにメッセージ送信
  private sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send message to client:', error);
        this.clients.delete(clientId);
      }
    }
  }

  // 通知送信（公開メソッド）
  public sendNotification(notification: BaseNotification, channels: NotificationChannel[]) {
    const message: WebSocketMessage = {
      type: 'notification',
      payload: notification
    };

    let sentCount = 0;

    for (const [clientId, client] of this.clients) {
      // クライアントが対象チャンネルのいずれかを購読しているかチェック
      const hasMatchingChannel = channels.some(channel => 
        client.channels.has(channel) || 
        (channel === `user:${notification.userId}` && client.userId === notification.userId)
      );

      if (hasMatchingChannel) {
        this.sendToClient(clientId, message);
        sentCount++;
      }
    }

    console.log(`📤 Notification sent to ${sentCount} clients: ${notification.title}`);
    return sentCount;
  }

  // 通知作成ヘルパー
  public createNotification(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    data?: Record<string, any>
  ): BaseNotification {
    return {
      id: this.generateNotificationId(),
      type,
      userId,
      title,
      message,
      data,
      timestamp: new Date().toISOString(),
      isRead: false,
      priority
    };
  }

  // ユーザー固有の通知送信
  public sendUserNotification(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    data?: Record<string, any>
  ) {
    const notification = this.createNotification(userId, type, title, message, priority, data);
    return this.sendNotification(notification, [`user:${userId}`]);
  }

  // ロール別通知送信
  public sendRoleNotification(
    role: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    data?: Record<string, any>
  ) {
    const notification = this.createNotification(0, type, title, message, priority, data);
    return this.sendNotification(notification, [`role:${role.toLowerCase()}`]);
  }

  // システム全体通知送信
  public sendSystemNotification(
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    data?: Record<string, any>
  ) {
    const notification = this.createNotification(0, type, title, message, priority, data);
    return this.sendNotification(notification, ['system', 'public']);
  }

  // 接続中のクライアント数
  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  // 特定ユーザーの接続状況
  public isUserConnected(userId: number): boolean {
    for (const client of this.clients.values()) {
      if (client.userId === userId) return true;
    }
    return false;
  }

  // ハートビート設定
  private setupHeartbeat() {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30秒

      for (const [clientId, client] of this.clients) {
        if (now - client.lastPing > timeout) {
          console.log(`💔 Client timeout: ${clientId}`);
          client.ws.terminate();
          this.clients.delete(clientId);
        } else if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }
    }, 10000); // 10秒間隔
  }

  // クリーンアップ
  public cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    for (const client of this.clients.values()) {
      client.ws.close();
    }
    
    this.clients.clear();
    
    if (this.wss) {
      this.wss.close();
    }
  }

  // ユーティリティメソッド
  private generateClientId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateNotificationId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

// シングルトンインスタンス
export const notificationManager = new NotificationWebSocketManager(); 