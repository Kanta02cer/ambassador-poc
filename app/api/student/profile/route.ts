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

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        studentProfile: true
      }
    });

    if (!user || !user.studentProfile) {
      return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 });
    }

    const profile = {
      id: user.id,
      email: user.email,
      firstName: user.studentProfile.firstName,
      lastName: user.studentProfile.lastName,
      phoneNumber: user.studentProfile.phoneNumber,
      university: user.studentProfile.university,
      major: user.studentProfile.major,
      graduationYear: user.studentProfile.graduationYear,
      gpa: user.studentProfile.gpa,
      bio: user.studentProfile.bio,
      skills: user.studentProfile.skills,
      portfolio: user.studentProfile.portfolio,
      linkedinUrl: user.studentProfile.linkedinUrl
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'アクセストークンが必要です' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phoneNumber,
      university,
      major,
      graduationYear,
      gpa,
      bio,
      skills,
      portfolio,
      linkedinUrl
    } = body;

    const updatedProfile = await prisma.studentProfile.update({
      where: { userId: payload.id },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber: phoneNumber || undefined,
        university: university || undefined,
        major: major || undefined,
        graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
        gpa: gpa ? parseFloat(gpa) : undefined,
        bio: bio || undefined,
        skills: skills || undefined,
        portfolio: portfolio || undefined,
        linkedinUrl: linkedinUrl || undefined
      }
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 });
  }
} 