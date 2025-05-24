'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import NotificationCenter from '../../../src/components/NotificationCenter';

interface DashboardStats {
  totalPrograms: number;
  activePrograms: number;
  totalApplications: number;
  pendingApplications: number;
}

interface RecentProgram {
  id: number;
  title: string;
  type: string;
  applicationCount: number;
  status: 'ACTIVE' | 'DRAFT' | 'CLOSED';
  createdAt: string;
}

interface RecentApplication {
  id: number;
  student: {
    firstName: string;
    lastName: string;
    university?: string;
  };
  program: {
    title: string;
  };
  status: string;
  appliedAt: string;
}

export default function CompanyDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPrograms, setRecentPrograms] = useState<RecentProgram[]>([]);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          window.location.href = '/auth/login';
          return;
        }

        // ユーザー情報を取得
        const userResponse = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        }

        // ダッシュボード統計を取得
        const statsResponse = await fetch('/api/company/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        // 最近のプログラムを取得
        const programsResponse = await fetch('/api/company/programs?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (programsResponse.ok) {
          const programsData = await programsResponse.json();
          setRecentPrograms(programsData);
        }

        // 最近の応募を取得
        const applicationsResponse = await fetch('/api/company/applications?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json();
          setRecentApplications(applicationsData);
        }

      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              <Link href="/company/dashboard" className="text-xl font-bold text-blue-600">
                日本学生アンバサダー協議会
              </Link>
              <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                企業アカウント
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-8">
                <Link href="/company/programs" className="text-gray-600 hover:text-blue-600">
                  プログラム管理
                </Link>
                <Link href="/company/applications" className="text-gray-600 hover:text-blue-600">
                  応募者管理
                </Link>
                <Link href="/company/profile" className="text-gray-600 hover:text-blue-600">
                  企業プロフィール
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
            ようこそ、{user?.companyProfile?.name || '企業'}さん
          </h1>
          <p className="mt-2 text-gray-600">企業ダッシュボード</p>
        </div>

        {/* 統計カード */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総プログラム数</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalPrograms}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">アクティブプログラム</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.activePrograms}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総応募者数</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalApplications}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">未審査応募</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingApplications}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 最近のプログラム */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">最近のプログラム</h2>
                <Link 
                  href="/company/programs"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  すべて見る →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentPrograms.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">プログラムがありません</p>
                  <Link
                    href="/company/programs/create"
                    className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    プログラムを作成
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPrograms.map((program) => (
                    <div key={program.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{program.title}</h3>
                        <p className="text-sm text-gray-600">{program.type}</p>
                        <p className="text-xs text-gray-500">作成日: {formatDate(program.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {program.applicationCount}名応募
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          program.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          program.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {program.status === 'ACTIVE' ? 'アクティブ' :
                           program.status === 'DRAFT' ? 'ドラフト' : 'クローズ'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 最近の応募 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">最近の応募</h2>
                <Link 
                  href="/company/applications"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  すべて見る →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentApplications.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">応募がありません</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentApplications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {application.student.lastName} {application.student.firstName}
                        </h3>
                        <p className="text-sm text-gray-600">{application.program.title}</p>
                        <p className="text-xs text-gray-500">
                          {application.student.university} • {formatDate(application.appliedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          application.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {application.status === 'PENDING' ? '審査中' :
                           application.status === 'ACCEPTED' ? '合格' : '不合格'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">クイックアクション</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/company/programs/create"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">新しいプログラムを作成</h3>
                <p className="text-sm text-gray-600">学生向けのプログラムを公開</p>
              </div>
            </Link>

            <Link
              href="/company/applications"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">応募を確認</h3>
                <p className="text-sm text-gray-600">学生の応募を審査・管理</p>
              </div>
            </Link>

            <Link
              href="/company/profile"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">企業プロフィール</h3>
                <p className="text-sm text-gray-600">企業情報を更新・管理</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 