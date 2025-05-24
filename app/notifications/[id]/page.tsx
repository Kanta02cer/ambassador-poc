'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface NotificationDetail {
  id: string;
  type: string;
  userId: number;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: {
    programId?: number;
    programTitle?: string;
    companyName?: string;
    previousStatus?: string;
    newStatus?: string;
    interviewDate?: string;
    interviewLocation?: string;
    nextSteps?: string[];
    relatedLinks?: Array<{
      title: string;
      url: string;
    }>;
  };
  details?: {
    category: string;
    severity: string;
    actionRequired: boolean;
    expiryDate?: string;
    tags?: string[];
    source?: string;
    metadata?: any;
  };
}

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const notificationId = params?.id as string;
  
  const [notification, setNotification] = useState<NotificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchNotificationDetail = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch(`/api/notifications/${notificationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setNotification(data);
        } else {
          throw new Error('通知の取得に失敗しました');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (notificationId) {
      fetchNotificationDetail();
    }
  }, [notificationId, router]);

  const handleMarkAsRead = async () => {
    if (!notification || notification.isRead) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isRead: true })
      });

      if (response.ok) {
        setNotification(prev => prev ? { ...prev, isRead: true } : null);
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED':
        return '📝';
      case 'APPLICATION_STATUS_CHANGED':
        return '🔄';
      case 'PROGRAM_PUBLISHED':
        return '🆕';
      case 'PROGRAM_UPDATED':
        return '📢';
      case 'BADGE_REQUEST_APPROVED':
        return '✅';
      case 'MESSAGE_RECEIVED':
        return '💬';
      case 'SYSTEM_ANNOUNCEMENT':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'low':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">通知が見つかりません</h1>
          <p className="text-gray-600 mb-4">{error || 'この通知は削除されたか、アクセス権限がありません'}</p>
          <Link
            href="/student/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/student/dashboard" className="text-xl font-bold text-blue-600">
                日本学生アンバサダー協議会
              </Link>
            </div>
            
            <nav className="flex space-x-8">
              <Link href="/programs" className="text-gray-600 hover:text-blue-600">
                プログラム検索
              </Link>
              <Link href="/student/profile" className="text-gray-600 hover:text-blue-600">
                プロフィール
              </Link>
              <Link href="/student/applications" className="text-gray-600 hover:text-blue-600">
                応募管理
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('accessToken');
                  window.location.href = '/auth/login';
                }}
                className="text-gray-600 hover:text-red-600"
              >
                ログアウト
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* パンくずリスト */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/student/dashboard" className="text-gray-500 hover:text-gray-700">
                ダッシュボード
              </Link>
            </li>
            <li className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-4 text-gray-700">通知詳細</span>
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow">
          {/* 通知ヘッダー */}
          <div className={`p-6 border-b border-gray-200 rounded-t-lg ${
            !notification.isRead ? 'bg-blue-50' : ''
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <span className="text-3xl flex-shrink-0">
                  {getTypeIcon(notification.type)}
                </span>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {notification.title}
                  </h1>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(notification.priority)}`}>
                      {notification.priority === 'urgent' ? '緊急' :
                       notification.priority === 'high' ? '重要' :
                       notification.priority === 'medium' ? '通常' : '低'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(notification.timestamp)}
                    </span>
                    {!notification.isRead && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                        未読
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {!notification.isRead && (
                <button
                  onClick={handleMarkAsRead}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? '更新中...' : '既読にする'}
                </button>
              )}
            </div>
          </div>

          {/* 通知内容 */}
          <div className="p-6">
            <div className="space-y-6">
              {/* メッセージ */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-3">メッセージ</h2>
                <p className="text-gray-700 leading-relaxed">
                  {notification.message}
                </p>
              </div>

              {/* ステータス変更情報 */}
              {notification.data?.previousStatus && notification.data?.newStatus && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-3">ステータス変更</h2>
                  <div className="flex items-center space-x-4">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      {notification.data.previousStatus}
                    </span>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {notification.data.newStatus}
                    </span>
                  </div>
                </div>
              )}

              {/* 面接情報 */}
              {notification.data?.interviewDate && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-3">面接情報</h2>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">日時</dt>
                        <dd className="text-sm text-gray-900">
                          {formatDate(notification.data.interviewDate)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">場所</dt>
                        <dd className="text-sm text-gray-900">
                          {notification.data.interviewLocation}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 次のステップ */}
              {notification.data?.nextSteps && notification.data.nextSteps.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-3">次のステップ</h2>
                  <ul className="space-y-2">
                    {notification.data.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 関連リンク */}
              {notification.data?.relatedLinks && notification.data.relatedLinks.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-3">関連リンク</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notification.data.relatedLinks.map((link, index) => (
                      <Link
                        key={index}
                        href={link.url}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="text-blue-600 hover:text-blue-700">
                          {link.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* タグ */}
              {notification.details?.tags && notification.details.tags.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-3">タグ</h2>
                  <div className="flex flex-wrap gap-2">
                    {notification.details.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* フッター */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {notification.details?.category && (
                  <span>カテゴリ: {notification.details.category}</span>
                )}
              </div>
              <Link
                href="/student/dashboard"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 