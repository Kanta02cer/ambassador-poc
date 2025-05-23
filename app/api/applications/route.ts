import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../../src/lib/auth';
import { Prisma } from '../../../src/generated/prisma';
import { sendApplicationNotificationEmail } from '../../../src/lib/email';
import { notificationManager } from '../../../src/lib/websocket-server';

// 応募一覧取得
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    console.log('Auth header:', authHeader);
    console.log('Extracted token:', token);
    
    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    console.log('Token payload:', payload);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const programId = searchParams.get('programId');
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {};

    // ロール別フィルタリング
    if (payload.role === 'STUDENT') {
      where.studentId = payload.id;
    } else if (payload.role === 'COMPANY') {
      // 企業の場合、自社のプログラムの応募のみ取得
      const companyProfile = await prisma.companyProfile.findUnique({
        where: { userId: payload.id },
      });
      
      if (!companyProfile) {
        return NextResponse.json(
          { error: '企業プロフィールが見つかりません' },
          { status: 404 }
        );
      }

      where.program = {
        companyId: companyProfile.id,
      };
    } else if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'アクセス権限がありません' },
        { status: 403 }
      );
    }

    // 追加フィルタリング
    if (status) {
      where.status = status as Prisma.EnumApplicationStatusFilter;
    }

    if (programId) {
      where.programId = parseInt(programId);
    }

    // 応募データ取得
    const [applications, totalCount] = await Promise.all([
      prisma.application.findMany({
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
                  phoneNumber: true,
                  portfolio: true,
                },
              },
            },
          },
          program: {
            select: {
              id: true,
              title: true,
              description: true,
              company: {
                select: {
                  companyName: true,
                  logoUrl: true,
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
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Applications fetch error:', error);
    return NextResponse.json(
      { error: '応募一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 新規応募作成
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    console.log('Auth header:', authHeader);
    console.log('Extracted token:', token);
    
    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    console.log('Token payload:', payload);
    
    // 学生のみが応募可能
    if (payload.role !== 'STUDENT') {
      return NextResponse.json(
        { error: '学生のみが応募できます' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      programId,
      motivation,
      experience,
      portfolioUrl,
      availableStartDate,
    } = body;

    // バリデーション
    if (!programId || !motivation) {
      return NextResponse.json(
        { error: 'プログラムIDと志望動機は必須です' },
        { status: 400 }
      );
    }

    // プログラムの存在確認
    const program = await prisma.program.findUnique({
      where: { id: parseInt(programId) },
      include: {
        company: {
          select: {
            companyName: true,
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

    if (!program.isPublic || program.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'このプログラムは現在応募を受け付けていません' },
        { status: 400 }
      );
    }

    // 応募期限チェック
    if (program.applicationEndDate && new Date() > program.applicationEndDate) {
      return NextResponse.json(
        { error: '応募期限が過ぎています' },
        { status: 400 }
      );
    }

    // 重複応募チェック
    const existingApplication = await prisma.application.findUnique({
      where: {
        studentId_programId: {
          studentId: payload.id,
          programId: parseInt(programId),
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'このプログラムには既に応募済みです' },
        { status: 409 }
      );
    }

    // 定員チェック
    if (program.maxParticipants) {
      const acceptedCount = await prisma.application.count({
        where: {
          programId: parseInt(programId),
          status: 'ACCEPTED',
        },
      });

      if (acceptedCount >= program.maxParticipants) {
        return NextResponse.json(
          { error: 'このプログラムは定員に達しています' },
          { status: 400 }
        );
      }
    }

    // 応募作成
    const application = await prisma.application.create({
      data: {
        studentId: payload.id,
        programId: parseInt(programId),
        motivation,
        experience,
        portfolioUrl,
        availableStartDate: availableStartDate ? new Date(availableStartDate) : null,
        status: 'PENDING',
      },
    });

    // 学生情報を取得
    const student = await prisma.user.findUnique({
      where: { id: application.studentId },
      include: { studentProfile: true }
    });
    
    // 企業ユーザー情報を取得
    const companyUser = await prisma.user.findUnique({
      where: { id: program.company.userId },
    });

    if (student && companyUser) {
      const studentName = `${student.studentProfile?.firstName || ''} ${student.studentProfile?.lastName || ''}`.trim() || '学生';
      
      // メール通知を送信（エラーが発生してもアプリケーション作成は継続）
      try {
        await sendApplicationNotificationEmail(
          companyUser.email,
          studentName,
          program.title,
          application.id
        );
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }

      // 🔔 リアルタイム通知を送信
      try {
        // 企業への通知
        notificationManager.sendUserNotification(
          companyUser.id,
          'APPLICATION_SUBMITTED',
          '新しい応募があります',
          `${studentName}さんから「${program.title}」プログラムに応募がありました`,
          'high',
          {
            applicationId: application.id,
            programId: program.id,
            studentName,
            url: `/company/applications/${application.id}`
          }
        );

        // 学生への確認通知
        notificationManager.sendUserNotification(
          student.id,
          'APPLICATION_SUBMITTED',
          '応募を受け付けました',
          `「${program.title}」への応募が正常に提出されました`,
          'medium',
          {
            applicationId: application.id,
            programId: program.id,
            url: `/student/applications/${application.id}`
          }
        );

        console.log('📤 Real-time notifications sent for application:', application.id);
      } catch (notificationError) {
        console.error('Failed to send real-time notifications:', notificationError);
      }
    }

    return NextResponse.json({
      message: '応募が完了しました',
      application,
    }, { status: 201 });

  } catch (error) {
    console.error('Application creation error:', error);
    
    // 開発環境では詳細なエラーメッセージを返す
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: '応募の作成に失敗しました',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: '応募の作成に失敗しました' },
      { status: 500 }
    );
  }
} 