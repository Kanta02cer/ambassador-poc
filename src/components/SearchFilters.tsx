'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface SearchFilters {
  query: string;
  categories: string[];
  skills: string[];
  locations: string[];
  employmentTypes: string[];
  salaryRange: {
    min: number;
    max: number;
  };
  applicationDeadline: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  isLoading?: boolean;
  totalResults?: number;
}

export default function SearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  isLoading = false,
  totalResults = 0
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedSearches, setSavedSearches] = useState<Array<{
    name: string;
    filters: SearchFilters;
  }>>([]);

  // よく使われるカテゴリとスキル
  const categories = [
    { id: 'tech', label: 'テクノロジー', icon: '💻' },
    { id: 'marketing', label: 'マーケティング', icon: '📈' },
    { id: 'design', label: 'デザイン', icon: '🎨' },
    { id: 'business', label: 'ビジネス', icon: '💼' },
    { id: 'education', label: '教育', icon: '📚' },
    { id: 'healthcare', label: 'ヘルスケア', icon: '🏥' },
    { id: 'finance', label: '金融', icon: '💰' },
    { id: 'consulting', label: 'コンサルティング', icon: '🤝' }
  ];

  const skills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript',
    'データ分析', 'UI/UX', 'プロジェクト管理', 'コンテンツマーケティング',
    'SEO', 'SNSマーケティング', 'グラフィックデザイン', 'ビジネス戦略',
    '財務分析', '営業', 'カスタマーサポート', '人事', '法務'
  ];

  const locations = [
    '東京都', '大阪府', '神奈川県', '愛知県', '福岡県', '北海道',
    '京都府', '兵庫県', '埼玉県', '千葉県', 'リモート', '海外'
  ];

  const employmentTypes = [
    { id: 'internship', label: 'インターンシップ' },
    { id: 'part_time', label: 'アルバイト' },
    { id: 'contract', label: '業務委託' },
    { id: 'full_time', label: '正社員' },
    { id: 'project', label: 'プロジェクト型' }
  ];

  const sortOptions = [
    { id: 'created_at', label: '新着順' },
    { id: 'application_deadline', label: '締切順' },
    { id: 'salary', label: '報酬順' },
    { id: 'popularity', label: '人気順' },
    { id: 'match_score', label: 'マッチ度順' }
  ];

  // 保存された検索を読み込み
  useEffect(() => {
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved searches:', error);
      }
    }
  }, []);

  // フィルター更新
  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  // 配列型フィルターの切り替え
  const toggleArrayFilter = <K extends keyof SearchFilters>(
    key: K,
    value: string
  ) => {
    const current = filters[key] as string[];
    const newArray = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, newArray as SearchFilters[K]);
  };

  // フィルターリセット
  const resetFilters = () => {
    const resetFilters: SearchFilters = {
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
    onFiltersChange(resetFilters);
  };

  // 検索保存
  const saveSearch = () => {
    const name = window.prompt('検索条件に名前をつけてください');
    if (name && name.trim()) {
      const newSavedSearch = {
        name: name.trim(),
        filters: { ...filters }
      };
      const updated = [...savedSearches, newSavedSearch];
      setSavedSearches(updated);
      localStorage.setItem('savedSearches', JSON.stringify(updated));
    }
  };

  // 保存された検索を読み込み
  const loadSavedSearch = (savedFilters: SearchFilters) => {
    onFiltersChange(savedFilters);
    onSearch();
  };

  // アクティブなフィルター数
  const activeFiltersCount = 
    filters.categories.length +
    filters.skills.length +
    filters.locations.length +
    filters.employmentTypes.length +
    (filters.applicationDeadline ? 1 : 0) +
    (filters.salaryRange.min > 0 || filters.salaryRange.max < 1000000 ? 1 : 0);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* 基本検索バー */}
      <div className="p-4">
        <div className="flex space-x-4">
          {/* 検索クエリ */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              placeholder="プログラム名、企業名、キーワードで検索..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 検索ボタン */}
          <button
            onClick={onSearch}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              '検索'
            )}
          </button>

          {/* 詳細フィルター展開ボタン */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center space-x-2"
          >
            <span>詳細フィルター</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDownIcon 
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>

        {/* 結果数表示 */}
        {totalResults > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            {totalResults.toLocaleString()}件の結果が見つかりました
          </div>
        )}
      </div>

      {/* 詳細フィルター */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-6">
          {/* 保存された検索 */}
          {savedSearches.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">保存された検索</h3>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map((saved, index) => (
                  <button
                    key={index}
                    onClick={() => loadSavedSearch(saved.filters)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {saved.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* カテゴリフィルター */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">カテゴリ</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.id)}
                    onChange={() => toggleArrayFilter('categories', category.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    {category.icon} {category.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* スキルフィルター */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">必要スキル</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleArrayFilter('skills', skill)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    filters.skills.includes(skill)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {skill}
                  {filters.skills.includes(skill) && (
                    <XMarkIcon className="h-3 w-3 ml-1 inline" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 勤務地フィルター */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">勤務地</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {locations.map((location) => (
                <label key={location} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.locations.includes(location)}
                    onChange={() => toggleArrayFilter('locations', location)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{location}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 雇用形態 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">雇用形態</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {employmentTypes.map((type) => (
                <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.employmentTypes.includes(type.id)}
                    onChange={() => toggleArrayFilter('employmentTypes', type.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 報酬範囲 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">報酬範囲（月額）</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">最低額</label>
                <input
                  type="number"
                  value={filters.salaryRange.min}
                  onChange={(e) => updateFilter('salaryRange', {
                    ...filters.salaryRange,
                    min: parseInt(e.target.value) || 0
                  })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">最高額</label>
                <input
                  type="number"
                  value={filters.salaryRange.max}
                  onChange={(e) => updateFilter('salaryRange', {
                    ...filters.salaryRange,
                    max: parseInt(e.target.value) || 1000000
                  })}
                  placeholder="1000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 応募締切 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">応募締切</h3>
            <input
              type="date"
              value={filters.applicationDeadline}
              onChange={(e) => updateFilter('applicationDeadline', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ソート */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">並び順</h3>
            <div className="flex space-x-4">
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.sortOrder}
                onChange={(e) => updateFilter('sortOrder', e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">降順</option>
                <option value="asc">昇順</option>
              </select>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onSearch}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              検索実行
            </button>
            <button
              onClick={saveSearch}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              保存
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              リセット
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 