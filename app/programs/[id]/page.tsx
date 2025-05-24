'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Program {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  applicationStartDate?: string;
  applicationEndDate?: string;
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
  status: string;
  isPublic: boolean;
  company: {
    companyName: string;
    logoUrl?: string;
    website?: string;
    description?: string;
  };
  _count?: {
    applications: number;
  };
}

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params?.id as string;
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    // ユーザー役割を確認
    const token = localStorage.getItem('accessToken');
    let payload: any = null;
    if (token) {
      try {
        payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (error) {
        console.error('Token parsing error:', error);
      }
    }

    const fetchProgram = async () => {
      try {
        const response = await fetch(`/api/programs/${programId}`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.program) {
            setProgram(data.program);
            
            // 編集権限チェック（企業アカウントで自社のプログラムの場合）
            if (token && payload.role === 'COMPANY') {
              const programCompanyUserId = data.program.company?.userId;
              setCanEdit(programCompanyUserId === payload.id);
            }
          } else {
            throw new Error('プログラムデータが見つかりません');
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'プログラムが見つかりません');
        }
      } catch (error: any) {
        console.error('Program fetch error:', error);
        setMessage(error.message || 'プログラムの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (programId) {
      fetchProgram();
    }
  }, [programId]);

  const handleApply = async () => {
    setApplying(true);
    setMessage('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          programId: parseInt(programId),
          motivation: '応募の動機をここに入力してください',
          experience: '',
          portfolioUrl: ''
        })
      });

      if (response.ok) {
        setMessage('応募を受け付けました！');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '応募に失敗しました');
      }
    } catch (error: any) {
      console.error('Application error:', error);
      setMessage(error.message || '応募に失敗しました');
    } finally {
      setApplying(false);
    }
  };

  const handleEdit = () => {
    router.push(`/company/programs/${programId}/edit`);
  };

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

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">プログラムが見つかりません</h1>
          <p className="text-gray-600 mb-4">{message || 'このプログラムは削除されたか、アクセス権限がありません'}</p>
          <Link
            href="/programs"
            className="text-blue-600 hover:text-blue-700"
          >
            プログラム一覧に戻る
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
              <Link href="/" className="text-xl font-bold text-blue-600">
                日本学生アンバサダー協議会
              </Link>
              {userRole === 'COMPANY' && (
                <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  企業アカウント
                </span>
              )}
            </div>
            
            <nav className="flex space-x-8">
              <Link href="/programs" className="text-blue-600 font-medium">
                プログラム検索
              </Link>
              {userRole === 'STUDENT' && (
                <>
                  <Link href="/student/profile" className="text-gray-600 hover:text-blue-600">
                    プロフィール
                  </Link>
                  <Link href="/student/applications" className="text-gray-600 hover:text-blue-600">
                    応募管理
                  </Link>
                </>
              )}
              {userRole === 'COMPANY' && (
                <>
                  <Link href="/company/dashboard" className="text-gray-600 hover:text-blue-600">
                    ダッシュボード
                  </Link>
                  <Link href="/company/programs" className="text-gray-600 hover:text-blue-600">
                    プログラム管理
                  </Link>
                </>
              )}
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
              <Link href="/programs" className="text-gray-500 hover:text-gray-700">
                プログラム一覧
              </Link>
            </li>
            <li className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-4 text-gray-700">{program.title}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* プログラムヘッダー */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {program.company.logoUrl && (
                      <img
                        src={program.company.logoUrl}
                        alt={program.company.companyName}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {program.title}
                      </h1>
                      <p className="text-lg text-gray-600 mt-1">
                        {program.company.companyName}
                      </p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          program.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                          program.status === 'CLOSED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {program.status === 'PUBLISHED' ? '募集中' :
                           program.status === 'CLOSED' ? '募集終了' :
                           program.status === 'DRAFT' ? 'ドラフト' : program.status}
                        </span>
                        {program._count && (
                          <span className="text-sm text-gray-500">
                            {program._count.applications}名応募
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {canEdit && (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      編集
                    </button>
                  )}
                </div>
              </div>

              {/* プログラム詳細 */}
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-3">プログラム概要</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{program.description}</p>
                </div>

                {program.requirements && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-3">応募要件</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{program.requirements}</p>
                  </div>
                )}

                {program.responsibilities && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-3">業務内容</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{program.responsibilities}</p>
                  </div>
                )}

                {program.benefits && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-3">特典・報酬</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{program.benefits}</p>
                  </div>
                )}

                {/* 企業情報 */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-3">企業について</h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{program.company.companyName}</h3>
                    {program.company.description && (
                      <p className="text-gray-700 mb-3">{program.company.description}</p>
                    )}
                    {program.company.website && (
                      <a
                        href={program.company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        企業サイトを見る →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* サイドバー */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">応募情報</h2>
              
              <div className="space-y-4">
                {program.applicationStartDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">応募開始日</dt>
                    <dd className="text-sm text-gray-900">{formatDate(program.applicationStartDate)}</dd>
                  </div>
                )}
                
                {program.applicationEndDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">応募締切日</dt>
                    <dd className="text-sm text-gray-900">{formatDate(program.applicationEndDate)}</dd>
                  </div>
                )}
                
                {program.startDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">開始予定日</dt>
                    <dd className="text-sm text-gray-900">{formatDate(program.startDate)}</dd>
                  </div>
                )}
                
                {program.endDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">終了予定日</dt>
                    <dd className="text-sm text-gray-900">{formatDate(program.endDate)}</dd>
                  </div>
                )}
                
                {program.maxParticipants && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">募集人数</dt>
                    <dd className="text-sm text-gray-900">{program.maxParticipants}名</dd>
                  </div>
                )}
              </div>

              {message && (
                <div className={`mt-4 p-3 rounded-md ${
                  message.includes('成功') || message.includes('受け付けました') 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}>
                  {message}
                </div>
              )}

              {userRole === 'STUDENT' && (
                <button
                  onClick={handleApply}
                  disabled={applying || program.status !== 'PUBLISHED'}
                  className={`w-full mt-6 px-4 py-3 rounded-md font-medium ${
                    program.status === 'PUBLISHED' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {applying ? '応募中...' : 
                   program.status === 'PUBLISHED' ? 'このプログラムに応募する' : '募集終了'}
                </button>
              )}

              {userRole === 'COMPANY' && canEdit && (
                <div className="mt-6 space-y-3">
                  <Link
                    href={`/company/programs/${programId}/edit`}
                    className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700"
                  >
                    プログラムを編集
                  </Link>
                  <Link
                    href={`/company/programs/${programId}/applications`}
                    className="block w-full px-4 py-3 bg-green-600 text-white text-center rounded-md hover:bg-green-700"
                  >
                    応募者を確認
                  </Link>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {userRole === 'STUDENT' && '応募には学生アカウントでのログインが必要です'}
                {userRole === 'COMPANY' && canEdit && 'このプログラムを管理できます'}
                {userRole === 'COMPANY' && !canEdit && '他社のプログラムです'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 