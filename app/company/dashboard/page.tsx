'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CompanyDashboardData {
  company: {
    id: number;
    companyName: string;
    logoUrl?: string;
    description?: string;
  };
  stats: {
    totalPrograms: number;
    activePrograms: number;
    totalApplications: number;
    pendingBadgeRequests: number;
  };
  recentApplications: Array<{
    id: number;
    studentName: string;
    programTitle: string;
    appliedAt: string;
    status: string;
  }>;
  badgeRequestStatus: Array<{
    id: number;
    studentName: string;
    programTitle: string;
    status: string;
    requestedAt: string;
  }>;
}

export default function CompanyDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<CompanyDashboardData | null>(null);
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
        
        if (userRole !== 'company') {
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
        
        // const [statsRes, applicationsRes, badgeRequestsRes] = await Promise.all([
        //   fetch('/api/companies/me/stats', { headers }),
        //   fetch('/api/programs?companyId=me&limit=5&sort=recent_activity', { headers }),
        //   fetch('/api/badges/requests?companyId=me&limit=5', { headers })
        // ]);

        // 仮のデータ（実際のAPI実装後に削除）
        const mockData: CompanyDashboardData = {
          company: {
            id: 1,
            companyName: 'テスト企業株式会社',
            logoUrl: undefined,
            description: '革新的なソリューションを提供するテクノロジー企業'
          },
          stats: {
            totalPrograms: 3,
            activePrograms: 2,
            totalApplications: 15,
            pendingBadgeRequests: 2
          },
          recentApplications: [
            {
              id: 1,
              studentName: '田中太郎',
              programTitle: 'デジタルマーケティングアンバサダー',
              appliedAt: '2024-01-20',
              status: 'pending'
            },
            {
              id: 2,
              studentName: '佐藤花子',
              programTitle: 'SNS運用アンバサダー',
              appliedAt: '2024-01-19',
              status: 'under_review'
            },
            {
              id: 3,
              studentName: '山田次郎',
              programTitle: 'デジタルマーケティングアンバサダー',
              appliedAt: '2024-01-18',
              status: 'accepted'
            }
          ],
          badgeRequestStatus: [
            {
              id: 1,
              studentName: '鈴木一郎',
              programTitle: 'ブランドアンバサダープログラム',
              status: 'pending',
              requestedAt: '2024-01-15'
            },
            {
              id: 2,
              studentName: '高橋美咲',
              programTitle: 'SNS運用アンバサダー',
              status: 'approved',
              requestedAt: '2024-01-10'
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

  const getApplicationStatusDisplay = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '未対応', color: 'bg-yellow-100 text-yellow-800' },
      under_review: { text: '選考中', color: 'bg-blue-100 text-blue-800' },
      shortlisted: { text: '書類通過', color: 'bg-green-100 text-green-800' },
      interview_scheduled: { text: '面接予定', color: 'bg-purple-100 text-purple-800' },
      accepted: { text: '採用', color: 'bg-green-100 text-green-800' },
      rejected_by_company: { text: '不採用', color: 'bg-red-100 text-red-800' }
    };
    
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getBadgeRequestStatusDisplay = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '申請中', color: 'bg-yellow-100 text-yellow-800' },
      approved: { text: '承認済み', color: 'bg-green-100 text-green-800' },
      rejected: { text: '却下', color: 'bg-red-100 text-red-800' }
    };
    
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
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
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/company/programs" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                プログラム管理
              </Link>
              <Link href="/company/badges/request" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                バッジ発行申請
              </Link>
              <Link href="/company/profile/edit" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                企業情報
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
            {dashboardData.company.companyName}
          </h1>
          <p className="text-gray-600 mt-2">企業ダッシュボード</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">登録プログラム数</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalPrograms}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">募集中プログラム</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.activePrograms}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総応募者数</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">申請中バッジ</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.pendingBadgeRequests}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 最近の応募者 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">最近の応募者</h2>
                <Link 
                  href="/company/programs" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  すべて見る →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {dashboardData.recentApplications.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentApplications.map((application) => {
                    const statusInfo = getApplicationStatusDisplay(application.status);
                    return (
                      <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {application.studentName}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {application.programTitle}
                            </p>
                            <p className="text-xs text-gray-500">
                              応募日: {new Date(application.appliedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">まだ応募者がいません</p>
                  <Link 
                    href="/company/programs/new" 
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    新規プログラム作成
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* バッジ発行申請状況 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">バッジ発行申請状況</h2>
                <Link 
                  href="/company/badges/request" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  新規申請 →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {dashboardData.badgeRequestStatus.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.badgeRequestStatus.map((request) => {
                    const statusInfo = getBadgeRequestStatusDisplay(request.status);
                    return (
                      <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {request.studentName}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {request.programTitle}
                            </p>
                            <p className="text-xs text-gray-500">
                              申請日: {new Date(request.requestedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">バッジ発行申請がありません</p>
                  <Link 
                    href="/company/badges/request" 
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    バッジ発行申請
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">クイックアクション</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/company/programs/new"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-center"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">新規プログラム作成</p>
              <p className="text-sm text-gray-600">アンバサダープログラムを新規登録</p>
            </Link>

            <Link 
              href="/company/programs"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition text-center"
            >
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">プログラム管理</p>
              <p className="text-sm text-gray-600">登録済みプログラムの管理・編集</p>
            </Link>

            <Link 
              href="/company/badges/request"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition text-center"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">バッジ発行申請</p>
              <p className="text-sm text-gray-600">アンバサダーバッジの発行申請</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 