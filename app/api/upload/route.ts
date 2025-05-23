import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '../../../src/lib/auth';
import { uploadFile, uploadProfileImage, uploadPortfolioFile, uploadBadgeImage, uploadLogoImage } from '../../../src/lib/upload';

// ファイルアップロード
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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string; // 'profile', 'portfolio', 'badge', 'logo', 'general'

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // Fileオブジェクトをmulterの形式に変換
    const buffer = Buffer.from(await file.arrayBuffer());
    const multerFile = {
      originalname: file.name,
      mimetype: file.type,
      size: file.size,
      buffer: buffer,
    } as Express.Multer.File;

    let fileInfo;

    // アップロードタイプに応じて処理を分岐
    switch (uploadType) {
      case 'profile':
        fileInfo = await uploadProfileImage(multerFile);
        break;
      case 'portfolio':
        // 学生のみポートフォリオをアップロード可能
        if (payload.role !== 'STUDENT') {
          return NextResponse.json(
            { error: 'ポートフォリオは学生のみアップロードできます' },
            { status: 403 }
          );
        }
        fileInfo = await uploadPortfolioFile(multerFile);
        break;
      case 'badge':
        // 企業と管理者のみバッジ画像をアップロード可能
        if (payload.role !== 'COMPANY' && payload.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'バッジ画像の作成権限がありません' },
            { status: 403 }
          );
        }
        fileInfo = await uploadBadgeImage(multerFile);
        break;
      case 'logo':
        // 企業のみロゴをアップロード可能
        if (payload.role !== 'COMPANY') {
          return NextResponse.json(
            { error: 'ロゴは企業のみアップロードできます' },
            { status: 403 }
          );
        }
        fileInfo = await uploadLogoImage(multerFile);
        break;
      case 'general':
      default:
        fileInfo = await uploadFile(multerFile);
        break;
    }

    return NextResponse.json({
      message: 'ファイルのアップロードが完了しました',
      file: fileInfo,
    }, { status: 201 });

  } catch (error) {
    console.error('File upload error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    );
  }
} 