'use client';

import { useState, useEffect } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface FormData {
  email: string;
  accountType: 'STUDENT' | 'COMPANY' | 'ADMIN';
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    accountType: 'STUDENT'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [providers, setProviders] = useState<any>(null);
  const [providersLoading, setProvidersLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProviders = async () => {
      try {
        console.log('プロバイダーを取得中...');
        const res = await getProviders();
        console.log('取得したプロバイダー:', res);
        setProviders(res);
      } catch (error) {
        console.error('プロバイダー取得エラー:', error);
      } finally {
        setProvidersLoading(false);
      }
    };
    loadProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: '認証リンクをメールアドレスに送信しました。メールをご確認ください。' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: result.error || 'エラーが発生しました' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'ネットワークエラーが発生しました' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: false 
      });
      
      if (result?.error) {
        setMessage({ 
          type: 'error', 
          text: 'Googleログインでエラーが発生しました: ' + result.error 
        });
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Googleログインでエラーが発生しました' 
      });
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ログイン
          </h1>
          <p className="text-gray-600">
            学生アンバサダー協議会へようこそ
          </p>
        </div>

        {/* Google認証ボタン（利用可能な場合のみ表示） */}
        {providersLoading ? (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              <p className="text-sm text-gray-600">認証プロバイダーを読み込み中...</p>
            </div>
          </div>
        ) : providers?.google ? (
          <>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'ログイン中...' : 'Googleでログイン'}
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>
          </>
        ) : (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">Google認証の状態</p>
                <p className="text-xs text-blue-600 mt-1">
                  利用可能なプロバイダー: {providers ? Object.keys(providers).join(', ') : 'なし'}
                </p>
                {!providers?.google && (
                  <p className="text-xs text-blue-600 mt-1">
                    Google認証を使用するには、GOOGLE_OAUTH_SETUP.mdを参照して設定を完了してください。
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* メール認証フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-2">
              アカウントタイプ
            </label>
            <select
              id="accountType"
              value={formData.accountType}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                accountType: e.target.value as FormData['accountType'] 
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="STUDENT">学生</option>
              <option value="COMPANY">企業</option>
              <option value="ADMIN">管理者</option>
            </select>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '送信中...' : 'マジックリンクを送信'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            アカウントをお持ちでない場合は、ログイン時に自動的に作成されます
          </p>
        </div>
      </div>
    </div>
  );
}
