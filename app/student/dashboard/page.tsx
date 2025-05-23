'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NotificationCenter from '../../../src/components/NotificationCenter';
import DevNotificationTester from '../../../src/components/DevNotificationTester';

interface DashboardData {
  user: {
    id: number;
    name: string;
    email: string;
    university?: string;
    badgeCount: number;
  };
  applications: Array<{
    id: number;
    programTitle: string;
    companyName: string;
    appliedAt: string;
    status: string;
  }>;
  recommendedPrograms: Array<{
    id: number;
    title: string;
    companyName: string;
    description: string;
    applicationEndDate?: string;
  }>;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
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
        
        if (userRole !== 'STUDENT') {
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
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No access token found');
        }
        
        const headers = { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        const [applicationsRes, programsRes] = await Promise.all([
          fetch('/api/applications', { headers }),
          fetch('/api/programs?limit=5', { headers })
        ]);

        if (!applicationsRes.ok || !programsRes.ok) {
          throw new Error('API request failed');
        }

        const applicationsData = await applicationsRes.json();
        const programsData = await programsRes.json();

        // JWTトークンからユーザー情報を取得
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        const dashboardData: DashboardData = {
          user: {
            id: payload.id,
            name: `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || 'ユーザー',
            email: payload.email,
            university: 'テスト大学', // プロフィールAPIから取得予定
            badgeCount: 0 // バッジAPIから取得予定
          },
          applications: applicationsData.applications?.map((app: any) => ({
            id: app.id,
            programTitle: app.program?.title || 'プログラム名未取得',
            companyName: app.program?.company?.companyName || '企業名未取得',
            appliedAt: new Date(app.createdAt).toLocaleDateString('ja-JP'),
            status: app.status
          })) || [],
          recommendedPrograms: programsData.programs?.slice(0, 5).map((program: any) => ({
            id: program.id,
            title: program.title,
            companyName: program.company?.companyName || '企業名未取得',
            description: program.description,
            applicationEndDate: program.applicationEndDate ? new Date(program.applicationEndDate).toLocaleDateString('ja-JP') : undefined
          })) || []
        };

        setDashboardData(dashboardData);
      } catch (err) {
        setError('データの取得に失敗しました');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '申請中', color: 'bg-yellow-100 text-yellow-800' },
      under_review: { text: '選考中', color: 'bg-blue-100 text-blue-800' },
      shortlisted: { text: '書類通過', color: 'bg-green-100 text-green-800' },
      interview_scheduled: { text: '面接予定', color: 'bg-purple-100 text-purple-800' },
      accepted: { text: '採用', color: 'bg-green-100 text-green-800' },
      rejected_by_company: { text: '不採用', color: 'bg-red-100 text-red-800' }
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
              <Link href="/programs" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                プログラム検索
              </Link>
              <Link href="/student/profile" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                プロフィール
              </Link>
              <Link href="/student/applications" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                応募管理
              </Link>
              <NotificationCenter />
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
            ようこそ、{dashboardData.user.name}さん
          </h1>
          <p className="text-gray-600 mt-2">学生ダッシュボード</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* プロフィールサマリー */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">プロフィール</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-lg">
                      {dashboardData.user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{dashboardData.user.name}</p>
                    <p className="text-sm text-gray-600">{dashboardData.user.university || '大学未設定'}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">取得バッジ数</span>
                    <span className="font-medium text-blue-600">{dashboardData.user.badgeCount}</span>
                  </div>
                </div>
                <Link 
                  href="/student/profile" 
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-center block"
                >
                  プロフィール編集
                </Link>
              </div>
            </div>
          </div>

          {/* メインコンテンツエリア */}
          <div className="lg:col-span-2 space-y-8">
            {/* 応募中プログラム */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">応募中プログラム</h2>
                  <Link 
                    href="/student/applications" 
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    すべて見る →
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {dashboardData.applications.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.applications.slice(0, 3).map((application) => {
                      const statusInfo = getStatusDisplay(application.status);
                      return (
                        <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-1">
                                {application.programTitle}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {application.companyName}
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
                    <p className="text-gray-500 mb-4">まだ応募しているプログラムがありません</p>
                    <Link 
                      href="/programs" 
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                      プログラムを探す
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* おすすめプログラム */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">おすすめプログラム</h2>
                  <Link 
                    href="/programs" 
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    すべて見る →
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {dashboardData.recommendedPrograms.map((program) => (
                    <div key={program.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {program.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {program.companyName}
                      </p>
                      <p className="text-sm text-gray-700 mb-3">
                        {program.description}
                      </p>
                      {program.applicationEndDate && (
                        <p className="text-xs text-gray-500 mb-3">
                          応募期限: {new Date(program.applicationEndDate).toLocaleDateString()}
                        </p>
                      )}
                      <Link 
                        href={`/programs/${program.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        詳細を見る →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 開発モード用通知テスター */}
      <DevNotificationTester />
    </div>
  );
} 