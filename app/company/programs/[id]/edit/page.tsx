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
  tags?: string;
  company: {
    companyName: string;
    userId: number;
  };
}

export default function ProgramEditPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params?.id as string;
  
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [canEdit, setCanEdit] = useState(false);

  // フォームデータ
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    applicationStartDate: '',
    applicationEndDate: '',
    startDate: '',
    endDate: '',
    maxParticipants: '',
    status: 'DRAFT',
    isPublic: true
  });

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        let payload: any = null;
        try {
          payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.role !== 'COMPANY') {
            router.push('/');
            return;
          }
        } catch (error) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch(`/api/programs/${programId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.program) {
            setProgram(data.program);
            
            // 権限チェック
            const canEditProgram = data.program.company.userId === payload.id;
            setCanEdit(canEditProgram);
            
            if (!canEditProgram) {
              setError('このプログラムを編集する権限がありません');
              return;
            }

            // フォームデータを設定
            setFormData({
              title: data.program.title || '',
              description: data.program.description || '',
              requirements: data.program.requirements || '',
              responsibilities: data.program.responsibilities || '',
              benefits: data.program.benefits || '',
              applicationStartDate: data.program.applicationStartDate ? 
                new Date(data.program.applicationStartDate).toISOString().split('T')[0] : '',
              applicationEndDate: data.program.applicationEndDate ? 
                new Date(data.program.applicationEndDate).toISOString().split('T')[0] : '',
              startDate: data.program.startDate ? 
                new Date(data.program.startDate).toISOString().split('T')[0] : '',
              endDate: data.program.endDate ? 
                new Date(data.program.endDate).toISOString().split('T')[0] : '',
              maxParticipants: data.program.maxParticipants?.toString() || '',
              status: data.program.status || 'DRAFT',
              isPublic: data.program.isPublic ?? true
            });
          } else {
            throw new Error('プログラムデータが見つかりません');
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'プログラムが見つかりません');
        }
      } catch (error: any) {
        console.error('Program fetch error:', error);
        setError(error.message || 'プログラムの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (programId) {
      fetchProgram();
    }
  }, [programId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/programs/${programId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null
        })
      });

      if (response.ok) {
        setMessage('プログラムが更新されました');
        // 3秒後にプログラム詳細ページに遷移
        setTimeout(() => {
          router.push(`/programs/${programId}`);
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プログラムの更新に失敗しました');
      }
    } catch (error: any) {
      console.error('Program update error:', error);
      setError(error.message || 'プログラムの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('本当にこのプログラムを削除しますか？この操作は取り消せません。')) {
      return;
    }

    setDeleting(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/programs/${programId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage('プログラムが削除されました');
        // 3秒後にプログラム管理ページに遷移
        setTimeout(() => {
          router.push('/company/programs');
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プログラムの削除に失敗しました');
      }
    } catch (error: any) {
      console.error('Program delete error:', error);
      setError(error.message || 'プログラムの削除に失敗しました');
    } finally {
      setDeleting(false);
    }
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

  if (error || !program || !canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">アクセスできません</h1>
          <p className="text-gray-600 mb-4">{error || 'このプログラムを編集する権限がありません'}</p>
          <Link
            href="/company/dashboard"
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
              <Link href="/company/dashboard" className="text-xl font-bold text-blue-600">
                日本学生アンバサダー協議会
              </Link>
              <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                企業アカウント
              </span>
            </div>
            
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
              <Link href="/company/dashboard" className="text-gray-500 hover:text-gray-700">
                ダッシュボード
              </Link>
            </li>
            <li className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <Link href="/company/programs" className="ml-4 text-gray-500 hover:text-gray-700">
                プログラム管理
              </Link>
            </li>
            <li className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-4 text-gray-700">プログラム編集</span>
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow">
          {/* ヘッダー */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">プログラム編集</h1>
            <p className="text-gray-600 mt-1">プログラムの情報を編集できます</p>
          </div>

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  プログラムタイトル *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  プログラム概要 *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                  応募要件
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="responsibilities" className="block text-sm font-medium text-gray-700 mb-2">
                  業務内容
                </label>
                <textarea
                  id="responsibilities"
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-2">
                  特典・報酬
                </label>
                <textarea
                  id="benefits"
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 日程情報 */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">日程情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="applicationStartDate" className="block text-sm font-medium text-gray-700 mb-2">
                    応募開始日
                  </label>
                  <input
                    type="date"
                    id="applicationStartDate"
                    name="applicationStartDate"
                    value={formData.applicationStartDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="applicationEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                    応募締切日
                  </label>
                  <input
                    type="date"
                    id="applicationEndDate"
                    name="applicationEndDate"
                    value={formData.applicationEndDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    プログラム開始日
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    プログラム終了日
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 設定 */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">設定</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-2">
                    募集人数
                  </label>
                  <input
                    type="number"
                    id="maxParticipants"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    ステータス
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DRAFT">ドラフト</option>
                    <option value="PUBLISHED">公開中</option>
                    <option value="CLOSED">募集終了</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">公開プログラム（チェックを外すと非公開になります）</span>
                  </label>
                </div>
              </div>
            </div>

            {/* メッセージ表示 */}
            {message && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="text-green-800">{message}</div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800">{error}</div>
              </div>
            )}

            {/* ボタン */}
            <div className="border-t border-gray-200 pt-6 flex items-center justify-between">
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '変更を保存'}
                </button>

                <Link
                  href={`/programs/${programId}`}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  プレビュー
                </Link>

                <Link
                  href="/company/programs"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </Link>
              </div>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? '削除中...' : 'プログラムを削除'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 