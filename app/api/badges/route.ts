import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../../src/lib/auth';

// バッジ一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const programId = searchParams.get('programId');
    const badgeType = searchParams.get('badgeType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // フィルター条件を構築
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (programId) {
      where.programId = parseInt(programId);
    }

    if (badgeType) {
      where.badgeType = { contains: badgeType };
    }

    // バッジ一覧を取得
    const [badges, total] = await Promise.all([
      prisma.badge.findMany({
        where,
        include: {
          program: {
            include: {
              company: true,
            },
          },
          badgeRequests: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.badge.count({ where }),
    ]);

    return NextResponse.json({
      badges,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('バッジ取得エラー:', error);
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