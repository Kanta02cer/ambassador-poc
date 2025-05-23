import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../../src/lib/auth';
import { Prisma } from '../../../src/generated/prisma';

// バッジ一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const programId = searchParams.get('programId');
    const badgeType = searchParams.get('badgeType');
    const skip = (page - 1) * limit;

    // 検索条件の構築
    const where: Prisma.BadgeWhereInput = {};

    if (programId) {
      where.programId = parseInt(programId);
    }

    if (badgeType) {
      where.badgeType = { contains: badgeType, mode: 'insensitive' };
    }

    // バッジ取得
    const [badges, totalCount] = await Promise.all([
      prisma.badge.findMany({
        where,
        include: {
          program: {
            select: {
              id: true,
              title: true,
              company: {
                select: {
                  companyName: true,
                  logoUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              badgeRequests: {
                where: {
                  status: 'APPROVED',
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.badge.count({ where }),
    ]);

    return NextResponse.json({
      badges,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Badges fetch error:', error);
    return NextResponse.json(
      { error: 'バッジの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// バッジ作成
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    
    // 企業または管理者のみがバッジを作成可能
    if (payload.role !== 'COMPANY' && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'バッジの作成権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      programId,
      badgeType,
      title,
      description,
      imageUrl,
      criteria,
    } = body;

    // バリデーション
    if (!programId || !badgeType || !title) {
      return NextResponse.json(
        { error: 'プログラムID、バッジタイプ、タイトルは必須です' },
        { status: 400 }
      );
    }

    // プログラムの存在確認と権限チェック
    const program = await prisma.program.findUnique({
      where: { id: parseInt(programId) },
      include: {
        company: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'プログラムが見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック（プログラム所有者または管理者のみ）
    if (payload.role === 'COMPANY' && program.company.userId !== payload.id) {
      return NextResponse.json(
        { error: 'このプログラムのバッジを作成する権限がありません' },
        { status: 403 }
      );
    }

    // バッジ作成
    const badge = await prisma.badge.create({
      data: {
        programId: parseInt(programId),
        badgeType,
        title,
        description,
        imageUrl,
        criteria,
      },
      include: {
        program: {
          select: {
            title: true,
            company: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: 'バッジが作成されました',
      badge,
    }, { status: 201 });

  } catch (error) {
    console.error('Badge creation error:', error);
    return NextResponse.json(
      { error: 'バッジの作成に失敗しました' },
      { status: 500 }
    );
  }
} 