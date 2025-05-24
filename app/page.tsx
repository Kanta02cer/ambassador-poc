'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // ログイン済みの場合はダッシュボードにリダイレクト
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  // ローディング中の表示
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ログイン済みの場合は何も表示しない（リダイレクト中）
  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">
                学生アンバサダー協議会
              </h1>
            </div>
            <nav className="flex space-x-4">
              <Link 
                href="/auth/login" 
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition"
              >
                ログイン
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main>
        {/* ヒーローセクション */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              学生と企業をつなぐ<br />
              <span className="text-blue-600">アンバサダープラットフォーム</span>
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              企業のアンバサダープログラムに参加し、実践的な経験を積みながら
              信頼性の高いデジタルバッジを取得できる新しいプラットフォームです。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/login" 
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
              >
                今すぐ始める
              </Link>
              <Link 
                href="#features" 
                className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-50 transition"
              >
                詳細を見る
              </Link>
            </div>
          </div>
        </section>

        {/* 特徴セクション */}
        <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              プラットフォームの特徴
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {/* 学生向け */}
              <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">学生向け</h4>
                <p className="text-gray-600">
                  実践的なアンバサダー活動を通じて経験を積み、
                  信頼性の高いデジタルバッジを取得できます。
                </p>
              </div>

              {/* 企業向け */}
              <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h2M7 7h10M7 11h10M7 15h10" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">企業向け</h4>
                <p className="text-gray-600">
                  優秀な学生アンバサダーを効率的に募集・管理し、
                  ブランド価値向上につなげることができます。
                </p>
              </div>

              {/* 信頼性 */}
              <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">信頼性の保証</h4>
                <p className="text-gray-600">
                  協議会による厳格な承認プロセスにより、
                  バッジの信頼性と価値を担保しています。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* フローセクション */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              ご利用の流れ
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                <h4 className="font-semibold mb-2">アカウント登録</h4>
                <p className="text-sm text-gray-600">Googleアカウントまたはメールでログイン</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                <h4 className="font-semibold mb-2">プログラム参加</h4>
                <p className="text-sm text-gray-600">企業のプログラムに応募・選考</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                <h4 className="font-semibold mb-2">活動実施</h4>
                <p className="text-sm text-gray-600">アンバサダー活動を実践</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
                <h4 className="font-semibold mb-2">バッジ取得</h4>
                <p className="text-sm text-gray-600">協議会認定のバッジを取得</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTAセクション */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              今すぐ始めませんか？
            </h3>
            <p className="text-xl text-blue-100 mb-8">
              Googleアカウントまたはメールアドレスでかんたんにログインできます
            </p>
            <Link 
              href="/auth/login" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition inline-block"
            >
              ログイン・新規登録
            </Link>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h5 className="text-lg font-semibold mb-4">学生アンバサダー協議会</h5>
              <p className="text-gray-400">
                学生と企業をつなぐアンバサダープラットフォーム
              </p>
            </div>
            <div>
              <h6 className="font-semibold mb-4">リンク</h6>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition">協議会について</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">利用規約</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">プライバシーポリシー</Link></li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold mb-4">お問い合わせ</h6>
              <p className="text-gray-400">
                support@ambassador-council.jp
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 学生アンバサダー協議会. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
