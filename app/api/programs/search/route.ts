import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { Prisma } from '../../../../src/generated/prisma';

interface SearchParams {
  query?: string;
  categories?: string[];
  skills?: string[];
  locations?: string[];
  employmentTypes?: string[];
  salaryMin?: number;
  salaryMax?: number;
  applicationDeadline?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 高度な検索機能
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query = '',
      categories = [],
      skills = [],
      locations = [],
      employmentTypes = [],
      salaryMin = 0,
      salaryMax = 1000000,
      applicationDeadline,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    }: SearchParams = body;

    const skip = (page - 1) * limit;

    // 基本的なWHERE条件
    const where: Prisma.ProgramWhereInput = {
      isPublic: true,
      status: 'PUBLISHED'
    };

    // テキスト検索（タイトル、説明、企業名）
    if (query.trim()) {
      where.OR = [
        {
          title: {
            contains: query
          }
        },
        {
          description: {
            contains: query
          }
        },
        {
          company: {
            companyName: {
              contains: query
            }
          }
        }
      ];

      // タグ検索（JSONフィールド内の検索）
      if (query.length > 0) {
        where.OR.push({
          tags: {
            contains: query
          }
        });
      }
    }

    // カテゴリ、スキル、勤務地などの検索（tagsとdescriptionフィールドを使用）
    const searchTerms = [
      ...categories,
      ...skills,
      ...locations,
      ...employmentTypes
    ];

    if (searchTerms.length > 0) {
      const orConditions = searchTerms.map(term => ({
        OR: [
          {
            tags: {
              contains: term
            }
          },
          {
            description: {
              contains: term
            }
          },
          {
            title: {
              contains: term
            }
          }
        ]
      }));

      if (where.AND) {
        where.AND = Array.isArray(where.AND) ? [...where.AND, ...orConditions] : [where.AND, ...orConditions];
      } else {
        where.AND = orConditions;
      }
    }

    // 応募締切フィルター
    if (applicationDeadline) {
      const deadline = new Date(applicationDeadline);
      const additionalCondition = {
        applicationEndDate: {
          gte: deadline
        }
      };

      if (where.AND) {
        where.AND = Array.isArray(where.AND) ? [...where.AND, additionalCondition] : [where.AND, additionalCondition];
      } else {
        where.AND = additionalCondition;
      }
    }

    // ソート条件の設定
    const orderBy: Prisma.ProgramOrderByWithRelationInput = {};
    
    switch (sortBy) {
      case 'created_at':
        orderBy.createdAt = sortOrder;
        break;
      case 'application_deadline':
        orderBy.applicationEndDate = sortOrder;
        break;
      case 'popularity':
        // 応募数でソート（人気順）
        orderBy.applications = {
          _count: sortOrder
        };
        break;
      case 'title':
        orderBy.title = sortOrder;
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    // 検索実行
    const [programs, totalCount] = await Promise.all([
      prisma.program.findMany({
        where,
        include: {
          company: {
            select: {
              companyName: true,
              logoUrl: true,
              industry: true,
              description: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.program.count({ where })
    ]);

    // レスポンス用に加工
    const enhancedPrograms = programs.map(program => {
      // タグを配列に変換（JSONフィールドから）
      let tags: string[] = [];
      try {
        if (program.tags) {
          tags = typeof program.tags === 'string' ? JSON.parse(program.tags) : program.tags;
        }
      } catch (error) {
        // タグがJSONでない場合は文字列として分割
        tags = program.tags ? program.tags.split(',').map(tag => tag.trim()) : [];
      }

      return {
        ...program,
        tags,
        applicationCount: program._count.applications,
        company: {
          ...program.company,
          // ロゴURLの絶対パス化
          logoUrl: program.company.logoUrl 
            ? `/uploads/${program.company.logoUrl}`
            : null
        },
        // 締切日までの日数計算
        daysUntilDeadline: program.applicationEndDate 
          ? Math.ceil((program.applicationEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null,
        // 人気度スコア計算
        popularityScore: program._count.applications * 10 + 
          (program.maxParticipants ? (program._count.applications / program.maxParticipants) * 100 : 0),
        // マッチ度スコア（将来的にMLで実装）
        matchScore: Math.random() * 100 // 暫定的にランダム
      };
    });

    // 検索統計情報
    const searchStats = {
      totalResults: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
      searchTime: Date.now() // 実際の検索時間は別途測定
    };

    // 関連する検索候補（頻繁に一緒に検索されるキーワード）
    const searchSuggestions = await generateSearchSuggestions(query, categories, skills);

    return NextResponse.json({
      programs: enhancedPrograms,
      pagination: searchStats,
      suggestions: searchSuggestions,
      filters: {
        appliedFilters: {
          query,
          categories,
          skills,
          locations,
          employmentTypes,
          salaryRange: { min: salaryMin, max: salaryMax },
          applicationDeadline
        }
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    return NextResponse.json(
      { 
        error: '検索処理に失敗しました',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// 検索候補生成（将来的に機械学習で改善）
async function generateSearchSuggestions(
  query: string, 
  categories: string[], 
  skills: string[]
): Promise<{
  keywords: string[];
  categories: string[];
  skills: string[];
}> {
  try {
    // よく検索されるキーワードを取得
    const popularPrograms = await prisma.program.findMany({
      where: {
        isPublic: true,
        status: 'PUBLISHED'
      },
      select: {
        tags: true,
        title: true,
        description: true
      },
      take: 100
    });

    // タグからキーワード候補を抽出
    const allTags: string[] = [];
    popularPrograms.forEach(program => {
      if (program.tags) {
        try {
          const tags = typeof program.tags === 'string' ? JSON.parse(program.tags) : program.tags;
          if (Array.isArray(tags)) {
            allTags.push(...tags);
          }
        } catch (error) {
          // JSONでない場合は文字列として分割
          const tags = program.tags.split(',').map(tag => tag.trim());
          allTags.push(...tags);
        }
      }
    });

    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);

    // よく使われるカテゴリ（タグから推定）
    const categoryKeywords = ['テクノロジー', 'マーケティング', 'デザイン', 'ビジネス', '教育', 'ヘルスケア', '金融', 'コンサルティング'];
    const suggestedCategories = categoryKeywords.filter(cat => 
      allTags.some(tag => tag.includes(cat))
    );

    // よく使われるスキル（タグから推定）
    const skillKeywords = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'データ分析', 'UI/UX', 'プロジェクト管理'];
    const suggestedSkills = skillKeywords.filter(skill => 
      allTags.some(tag => tag.includes(skill))
    );

    return {
      keywords: sortedTags,
      categories: suggestedCategories,
      skills: suggestedSkills
    };

  } catch (error) {
    console.error('Failed to generate search suggestions:', error);
    return {
      keywords: [],
      categories: [],
      skills: []
    };
  }
}

// 検索履歴保存用のGETエンドポイント
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'suggestions') {
      // 検索候補のみを返す
      const suggestions = await generateSearchSuggestions('', [], []);
      return NextResponse.json(suggestions);
    }

    if (action === 'popular') {
      // 人気の検索キーワードを返す
      const popularPrograms = await prisma.program.findMany({
        where: {
          isPublic: true,
          status: 'PUBLISHED'
        },
        include: {
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: {
          applications: {
            _count: 'desc'
          }
        },
        take: 10
      });

      const popularKeywords = popularPrograms.map(p => p.title);
      
      return NextResponse.json({
        keywords: popularKeywords,
        programs: popularPrograms.map(p => ({
          id: p.id,
          title: p.title,
          applicationCount: p._count.applications
        }))
      });
    }

    return NextResponse.json(
      { error: '無効なアクションです' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json(
      { error: '検索候補の取得に失敗しました' },
      { status: 500 }
    );
  }
} 