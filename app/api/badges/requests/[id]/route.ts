import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../../../../src/lib/auth';
import { sendBadgeRequestStatusEmail } from '../../../../../src/lib/email';
import { Prisma } from '../../../../../src/generated/prisma';

// バッジ申請詳細取得
export async function GET(
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
    const requestId = parseInt(id);
    
    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: '無効な申請IDです' },
        { status: 400 }
      );
    }

    // バッジ申請詳細取得
    const badgeRequest = await prisma.badgeRequest.findUnique({
      where: { id: requestId },
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
                phoneNumber: true,
                portfolio: true,
                skills: true,
                linkedinUrl: true,
                bio: true,
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
                description: true,
                company: {
                  select: {
                    id: true,
                    userId: true,
                    companyName: true,
                    logoUrl: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!badgeRequest) {
      return NextResponse.json(
        { error: 'バッジ申請が見つかりません' },
        { status: 404 }
      );
    }

    // アクセス権限チェック
    const canAccess = 
      payload.role === 'ADMIN' ||
      (payload.role === 'STUDENT' && badgeRequest.studentId === payload.id) ||
      (payload.role === 'COMPANY' && badgeRequest.badge.program.company.userId === payload.id);

    if (!canAccess) {
      return NextResponse.json(
        { error: 'この申請にアクセスする権限がありません' },
        { status: 403 }
      );
    }

    return NextResponse.json({ badgeRequest });

  } catch (error) {
    console.error('Badge request fetch error:', error);
    return NextResponse.json(
      { error: 'バッジ申請の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// バッジ申請承認・却下
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
    const requestId = parseInt(id);
    
    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: '無効な申請IDです' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, reviewComment, rejectionReason } = body;

    // バリデーション
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: '有効なステータス（APPROVED または REJECTED）を指定してください' },
        { status: 400 }
      );
    }

    if (status === 'REJECTED' && !rejectionReason) {
      return NextResponse.json(
        { error: '却下理由は必須です' },
        { status: 400 }
      );
    }

    // バッジ申請の存在確認
    const existingRequest = await prisma.badgeRequest.findUnique({
      where: { id: requestId },
      include: {
        badge: {
          select: {
            program: {
              select: {
                company: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'バッジ申請が見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック（管理者または関連企業のみ）
    const canReview = 
      payload.role === 'ADMIN' ||
      (payload.role === 'COMPANY' && existingRequest.badge.program.company.userId === payload.id);

    if (!canReview) {
      return NextResponse.json(
        { error: 'この申請を審査する権限がありません' },
        { status: 403 }
      );
    }

    // 既に処理済みの申請はスキップ
    if (existingRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'この申請は既に処理済みです' },
        { status: 400 }
      );
    }

    // 申請更新データの準備
    const now = new Date();
    const updateData: Prisma.BadgeRequestUpdateInput = {
      status,
      reviewComment,
    };

    if (status === 'APPROVED') {
      updateData.approvedBy = payload.id;
      updateData.approvedAt = now;
    } else if (status === 'REJECTED') {
      updateData.rejectedBy = payload.id;
      updateData.rejectedAt = now;
      updateData.rejectionReason = rejectionReason;
    }

    // バッジ申請更新
    const updatedRequest = await prisma.badgeRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
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
                  },
                },
              },
            },
          },
        },
      },
    });

    // メール通知を送信
    try {
      const studentName = `${updatedRequest.student.studentProfile?.firstName} ${updatedRequest.student.studentProfile?.lastName}`;
      await sendBadgeRequestStatusEmail(
        updatedRequest.student.email,
        studentName,
        updatedRequest.badge.title,
        updatedRequest.badge.program.title,
        status,
        rejectionReason
      );
    } catch (emailError) {
      console.error('Failed to send badge request status email:', emailError);
    }

    const message = status === 'APPROVED' ? 'バッジ申請が承認されました' : 'バッジ申請が却下されました';

    return NextResponse.json({
      message,
      badgeRequest: updatedRequest,
    });

  } catch (error) {
    console.error('Badge request update error:', error);
    return NextResponse.json(
      { error: 'バッジ申請の処理に失敗しました' },
      { status: 500 }
    );
  }
}

// バッジ申請削除（管理者のみ）
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
    
    // 管理者のみが削除可能
    if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '管理者のみがバッジ申請を削除できます' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const requestId = parseInt(id);
    
    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: '無効な申請IDです' },
        { status: 400 }
      );
    }

    // バッジ申請の存在確認
    const existingRequest = await prisma.badgeRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'バッジ申請が見つかりません' },
        { status: 404 }
      );
    }

    // バッジ申請削除
    await prisma.badgeRequest.delete({
      where: { id: requestId },
    });

    return NextResponse.json({
      message: 'バッジ申請が削除されました',
    });

  } catch (error) {
    console.error('Badge request deletion error:', error);
    return NextResponse.json(
      { error: 'バッジ申請の削除に失敗しました' },
      { status: 500 }
    );
  }
} 