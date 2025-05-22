'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminDashboardData {
  stats: {
    totalUsers: number;
    totalStudents: number;
    totalCompanies: number;
    totalPrograms: number;
    totalApplications: number;
    totalBadgesIssued: number;
    pendingBadgeRequests: number;
  };
  pendingRequests: Array<{
    id: number;
    studentName: string;
    companyName: string;
    programTitle: string;
    requestedAt: string;
    comments?: string;
  }>;
  recentActivity: Array<{
    id: number;
    type: 'user_registration' | 'program_created' | 'application_submitted' | 'badge_issued';
    description: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return false;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role || payload.user?.role;
        
        if (userRole !== 'admin') {
          router.push('/');
          return false;
        }
        return true;
      } catch {
        localStorage.removeItem('accessToken');
        router.push('/auth/login');
        return false;
      }
    };

    const fetchDashboardData = async () => {
      if (!checkAuth()) return;

      try {
        // TODO: 実際のAPI実装後に以下のコメントアウトを解除
        // const token = localStorage.getItem('accessToken');
        // const headers = { Authorization: `Bearer ${token}` };
        
        // const [statsRes, pendingRequestsRes] = await Promise.all([
        //   fetch('/api/admin/stats', { headers }),
        //   fetch('/api/admin/badge-requests?status=pending&limit=5', { headers })
        // ]);

        // 仮のデータ（実際のAPI実装後に削除）
        const mockData: AdminDashboardData = {
          stats: {
            totalUsers: 125,
            totalStudents: 98,
            totalCompanies: 25,
            totalPrograms: 42,
            totalApplications: 186,
            totalBadgesIssued: 23,
            pendingBadgeRequests: 7
          },
          pendingRequests: [
            {
              id: 1,
              studentName: '田中太郎',
              companyName: 'テクノロジー株式会社',
              programTitle: 'デジタルマーケティングアンバサダー',
              requestedAt: '2024-01-20',
              comments: '積極的にSNSでの発信を行い、エンゲージメント率が向上した。'
            },
            {
              id: 2,
              studentName: '佐藤花子',
              companyName: 'イノベーション企業',
              programTitle: 'ブランドアンバサダープログラム',
              requestedAt: '2024-01-19',
              comments: 'イベント運営において優れたリーダーシップを発揮した。'
            },
            {
              id: 3,
              studentName: '山田次郎',
              companyName: 'スタートアップ',
              programTitle: 'コミュニティマネージャー',
              requestedAt: '2024-01-18',
              comments: 'オンラインコミュニティの活性化に大きく貢献した。'
            }
          ],
          recentActivity: [
            {
              id: 1,
              type: 'badge_issued',
              description: '高橋美咲さんにSNS運用アンバサダーバッジが発行されました',
              timestamp: '2024-01-20T10:30:00Z'
            },
            {
              id: 2,
              type: 'program_created',
              description: 'グリーンテック企業が新しいプログラム「環境アンバサダー」を作成しました',
              timestamp: '2024-01-20T09:15:00Z'
            },
            {
              id: 3,
              type: 'user_registration',
              description: '新しい学生ユーザー「鈴木一郎」が登録しました',
              timestamp: '2024-01-20T08:45:00Z'
            },
            {
              id: 4,
              type: 'application_submitted',
              description: '伊藤さくらさんがブランドアンバサダープログラムに応募しました',
              timestamp: '2024-01-19T16:20:00Z'
            }
          ]
        };

        setDashboardData(mockData);
      } catch (err) {
        setError('データの取得に失敗しました');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'program_created':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'application_submitted':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'badge_issued':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}分前`;
    } else if (hours < 24) {
      return `${hours}時間前`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}日前`;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'エラーが発生しました'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                日本学生アンバサダー協議会
              </Link>
              <span className="ml-3 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                管理者
              </span>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/admin/badge-requests" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                バッジ承認管理
              </Link>
              <Link href="/admin/users" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                ユーザー管理
              </Link>
              <Link href="/admin/programs" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                プログラム管理
              </Link>
              <button 
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-md transition"
              >
                ログアウト
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            管理者ダッシュボード
          </h1>
          <p className="text-gray-600 mt-2">日本学生アンバサダー協議会 管理画面</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalUsers}</p>
                <p className="text-xs text-gray-500">学生: {dashboardData.stats.totalStudents} / 企業: {dashboardData.stats.totalCompanies}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総プログラム数</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalPrograms}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総応募数</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">発行バッジ数</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalBadgesIssued}</p>
                <p className="text-xs text-gray-500">申請中: {dashboardData.stats.pendingBadgeRequests}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 承認待ちバッジ申請 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  承認待ちバッジ申請
                  {dashboardData.stats.pendingBadgeRequests > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {dashboardData.stats.pendingBadgeRequests}
                    </span>
                  )}
                </h2>
                <Link 
                  href="/admin/badge-requests" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  すべて見る →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {dashboardData.pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.pendingRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {request.studentName}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {request.programTitle}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            申請企業: {request.companyName}
                          </p>
                          {request.comments && (
                                                       <p className="text-xs text-gray-500 mb-2 italic">
                             &ldquo;{request.comments}&rdquo;
                           </p>
                          )}
                          <p className="text-xs text-gray-500">
                            申請日: {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200 transition">
                            承認
                          </button>
                          <button className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200 transition">
                            却下
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">承認待ちの申請はありません</p>
                </div>
              )}
            </div>
          </div>

          {/* 最近のアクティビティ */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">最近のアクティビティ</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 管理アクション */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">管理メニュー</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/admin/badge-requests"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition text-center"
            >
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">バッジ承認管理</p>
              <p className="text-sm text-gray-600">バッジ発行申請の承認・却下</p>
            </Link>

            <Link 
              href="/admin/users"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-center"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">ユーザー管理</p>
              <p className="text-sm text-gray-600">学生・企業ユーザーの管理</p>
            </Link>

            <Link 
              href="/admin/programs"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition text-center"
            >
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">プログラム管理</p>
              <p className="text-sm text-gray-600">アンバサダープログラムの監督</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 