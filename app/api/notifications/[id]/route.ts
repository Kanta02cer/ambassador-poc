import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { verifyToken } from '../../../../src/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'アクセストークンが必要です' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const notificationId = params.id;
    
    // 実際のDBから通知を取得する場合の実装
    // const notification = await prisma.notification.findUnique({
    //   where: { id: notificationId, userId: payload.id }
    // });

    // 開発用のモック通知データ
    const mockNotificationDetails = {
      id: notificationId,
      type: 'APPLICATION_STATUS_CHANGED',
      userId: payload.id,
      title: '応募状況が更新されました',
      message: 'あなたの応募した「サマーインターンシップ2024」の選考が進んでいます。',
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'high' as const,
      data: {
        programId: 1,
        programTitle: 'サマーインターンシップ2024',
        companyName: 'テック株式会社',
        previousStatus: 'PENDING',
        newStatus: 'INTERVIEW_SCHEDULED',
        interviewDate: '2024-02-15T10:00:00Z',
        interviewLocation: 'オンライン（Zoom）',
        nextSteps: [
          '面接の準備をしてください',
          '履歴書とポートフォリオをご用意ください',
          '面接の詳細は別途メールでお送りします'
        ],
        relatedLinks: [
          { title: 'プログラム詳細', url: `/programs/1` },
          { title: '応募管理', url: '/student/applications' },
          { title: '企業情報', url: '/companies/1' }
        ]
      },
      // 詳細情報
      details: {
        category: '応募状況',
        severity: 'important',
        actionRequired: true,
        expiryDate: '2024-02-20T23:59:59Z',
        tags: ['面接', '応募', 'インターンシップ'],
        source: 'application_system',
        metadata: {
          applicationId: 123,
          companyId: 1,
          programId: 1
        }
      }
    };

    // 通知を既読にマーク（実際のDBの場合）
    // await prisma.notification.update({
    //   where: { id: notificationId },
    //   data: { isRead: true }
    // });

    return NextResponse.json(mockNotificationDetails);
  } catch (error) {
    console.error('Notification detail fetch error:', error);
    return NextResponse.json({ error: '通知の詳細取得に失敗しました' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'アクセストークンが必要です' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const { isRead, isArchived } = body;
    const notificationId = params.id;

    // 実際のDBで通知を更新する場合の実装
    // const updatedNotification = await prisma.notification.update({
    //   where: { id: notificationId, userId: payload.id },
    //   data: {
    //     isRead: isRead,
    //     isArchived: isArchived,
    //     updatedAt: new Date()
    //   }
    // });

    // モック応答
    const mockUpdatedNotification = {
      id: notificationId,
      isRead: isRead ?? false,
      isArchived: isArchived ?? false,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(mockUpdatedNotification);
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json({ error: '通知の更新に失敗しました' }, { status: 500 });
  }
} 