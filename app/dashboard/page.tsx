'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return 'あなたは学生として登録されています。プログラムへの応募や、バッジの取得ができます。'
      case 'COMPANY':
        return 'あなたは企業ユーザーとして登録されています。プログラムの作成・管理、バッジの発行ができます。'
      case 'ADMIN':
        return 'あなたは管理者として登録されています。システム全体の管理が可能です。'
      default:
        return '役割が設定されていません。'
    }
  }

  const getProviderName = (providerId?: string) => {
    switch (providerId) {
      case 'google':
        return 'Google'
      case 'email':
        return 'メール認証'
      default:
        return '不明'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ダッシュボード
              </h1>
              <p className="text-gray-600">
                学生アンバサダー協議会へようこそ、{session.user.name || session.user.email}さん
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {session.user.image && (
                <img 
                  src={session.user.image} 
                  alt="プロフィール画像" 
                  className="w-12 h-12 rounded-full border-2 border-blue-200"
                />
              )}
              <button 
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>

        {/* ユーザー情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">プロフィール情報</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">メールアドレス:</span>
                <p className="text-gray-900">{session.user.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">ユーザー名:</span>
                <p className="text-gray-900">{session.user.name || '未設定'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">ユーザーID:</span>
                <p className="text-gray-900 font-mono text-sm">{session.user.id}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">認証方法:</span>
                <p className="text-gray-900">{getProviderName('不明')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">役割・権限</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">現在の役割:</span>
                <div className="flex items-center mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    session.user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                    session.user.role === 'COMPANY' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {session.user.role === 'ADMIN' ? '管理者' :
                     session.user.role === 'COMPANY' ? '企業' : '学生'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">説明:</span>
                <p className="text-gray-900 text-sm mt-1">
                  {getRoleDescription(session.user.role || 'STUDENT')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ロール別コンテンツ */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">利用可能な機能</h2>
          
          {session.user.role === 'STUDENT' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">プログラム一覧</h3>
                <p className="text-gray-600 text-sm mb-4">利用可能なアンバサダープログラムを確認</p>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  プログラムを見る
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">応募状況</h3>
                <p className="text-gray-600 text-sm mb-4">応募したプログラムの状況を確認</p>
                <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                  応募状況を見る
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">取得バッジ</h3>
                <p className="text-gray-600 text-sm mb-4">獲得したバッジを確認</p>
                <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  バッジを見る
                </button>
              </div>
            </div>
          )}

          {session.user.role === 'COMPANY' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">プログラム管理</h3>
                <p className="text-gray-600 text-sm mb-4">アンバサダープログラムの作成・管理</p>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  プログラム管理
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">応募者管理</h3>
                <p className="text-gray-600 text-sm mb-4">プログラム応募者の確認・選考</p>
                <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                  応募者管理
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">バッジ発行</h3>
                <p className="text-gray-600 text-sm mb-4">参加者へのバッジ発行・管理</p>
                <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  バッジ発行
                </button>
              </div>
            </div>
          )}

          {session.user.role === 'ADMIN' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ユーザー管理</h3>
                <p className="text-gray-600 text-sm mb-4">全ユーザーの管理</p>
                <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors">
                  ユーザー管理
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">システム設定</h3>
                <p className="text-gray-600 text-sm mb-4">システム全体の設定</p>
                <button className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors">
                  システム設定
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">統計・レポート</h3>
                <p className="text-gray-600 text-sm mb-4">利用統計とレポート</p>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  統計を見る
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">監査ログ</h3>
                <p className="text-gray-600 text-sm mb-4">システム監査ログ</p>
                <button className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                  ログ確認
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 