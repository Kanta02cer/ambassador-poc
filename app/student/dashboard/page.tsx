'use client';

import React, { useState, useEffect } from 'react';
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          window.location.href = '/auth/login';
          return;
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
            university: 'テスト大学',
            badgeCount: 0
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
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/student/dashboard" className="text-xl font-bold text-blue-600">
                日本学生アンバサダー協議会
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
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
              </nav>
              
              <NotificationCenter />
              
              <button
                onClick={() => {
                  localStorage.removeItem('accessToken');
                  window.location.href = '/auth/login';
                }}
                className="text-gray-600 hover:text-red-600"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ウェルカムメッセージ */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            ようこそ、{dashboardData.user.name}さん
          </h1>
          <p className="mt-2 text-gray-600">学生ダッシュボード</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* プロフィールカード */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {dashboardData.user.name.charAt(0)}
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {dashboardData.user.name}
                </h3>
                <p className="text-gray-600">{dashboardData.user.university}</p>
                <p className="text-sm text-gray-500">{dashboardData.user.email}</p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData.user.badgeCount}
                </div>
                <div className="text-sm text-gray-600">取得バッジ数</div>
              </div>
              <Link
                href="/student/profile"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                プロフィール編集
              </Link>
            </div>
          </div>

          {/* 応募中プログラム */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">応募中プログラム</h2>
                  <Link 
                    href="/student/applications"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    すべて見る →
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {dashboardData.applications.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-4">まだ応募しているプログラムがありません</p>
                    <Link
                      href="/programs"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      プログラムを探す
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.applications.slice(0, 3).map((application) => {
                      const statusInfo = getStatusDisplay(application.status);
                      return (
                        <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">
                                {application.programTitle}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {application.companyName}
                              </p>
                              <p className="text-xs text-gray-500">
                                応募日: {application.appliedAt}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* おすすめプログラム */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">おすすめプログラム</h2>
                <Link 
                  href="/programs"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  すべて見る →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {dashboardData.recommendedPrograms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">おすすめプログラムを読み込み中...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData.recommendedPrograms.map((program) => (
                    <div key={program.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {program.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {program.companyName}
                      </p>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                        {program.description}
                      </p>
                      {program.applicationEndDate && (
                        <p className="text-xs text-red-600 mb-3">
                          締切: {program.applicationEndDate}
                        </p>
                      )}
                      <Link
                        href={`/programs/${program.id}`}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        詳細を見る
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 開発環境用通知テスター */}
        {process.env.NODE_ENV === 'development' && <DevNotificationTester />}
      </div>
    </div>
  );
} 