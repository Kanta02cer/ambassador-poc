import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../../src/lib/auth';
import { Prisma } from '../../../src/generated/prisma';

// プログラム一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    // 検索条件の構築
    const where: Prisma.ProgramWhereInput = {
      isPublic: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (companyId) {
      where.companyId = parseInt(companyId);
    }

    if (status) {
      where.status = status as Prisma.EnumProgramStatusFilter;
    }

    // プログラム取得
    const [programs, totalCount] = await Promise.all([
      prisma.program.findMany({
        where,
        include: {
          company: {
            select: {
              companyName: true,
              logoUrl: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.program.count({ where }),
    ]);

    return NextResponse.json({
      programs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Programs fetch error:', error);
    return NextResponse.json(
      { error: 'プログラムの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// プログラム作成
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
    
    // 企業ユーザーのみがプログラムを作成可能
    if (payload.role !== 'COMPANY') {
      return NextResponse.json(
        { error: 'プログラムの作成権限がありません' },
        { status: 403 }
      );
    }

    // 企業プロフィールの取得
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { companyProfile: true },
    });

    if (!user?.companyProfile) {
      return NextResponse.json(
        { error: '企業プロフィールが見つかりません' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      requirements,
      responsibilities,
      benefits,
      applicationStartDate,
      applicationEndDate,
      startDate,
      endDate,
      maxParticipants,
      tags,
      status = 'DRAFT',
    } = body;

    // バリデーション
    if (!title || !description) {
      return NextResponse.json(
        { error: 'タイトルと説明は必須です' },
        { status: 400 }
      );
    }

    // プログラム作成
    const program = await prisma.program.create({
      data: {
        title,
        description,
        requirements,
        responsibilities,
        benefits,
        applicationStartDate: applicationStartDate ? new Date(applicationStartDate) : null,
        applicationEndDate: applicationEndDate ? new Date(applicationEndDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        maxParticipants,
        tags: JSON.stringify(tags || []),
        status,
        companyId: user.companyProfile.id,
      },
      include: {
        company: {
          select: {
            companyName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'プログラムが作成されました',
      program,
    }, { status: 201 });

  } catch (error) {
    console.error('Program creation error:', error);
    return NextResponse.json(
      { error: 'プログラムの作成に失敗しました' },
      { status: 500 }
    );
  }
} 