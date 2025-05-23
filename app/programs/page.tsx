'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Program {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  benefits?: string;
  applicationEndDate?: string;
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
  status: string;
  tags?: string;
  company: {
    companyName: string;
    logoUrl?: string;
  };
  _count: {
    applications: number;
  };
}

interface ProgramsResponse {
  programs: Program[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function ProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // ユーザーロールを確認
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch {
        // トークンが無効な場合は無視
      }
    }

    fetchPrograms();
  }, []);

  const fetchPrograms = async (search?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/programs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('プログラムの取得に失敗しました');
      }

      const data: ProgramsResponse = await response.json();
      setPrograms(data.programs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    fetchPrograms(searchTerm);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未定';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const parseTags = (tagsString?: string) => {
    if (!tagsString) return [];
    try {
      return JSON.parse(tagsString);
    } catch {
      return [];
    }
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              日本学生アンバサダー協議会
            </Link>
            <nav className="flex items-center space-x-4">
              {userRole === 'STUDENT' && (
                <Link href="/student/dashboard" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                  ダッシュボード
                </Link>
              )}
              {userRole === 'COMPANY' && (
                <Link href="/company/dashboard" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                  ダッシュボード
                </Link>
              )}
              {!userRole && (
                <>
                  <Link href="/auth/login" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                    ログイン
                  </Link>
                  <Link href="/auth/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
                    新規登録
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タイトルと検索 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">アンバサダープログラム一覧</h1>
          
          <form onSubmit={handleSearch} className="flex gap-4 max-w-md">
            <input
              type="text"
              placeholder="プログラムを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              検索
            </button>
          </form>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* プログラム一覧 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <div key={program.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                  {program.title}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  program.status === 'PUBLISHED' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {program.status === 'PUBLISHED' ? '募集中' : program.status}
                </span>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-3">
                {program.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium">企業:</span>
                  <span className="ml-2">{program.company.companyName}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium">応募締切:</span>
                  <span className="ml-2">{formatDate(program.applicationEndDate)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium">実施期間:</span>
                  <span className="ml-2">
                    {formatDate(program.startDate)} ～ {formatDate(program.endDate)}
                  </span>
                </div>
                {program.maxParticipants && (
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium">定員:</span>
                    <span className="ml-2">{program.maxParticipants}名</span>
                  </div>
                )}
              </div>

              {/* タグ */}
              <div className="flex flex-wrap gap-2 mb-4">
                {parseTags(program.tags).map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  応募者数: {program._count.applications}名
                </span>
                
                {userRole === 'STUDENT' ? (
                  <Link
                    href={`/programs/${program.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
                  >
                    詳細・応募
                  </Link>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition text-sm"
                  >
                    要ログイン
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* プログラムが見つからない場合 */}
        {programs.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">プログラムが見つかりませんでした。</p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  fetchPrograms();
                }}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                検索をクリア
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 