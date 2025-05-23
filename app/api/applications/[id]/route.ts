import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../../../src/lib/auth';
import { sendApplicationStatusEmail } from '../../../../src/lib/email';
import { Prisma } from '../../../../src/generated/prisma';

// 応募詳細取得
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
    const applicationId = parseInt(id);
    
    if (isNaN(applicationId)) {
      return NextResponse.json(
        { error: '無効な応募IDです' },
        { status: 400 }
      );
    }

    // 応募詳細取得
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
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
        program: {
          select: {
            id: true,
            title: true,
            description: true,
            requirements: true,
            responsibilities: true,
            benefits: true,
            company: {
              select: {
                id: true,
                userId: true,
                companyName: true,
                logoUrl: true,
                description: true,
                website: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: '応募が見つかりません' },
        { status: 404 }
      );
    }

    // アクセス権限チェック
    const canAccess = 
      payload.role === 'ADMIN' ||
      (payload.role === 'STUDENT' && application.studentId === payload.id) ||
      (payload.role === 'COMPANY' && application.program.company.userId === payload.id);

    if (!canAccess) {
      return NextResponse.json(
        { error: 'この応募にアクセスする権限がありません' },
        { status: 403 }
      );
    }

    return NextResponse.json({ application });

  } catch (error) {
    console.error('Application fetch error:', error);
    return NextResponse.json(
      { error: '応募の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 応募ステータス更新
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
    const applicationId = parseInt(id);
    
    if (isNaN(applicationId)) {
      return NextResponse.json(
        { error: '無効な応募IDです' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      status,
      rejectionReason,
      interviewDate,
      notes,
    } = body;

    // 応募の存在確認
    const existingApplication = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
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
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: '応募が見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック
    if (payload.role === 'STUDENT') {
      // 学生は辞退のみ可能
      if (status !== 'WITHDRAWN_BY_STUDENT') {
        return NextResponse.json(
          { error: '学生は辞退のみ可能です' },
          { status: 403 }
        );
      }
      
      if (existingApplication.studentId !== payload.id) {
        return NextResponse.json(
          { error: 'この応募を更新する権限がありません' },
          { status: 403 }
        );
      }
    } else if (payload.role === 'COMPANY') {
      // 企業は自社プログラムの応募のみ更新可能
      if (existingApplication.program.company.userId !== payload.id) {
        return NextResponse.json(
          { error: 'この応募を更新する権限がありません' },
          { status: 403 }
        );
      }
    } else if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'この応募を更新する権限がありません' },
        { status: 403 }
      );
    }

    // ステータス更新データの準備
    const updateData: Prisma.ApplicationUpdateInput = {};
    
    if (status) {
      updateData.status = status;
    }

    if (rejectionReason !== undefined) {
      updateData.rejectionReason = rejectionReason;
    }

    if (interviewDate !== undefined) {
      updateData.interviewDate = interviewDate ? new Date(interviewDate) : null;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // 応募更新
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
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

    // メール通知を送信（選考結果の場合のみ）
    if (status && ['ACCEPTED', 'REJECTED_BY_COMPANY'].includes(status)) {
      try {
        const studentName = `${updatedApplication.student.studentProfile?.firstName} ${updatedApplication.student.studentProfile?.lastName}`;
        await sendApplicationStatusEmail(
          updatedApplication.student.email,
          studentName,
          updatedApplication.program.title,
          updatedApplication.program.company.companyName,
          status,
          rejectionReason
        );
      } catch (emailError) {
        console.error('Failed to send status notification email:', emailError);
      }
    }

    return NextResponse.json({
      message: '応募ステータスが更新されました',
      application: updatedApplication,
    });

  } catch (error) {
    console.error('Application update error:', error);
    return NextResponse.json(
      { error: '応募の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 応募削除（管理者のみ）
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
        { error: '管理者のみが応募を削除できます' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const applicationId = parseInt(id);
    
    if (isNaN(applicationId)) {
      return NextResponse.json(
        { error: '無効な応募IDです' },
        { status: 400 }
      );
    }

    // 応募の存在確認
    const existingApplication = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: '応募が見つかりません' },
        { status: 404 }
      );
    }

    // 応募削除
    await prisma.application.delete({
      where: { id: applicationId },
    });

    return NextResponse.json({
      message: '応募が削除されました',
    });

  } catch (error) {
    console.error('Application deletion error:', error);
    return NextResponse.json(
      { error: '応募の削除に失敗しました' },
      { status: 500 }
    );
  }
} 