'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchFilters, { SearchFilters as SearchFiltersType } from '../../src/components/SearchFilters';
import NotificationCenter from '../../src/components/NotificationCenter';

interface Program {
  id: number;
  title: string;
  description: string;
  applicationEndDate: string | null;
  maxParticipants: number | null;
  tags: string[];
  company: {
    companyName: string;
    logoUrl?: string;
    industry?: string;
  };
  applicationCount: number;
  daysUntilDeadline: number | null;
  popularityScore: number;
  matchScore: number;
}

interface SearchResponse {
  programs: Program[];
  pagination: {
    totalResults: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  suggestions: {
    keywords: string[];
    categories: string[];
    skills: string[];
  };
}

export default function ProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [pagination, setPagination] = useState({
    totalResults: 0,
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [suggestions, setSuggestions] = useState<{
    keywords: string[];
    categories: string[];
    skills: string[];
  }>({
    keywords: [],
    categories: [],
    skills: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // デフォルトの検索フィルター
  const [filters, setFilters] = useState<SearchFiltersType>({
    query: '',
    categories: [],
    skills: [],
    locations: [],
    employmentTypes: [],
    salaryRange: { min: 0, max: 1000000 },
    applicationDeadline: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // 認証チェック
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (error) {
        console.error('Token parsing error:', error);
      }
    }
  }, []);

  // 初期データ読み込み
  useEffect(() => {
    performSearch();
  }, []);

  // 検索実行
  const performSearch = async (customFilters?: SearchFiltersType, page = 1) => {
    setIsLoading(true);
    try {
      const searchFilters = customFilters || filters;
      const response = await fetch('/api/programs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchFilters.query,
          categories: searchFilters.categories,
          skills: searchFilters.skills,
          locations: searchFilters.locations,
          employmentTypes: searchFilters.employmentTypes,
          salaryMin: searchFilters.salaryRange.min,
          salaryMax: searchFilters.salaryRange.max,
          applicationDeadline: searchFilters.applicationDeadline,
          sortBy: searchFilters.sortBy,
          sortOrder: searchFilters.sortOrder,
          page,
          limit: 12
        }),
      });

      if (response.ok) {
        const data: SearchResponse = await response.json();
        setPrograms(data.programs);
        setPagination(data.pagination);
        setSuggestions(data.suggestions);
      } else {
        console.error('Search failed:', response.status);
        setPrograms([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  };

  // フィルター変更ハンドラー
  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
  };

  // 検索実行ハンドラー
  const handleSearch = () => {
    performSearch(filters, 1);
  };

  // ページネーション
  const handlePageChange = (page: number) => {
    performSearch(filters, page);
  };

  // ログアウト
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/');
  };

  // プログラムカード
  const ProgramCard = ({ program }: { program: Program }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="p-6">
        {/* 企業情報 */}
        <div className="flex items-center mb-4">
          {program.company.logoUrl ? (
            <img
              src={program.company.logoUrl}
              alt={`${program.company.companyName} logo`}
              className="w-12 h-12 rounded-lg object-cover mr-3"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
              <span className="text-gray-500 text-xs">LOGO</span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{program.company.companyName}</h3>
            {program.company.industry && (
              <p className="text-sm text-gray-600">{program.company.industry}</p>
            )}
          </div>
        </div>

        {/* プログラム情報 */}
        <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {program.title}
        </h2>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {program.description}
        </p>

        {/* タグ */}
        {program.tags && program.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {program.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {program.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{program.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 統計情報 */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span>応募者: {program.applicationCount}人</span>
            {program.maxParticipants && (
              <span>定員: {program.maxParticipants}人</span>
            )}
          </div>
          {program.daysUntilDeadline !== null && (
            <div className={`font-medium ${
              program.daysUntilDeadline <= 7 
                ? 'text-red-600' 
                : program.daysUntilDeadline <= 14 
                ? 'text-orange-600' 
                : 'text-green-600'
            }`}>
              {program.daysUntilDeadline > 0 
                ? `締切まで${program.daysUntilDeadline}日`
                : '締切済み'
              }
            </div>
          )}
        </div>

        {/* マッチ度・人気度 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">マッチ度</span>
            <div className="w-16 bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full" 
                style={{ width: `${Math.min(program.matchScore, 100)}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-600">{Math.round(program.matchScore)}%</span>
          </div>
          <div className="text-xs text-gray-500">
            人気度: {Math.round(program.popularityScore)}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex space-x-2">
          <Link
            href={`/programs/${program.id}`}
            className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            詳細を見る
          </Link>
          {userRole === 'STUDENT' && program.daysUntilDeadline && program.daysUntilDeadline > 0 && (
            <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
              応募
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                日本学生アンバサダー協議会
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/programs" className="text-blue-600 font-medium px-3 py-2 rounded-md">
                プログラム検索
              </Link>
              {userRole === 'STUDENT' && (
                <>
                  <Link href="/student/dashboard" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                    ダッシュボード
                  </Link>
                  <Link href="/student/applications" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                    応募管理
                  </Link>
                </>
              )}
              {userRole === 'COMPANY' && (
                <>
                  <Link href="/company/dashboard" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                    ダッシュボード
                  </Link>
                  <Link href="/company/programs" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                    プログラム管理
                  </Link>
                </>
              )}
              
              {/* 通知センター */}
              {userRole && <NotificationCenter />}
              
              {userRole ? (
                <button 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-md transition"
                >
                  ログアウト
                </button>
              ) : (
                <Link href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
                  ログイン
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            アンバサダープログラム検索
          </h1>
          <p className="text-gray-600">
            あなたにぴったりのプログラムを見つけましょう
          </p>
        </div>

        {/* 検索フィルター */}
        <div className="mb-8">
          <SearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
            isLoading={isLoading}
            totalResults={pagination.totalResults}
          />
        </div>

        {/* 検索候補 */}
        {suggestions.keywords.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-2">人気の検索キーワード</h3>
            <div className="flex flex-wrap gap-2">
              {suggestions.keywords.map((keyword, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const newFilters = { ...filters, query: keyword };
                    setFilters(newFilters);
                    performSearch(newFilters, 1);
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* プログラム一覧 */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="flex space-x-2 mb-4">
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : programs.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {programs.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>

            {/* ページネーション */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  前へ
                </button>
                
                <div className="flex space-x-1">
                  {[...Array(Math.min(pagination.totalPages, 5))].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-md ${
                          page === pagination.currentPage
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  次へ
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33M15 17H9.928c-.32 0-.64-.114-.852-.326L6.89 14.488c-.214-.224-.339-.532-.339-.855V12.5c0-.323.125-.631.339-.855l2.186-2.186C9.288 9.236 9.608 9.111 9.928 9h5.144c.32 0 .64.125.852.326l2.186 2.186c.214.224.339.532.339.855v1.133c0 .323-.125.631-.339.855l-2.186 2.186c-.212.212-.532.326-.852.326z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              条件に一致するプログラムが見つかりませんでした
            </h3>
            <p className="text-gray-600 mb-4">
              検索条件を変更して再度お試しください
            </p>
            <button
              onClick={() => {
                const resetFilters: SearchFiltersType = {
                  query: '',
                  categories: [],
                  skills: [],
                  locations: [],
                  employmentTypes: [],
                  salaryRange: { min: 0, max: 1000000 },
                  applicationDeadline: '',
                  sortBy: 'created_at',
                  sortOrder: 'desc'
                };
                setFilters(resetFilters);
                performSearch(resetFilters, 1);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              すべてのプログラムを表示
            </button>
          </div>
        )}
      </main>
    </div>
  );
} 