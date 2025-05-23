import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../../../src/lib/auth';

// プログラム詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const programId = parseInt(id);
    
    if (isNaN(programId)) {
      return NextResponse.json(
        { error: '無効なプログラムIDです' },
        { status: 400 }
      );
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        company: {
          select: {
            companyName: true,
            logoUrl: true,
            description: true,
            website: true,
          },
        },
        applications: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            student: {
              select: {
                id: true,
                email: true,
                studentProfile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    university: true,
                  },
                },
              },
            },
          },
        },
        badges: {
          select: {
            id: true,
            title: true,
            description: true,
            badgeType: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            applications: true,
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

    return NextResponse.json({ program });

  } catch (error) {
    console.error('Program fetch error:', error);
    return NextResponse.json(
      { error: 'プログラムの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// プログラム更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const programId = parseInt(id);
    
    if (isNaN(programId)) {
      return NextResponse.json(
        { error: '無効なプログラムIDです' },
        { status: 400 }
      );
    }

    // プログラムの存在確認と権限チェック
    const existingProgram = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        company: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingProgram) {
      return NextResponse.json(
        { error: 'プログラムが見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック（プログラム作成者または管理者のみ）
    if (payload.role !== 'ADMIN' && existingProgram.company.userId !== payload.id) {
      return NextResponse.json(
        { error: 'プログラムの更新権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      requirements,
      responsibilities,
      benefits,
      duration,
      location,
      applicationStartDate,
      applicationEndDate,
      programStartDate,
      programEndDate,
      maxParticipants,
      tags,
      status,
      isPublic,
    } = body;

    // プログラム更新
    const updatedProgram = await prisma.program.update({
      where: { id: programId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(requirements !== undefined && { requirements }),
        ...(responsibilities !== undefined && { responsibilities }),
        ...(benefits !== undefined && { benefits }),
        ...(duration !== undefined && { duration }),
        ...(location !== undefined && { location }),
        ...(applicationStartDate !== undefined && {
          applicationStartDate: applicationStartDate ? new Date(applicationStartDate) : null,
        }),
        ...(applicationEndDate !== undefined && {
          applicationEndDate: applicationEndDate ? new Date(applicationEndDate) : null,
        }),
        ...(programStartDate !== undefined && {
          programStartDate: programStartDate ? new Date(programStartDate) : null,
        }),
        ...(programEndDate !== undefined && {
          programEndDate: programEndDate ? new Date(programEndDate) : null,
        }),
        ...(maxParticipants !== undefined && { maxParticipants }),
        ...(tags !== undefined && { tags }),
        ...(status && { status }),
        ...(isPublic !== undefined && { isPublic }),
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
      message: 'プログラムが更新されました',
      program: updatedProgram,
    });

  } catch (error) {
    console.error('Program update error:', error);
    return NextResponse.json(
      { error: 'プログラムの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// プログラム削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const programId = parseInt(id);
    
    if (isNaN(programId)) {
      return NextResponse.json(
        { error: '無効なプログラムIDです' },
        { status: 400 }
      );
    }

    // プログラムの存在確認と権限チェック
    const existingProgram = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        company: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!existingProgram) {
      return NextResponse.json(
        { error: 'プログラムが見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック（プログラム作成者または管理者のみ）
    if (payload.role !== 'ADMIN' && existingProgram.company.userId !== payload.id) {
      return NextResponse.json(
        { error: 'プログラムの削除権限がありません' },
        { status: 403 }
      );
    }

    // 応募者がいる場合は削除を制限
    if (existingProgram._count.applications > 0) {
      return NextResponse.json(
        { error: '応募者がいるプログラムは削除できません' },
        { status: 400 }
      );
    }

    // プログラム削除
    await prisma.program.delete({
      where: { id: programId },
    });

    return NextResponse.json({
      message: 'プログラムが削除されました',
    });

  } catch (error) {
    console.error('Program deletion error:', error);
    return NextResponse.json(
      { error: 'プログラムの削除に失敗しました' },
      { status: 500 }
    );
  }
} 