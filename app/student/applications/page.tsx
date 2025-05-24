'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Application {
  id: number;
  program: {
    id: number;
    title: string;
    company: {
      name: string;
      logo?: string;
    };
    type: string;
    applicationDeadline: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'INTERVIEW_SCHEDULED';
  appliedAt: string;
  notes?: string;
}

const statusLabels = {
  PENDING: '審査中',
  ACCEPTED: '合格',
  REJECTED: '不合格',
  INTERVIEW_SCHEDULED: '面接予定'
};

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  INTERVIEW_SCHEDULED: 'bg-blue-100 text-blue-800'
};

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          window.location.href = '/auth/login';
          return;
        }

        const response = await fetch('/api/student/applications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setApplications(data);
        } else {
          throw new Error('応募情報の取得に失敗しました');
        }
      } catch (error) {
        console.error('Applications fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

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
              <Link href="/student/applications" className="text-blue-600 font-medium">
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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">応募管理</h1>
          <p className="mt-2 text-gray-600">
            応募したプログラムの進捗状況を確認できます
          </p>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">フィルター</h2>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                すべて ({applications.length})
              </button>
              {Object.entries(statusLabels).map(([status, label]) => {
                const count = applications.filter(app => app.status === status).length;
                return (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 応募一覧 */}
        <div className="bg-white rounded-lg shadow">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? '応募履歴がありません' : `${statusLabels[filter as keyof typeof statusLabels]}の応募がありません`}
              </h3>
              <p className="text-gray-600 mb-4">
                {filter === 'all' ? 'プログラムに応募して履歴を確認しましょう' : '他のステータスの応募を確認してみてください'}
              </p>
              <Link
                href="/programs"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                プログラムを探す
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <div key={application.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {application.program.company.logo && (
                          <img
                            src={application.program.company.logo}
                            alt={application.program.company.name}
                            className="w-8 h-8 rounded"
                          />
                        )}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {application.program.title}
                          </h3>
                          <p className="text-gray-600">
                            {application.program.company.name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m4 0V8a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2h-4z" />
                          </svg>
                          {application.program.type}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m4 0V8a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2h-4z" />
                          </svg>
                          応募日: {formatDate(application.appliedAt)}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          締切: {formatDate(application.program.applicationDeadline)}
                        </span>
                      </div>

                      {application.notes && (
                        <p className="text-gray-600 text-sm mb-3">
                          {application.notes}
                        </p>
                      )}
                    </div>

                    <div className="ml-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[application.status]}`}>
                        {statusLabels[application.status]}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-4">
                    <Link
                      href={`/programs/${application.program.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      プログラム詳細
                    </Link>
                    {application.status === 'INTERVIEW_SCHEDULED' && (
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                        面接詳細
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 統計情報 */}
        {applications.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{applications.length}</div>
              <div className="text-gray-600">総応募数</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {applications.filter(app => app.status === 'PENDING').length}
              </div>
              <div className="text-gray-600">審査中</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-green-600">
                {applications.filter(app => app.status === 'ACCEPTED').length}
              </div>
              <div className="text-gray-600">合格</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {applications.filter(app => app.status === 'INTERVIEW_SCHEDULED').length}
              </div>
              <div className="text-gray-600">面接予定</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 