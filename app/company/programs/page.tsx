'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NotificationCenter from '../../../src/components/NotificationCenter';

interface Program {
  id: number;
  title: string;
  description: string;
  status: string;
  isPublic: boolean;
  applicationStartDate?: string;
  applicationEndDate?: string;
  maxParticipants?: number;
  createdAt: string;
  _count?: {
    applications: number;
  };
}

export default function CompanyProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        // 企業アカウントかチェック
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.role !== 'COMPANY') {
            router.push('/');
            return;
          }
        } catch (error) {
          router.push('/auth/login');
          return;
        }

        // 企業のプログラム一覧を取得
        const response = await fetch('/api/programs?companyOwned=true', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPrograms(data.programs || []);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'プログラムの取得に失敗しました');
        }
      } catch (error: any) {
        console.error('Programs fetch error:', error);
        setError(error.message || 'プログラムの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return '公開中';
      case 'DRAFT':
        return 'ドラフト';
      case 'CLOSED':
        return '募集終了';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const filteredPrograms = programs.filter(program => {
    if (filter === 'ALL') return true;
    return program.status === filter;
  });

  const stats = {
    total: programs.length,
    published: programs.filter(p => p.status === 'PUBLISHED').length,
    draft: programs.filter(p => p.status === 'DRAFT').length,
    closed: programs.filter(p => p.status === 'CLOSED').length,
    totalApplications: programs.reduce((sum, p) => sum + (p._count?.applications || 0), 0)
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
              <NotificationCenter />
              <nav className="flex space-x-8">
                <Link href="/company/dashboard" className="text-gray-600 hover:text-blue-600">
                  ダッシュボード
                </Link>
                <span className="text-blue-600 font-medium">
                  プログラム管理
                </span>
                <Link href="/company/applications" className="text-gray-600 hover:text-blue-600">
                  応募者管理
                </Link>
                <Link href="/company/profile" className="text-gray-600 hover:text-blue-600">
                  企業プロフィール
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
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ページヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">プログラム管理</h1>
              <p className="text-gray-600 mt-1">作成したプログラムの管理・編集ができます</p>
            </div>
            <Link
              href="/company/programs/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              + 新規プログラム作成
            </Link>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m0 14h14" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">総プログラム数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">公開中</p>
                <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-100">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">ドラフト</p>
                <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">募集終了</p>
                <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">総応募者数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">プログラム一覧</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === 'ALL' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setFilter('PUBLISHED')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  公開中
                </button>
                <button
                  onClick={() => setFilter('DRAFT')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === 'DRAFT' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ドラフト
                </button>
                <button
                  onClick={() => setFilter('CLOSED')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === 'CLOSED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  募集終了
                </button>
              </div>
            </div>
          </div>

          {/* プログラムリスト */}
          <div className="divide-y divide-gray-200">
            {error ? (
              <div className="p-6 text-center">
                <div className="text-red-600 mb-2">{error}</div>
                <button
                  onClick={() => window.location.reload()}
                  className="text-blue-600 hover:text-blue-700"
                >
                  再読み込み
                </button>
              </div>
            ) : filteredPrograms.length === 0 ? (
              <div className="p-6 text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">プログラムがありません</h3>
                <p className="text-gray-600 mb-4">
                  {filter === 'ALL' ? '新しいプログラムを作成してみましょう' : `${getStatusText(filter)}のプログラムはありません`}
                </p>
                {filter === 'ALL' && (
                  <Link
                    href="/company/programs/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    新規プログラム作成
                  </Link>
                )}
              </div>
            ) : (
              filteredPrograms.map((program) => (
                <div key={program.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          <Link
                            href={`/programs/${program.id}`}
                            className="hover:text-blue-600"
                          >
                            {program.title}
                          </Link>
                        </h3>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
                          {getStatusText(program.status)}
                        </span>
                        {!program.isPublic && (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            非公開
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1 line-clamp-2">{program.description}</p>
                      <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                        <span>作成日: {formatDate(program.createdAt)}</span>
                        {program.applicationEndDate && (
                          <span>締切: {formatDate(program.applicationEndDate)}</span>
                        )}
                        {program.maxParticipants && (
                          <span>募集人数: {program.maxParticipants}名</span>
                        )}
                        <span>応募者: {program._count?.applications || 0}名</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <Link
                        href={`/programs/${program.id}`}
                        className="px-3 py-1 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                      >
                        詳細
                      </Link>
                      <Link
                        href={`/company/programs/${program.id}/edit`}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        編集
                      </Link>
                      <Link
                        href={`/company/programs/${program.id}/applications`}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        応募者
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 