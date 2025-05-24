import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { verifyToken } from '../../../../src/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'アクセストークンが必要です' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const applications = await prisma.application.findMany({
      where: { studentId: payload.id },
      include: {
        program: {
          include: {
            company: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedApplications = applications.map(app => ({
      id: app.id,
      status: app.status,
      appliedAt: app.createdAt.toISOString(),
      notes: app.motivation,
      program: {
        id: app.program.id,
        title: app.program.title,
        type: app.program.status,
        applicationDeadline: app.program.applicationEndDate?.toISOString(),
        company: {
          name: app.program.company.companyName || '企業名未設定',
          logo: app.program.company.logoUrl
        }
      }
    }));

    return NextResponse.json(formattedApplications);
  } catch (error) {
    console.error('Applications fetch error:', error);
    return NextResponse.json({ error: '応募情報の取得に失敗しました' }, { status: 500 });
  }
} 