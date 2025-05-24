'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

interface StudentProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  university?: string;
  major?: string;
  graduationYear?: number;
  gpa?: number;
  bio?: string;
  skills?: string;
  profileImage?: string;
  portfolio?: string;
  linkedinUrl?: string;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<StudentProfile>();

  // プロフィール情報を取得
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          window.location.href = '/auth/login';
          return;
        }

        const response = await fetch('/api/student/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          reset(data);
        } else {
          throw new Error('プロフィールの取得に失敗しました');
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        setMessage('プロフィールの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  // プロフィール更新
  const onSubmit = async (data: StudentProfile) => {
    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setMessage('プロフィールを更新しました');
      } else {
        throw new Error('更新に失敗しました');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage('プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
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
              <Link href="/student/profile" className="text-blue-600 font-medium">
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
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
            <p className="mt-1 text-gray-600">
              あなたの情報を更新して、企業により良いアピールをしましょう
            </p>
          </div>

          {message && (
            <div className={`mx-6 mt-4 p-4 rounded-md ${
              message.includes('失敗') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* 基本情報 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">基本情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    姓 *
                  </label>
                  <input
                    type="text"
                    {...register('lastName', { required: '姓は必須です' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    名 *
                  </label>
                  <input
                    type="text"
                    {...register('firstName', { required: '名は必須です' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    メールアドレス *
                  </label>
                  <input
                    type="email"
                    {...register('email', { required: 'メールアドレスは必須です' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    {...register('phoneNumber')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 学歴情報 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">学歴情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    大学名
                  </label>
                  <input
                    type="text"
                    {...register('university')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    専攻
                  </label>
                  <input
                    type="text"
                    {...register('major')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    卒業予定年
                  </label>
                  <input
                    type="number"
                    {...register('graduationYear')}
                    min="2020"
                    max="2030"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    GPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.0"
                    {...register('gpa')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 自己紹介・スキル */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">自己紹介・スキル</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    自己紹介
                  </label>
                  <textarea
                    {...register('bio')}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="あなたの強みや興味について教えてください..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    スキル
                  </label>
                  <input
                    type="text"
                    {...register('skills')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="JavaScript, Python, マーケティング, デザイン（カンマ区切り）"
                  />
                </div>
              </div>
            </div>

            {/* リンク情報 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">リンク情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ポートフォリオURL
                  </label>
                  <input
                    type="url"
                    {...register('portfolio')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    {...register('linkedinUrl')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>

            {/* 保存ボタン */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : 'プロフィールを保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 