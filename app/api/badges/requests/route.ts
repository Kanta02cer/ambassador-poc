import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../../../src/lib/auth';
import { Prisma } from '../../../../src/generated/prisma';
import { sendBadgeRequestNotificationEmail } from '../../../../src/lib/email';

// バッジ申請一覧取得
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const badgeId = searchParams.get('badgeId');
    const skip = (page - 1) * limit;

    const where: Prisma.BadgeRequestWhereInput = {};

    // ロール別フィルタリング
    if (payload.role === 'STUDENT') {
      where.studentId = payload.id;
    } else if (payload.role === 'COMPANY') {
      // 企業の場合、自社プログラムのバッジ申請のみ取得
      const companyProfile = await prisma.companyProfile.findUnique({
        where: { userId: payload.id },
      });
      
      if (!companyProfile) {
        return NextResponse.json(
          { error: '企業プロフィールが見つかりません' },
          { status: 404 }
        );
      }

      where.badge = {
        program: {
          companyId: companyProfile.id,
        },
      };
    } else if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'アクセス権限がありません' },
        { status: 403 }
      );
    }

    // 追加フィルタリング
    if (status) {
      where.status = status as Prisma.EnumBadgeRequestStatusFilter;
    }

    if (badgeId) {
      where.badgeId = parseInt(badgeId);
    }

    // バッジ申請データ取得
    const [badgeRequests, totalCount] = await Promise.all([
      prisma.badgeRequest.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              email: true,
              studentProfile: {
                select: {
                  firstName: true,
                  lastName: true,
                  university: true,
                  portfolio: true,
                },
              },
            },
          },
          badge: {
            select: {
              id: true,
              title: true,
              badgeType: true,
              description: true,
              imageUrl: true,
              criteria: true,
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
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.badgeRequest.count({ where }),
    ]);

    return NextResponse.json({
      badgeRequests,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Badge requests fetch error:', error);
    return NextResponse.json(
      { error: 'バッジ申請一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// バッジ申請作成
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
    
    // 学生のみがバッジ申請可能
    if (payload.role !== 'STUDENT') {
      return NextResponse.json(
        { error: '学生のみがバッジを申請できます' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      badgeId,
      achievements,
      evidence,
      selfEvaluation,
    } = body;

    // バリデーション
    if (!badgeId || !achievements) {
      return NextResponse.json(
        { error: 'バッジIDと成果・実績は必須です' },
        { status: 400 }
      );
    }

    // バッジの存在確認
    const badge = await prisma.badge.findUnique({
      where: { id: parseInt(badgeId) },
      include: {
        program: {
          select: {
            id: true,
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

    if (!badge) {
      return NextResponse.json(
        { error: 'バッジが見つかりません' },
        { status: 404 }
      );
    }

    // 重複申請チェック
    const existingRequest = await prisma.badgeRequest.findUnique({
      where: {
        studentId_badgeId: {
          studentId: payload.id,
          badgeId: parseInt(badgeId),
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'このバッジには既に申請済みです' },
        { status: 409 }
      );
    }

    // 関連する応募の確認（そのプログラムに応募していることが前提）
    const application = await prisma.application.findFirst({
      where: {
        studentId: payload.id,
        programId: badge.program.id,
        status: {
          in: ['ACCEPTED'],
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'このプログラムに参加していないため、バッジを申請できません' },
        { status: 400 }
      );
    }

    // バッジ申請作成
    const badgeRequest = await prisma.badgeRequest.create({
      data: {
        studentId: payload.id,
        badgeId: parseInt(badgeId),
        achievements,
        evidence,
        selfEvaluation,
        status: 'PENDING',
      },
      include: {
        badge: {
          select: {
            title: true,
            badgeType: true,
            program: {
              select: {
                title: true,
                company: {
                  select: {
                    companyName: true,
                    user: {
                      select: {
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        student: {
          select: {
            email: true,
            studentProfile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // メール通知を送信（企業と管理者に）
    try {
      const studentName = `${badgeRequest.student.studentProfile?.firstName} ${badgeRequest.student.studentProfile?.lastName}`;
      
      // 企業に通知
      await sendBadgeRequestNotificationEmail(
        badgeRequest.badge.program.company.user.email,
        studentName,
        badgeRequest.badge.title,
        badgeRequest.badge.program.title,
        badgeRequest.id
      );

      // 管理者に通知（環境変数で管理者メールアドレスが設定されている場合）
      if (process.env.ADMIN_EMAIL) {
        await sendBadgeRequestNotificationEmail(
          process.env.ADMIN_EMAIL,
          studentName,
          badgeRequest.badge.title,
          badgeRequest.badge.program.title,
          badgeRequest.id
        );
      }
    } catch (emailError) {
      console.error('Failed to send badge request notification email:', emailError);
    }

    return NextResponse.json({
      message: 'バッジ申請が完了しました',
      badgeRequest,
    }, { status: 201 });

  } catch (error) {
    console.error('Badge request creation error:', error);
    return NextResponse.json(
      { error: 'バッジ申請の作成に失敗しました' },
      { status: 500 }
    );
  }
} 