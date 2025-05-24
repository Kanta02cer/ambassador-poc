'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface VerificationResult {
  success: boolean;
  message: string;
  user?: {
    id: number;
    email: string;
    role: string;
    isActive: boolean;
  };
  accessToken?: string;
  redirectUrl?: string;
  error?: string;
}

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!searchParams) {
        setResult({
          success: false,
          message: '認証パラメータが見つかりません',
          error: '無効なリンクです'
        });
        setLoading(false);
        return;
      }

      const token = searchParams.get('token');
      
      if (!token) {
        setResult({
          success: false,
          message: '認証トークンが見つかりません',
          error: '無効なリンクです'
        });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify?token=${token}`);
        const data: VerificationResult = await response.json();
        
        setResult(data);

        if (data.success && data.accessToken) {
          // JWTトークンをローカルストレージに保存
          localStorage.setItem('accessToken', data.accessToken);
          
          // 3秒後に適切なダッシュボードにリダイレクト
          setTimeout(() => {
            if (data.redirectUrl) {
              router.push(data.redirectUrl);
            }
          }, 3000);
        }
      } catch (error) {
        console.error('認証エラー:', error);
        setResult({
          success: false,
          message: '認証処理中にエラーが発生しました',
          error: 'サーバーエラー'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [searchParams, router]);

  const getRoleText = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return '学生';
      case 'COMPANY':
        return '企業';
      case 'ADMIN':
        return '管理者';
      default:
        return role;
    }
  };

  const getDashboardLink = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return '/student/dashboard';
      case 'COMPANY':
        return '/company/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">認証処理中...</h2>
          <p className="text-gray-600">
            アカウントの認証を行っています。<br />
            少々お待ちください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        {result?.success ? (
          // 認証成功
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ログイン完了！
            </h1>
            
            <p className="text-gray-600 mb-4">
              {result.message}
            </p>
            
            {result.user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">アカウント情報</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>メールアドレス:</strong> {result.user.email}</p>
                  <p><strong>アカウントタイプ:</strong> {getRoleText(result.user.role)}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  3秒後に自動的にダッシュボードに移動します...
                </p>
              </div>
              
              <Link
                href={result.user ? getDashboardLink(result.user.role) : '/'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors inline-block text-center"
              >
                今すぐダッシュボードに移動
              </Link>
            </div>
          </div>
        ) : (
          // 認証失敗
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              認証に失敗しました
            </h1>
            
            <p className="text-gray-600 mb-4">
              {result?.message || '不明なエラーが発生しました'}
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-red-900 mb-2">考えられる原因</h3>
              <ul className="text-sm text-red-700 text-left space-y-1">
                <li>• 認証リンクの有効期限が切れている（15分間有効）</li>
                <li>• 認証リンクが既に使用されている</li>
                <li>• 認証リンクが無効または破損している</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors inline-block text-center"
              >
                新しい認証メールを送信
              </Link>
              
              <Link
                href="/"
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors inline-block text-center"
              >
                ホームページに戻る
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 