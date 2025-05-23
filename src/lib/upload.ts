import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// アップロード設定
interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  uploadDir: string;
}

// ファイル情報の型定義
interface FileInfo {
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  publicUrl: string;
}

// 許可されたファイルタイプ
const FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  all: [] as string[],
};

// 全てのファイルタイプを結合
FILE_TYPES.all = [...FILE_TYPES.images, ...FILE_TYPES.documents];

// デフォルト設定
const DEFAULT_CONFIG: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: FILE_TYPES.all,
  uploadDir: 'public/uploads',
};

// ユニークなファイル名を生成
const generateFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `${timestamp}_${randomString}${ext}`;
};

// ディレクトリが存在しない場合は作成
const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// ファイルのMIMEタイプを検証
const validateFileType = (file: Express.Multer.File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.mimetype);
};

// ファイルサイズを検証
const validateFileSize = (file: Express.Multer.File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

// ファイル名をサニタイズ
const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

// ファイルアップロード処理
export const uploadFile = async (
  file: Express.Multer.File,
  category: 'images' | 'documents' | 'all' = 'all',
  customConfig?: Partial<UploadConfig>
): Promise<FileInfo> => {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  
  // カテゴリに応じて許可されたファイルタイプを設定
  if (category === 'images') {
    config.allowedTypes = FILE_TYPES.images;
  } else if (category === 'documents') {
    config.allowedTypes = FILE_TYPES.documents;
  }

  // ファイルタイプ検証
  if (!validateFileType(file, config.allowedTypes)) {
    throw new Error(`許可されていないファイルタイプです。許可されているタイプ: ${config.allowedTypes.join(', ')}`);
  }

  // ファイルサイズ検証
  if (!validateFileSize(file, config.maxFileSize)) {
    throw new Error(`ファイルサイズが大きすぎます。最大サイズ: ${Math.round(config.maxFileSize / 1024 / 1024)}MB`);
  }

  // ディレクトリ作成
  const uploadDir = path.join(process.cwd(), config.uploadDir, category);
  await ensureDirectoryExists(uploadDir);

  // ユニークなファイル名を生成
  const sanitizedOriginalName = sanitizeFileName(file.originalname);
  const fileName = generateFileName(sanitizedOriginalName);
  const filePath = path.join(uploadDir, fileName);

  // ファイルを保存
  await fs.writeFile(filePath, file.buffer);

  // パブリックURLを生成
  const publicUrl = `/uploads/${category}/${fileName}`;

  return {
    originalName: file.originalname,
    fileName,
    filePath,
    fileSize: file.size,
    mimeType: file.mimetype,
    publicUrl,
  };
};

// 複数ファイルのアップロード処理
export const uploadMultipleFiles = async (
  files: Express.Multer.File[],
  category: 'images' | 'documents' | 'all' = 'all',
  customConfig?: Partial<UploadConfig>
): Promise<FileInfo[]> => {
  const results: FileInfo[] = [];
  
  for (const file of files) {
    try {
      const fileInfo = await uploadFile(file, category, customConfig);
      results.push(fileInfo);
    } catch (error) {
      console.error(`Failed to upload file ${file.originalname}:`, error);
      throw error;
    }
  }
  
  return results;
};

// ファイル削除
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
};

// プロフィール画像アップロード専用
export const uploadProfileImage = async (file: Express.Multer.File): Promise<FileInfo> => {
  return uploadFile(file, 'images', {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: FILE_TYPES.images,
  });
};

// ポートフォリオファイルアップロード専用
export const uploadPortfolioFile = async (file: Express.Multer.File): Promise<FileInfo> => {
  return uploadFile(file, 'documents', {
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [...FILE_TYPES.documents, ...FILE_TYPES.images],
  });
};

// バッジ画像アップロード専用
export const uploadBadgeImage = async (file: Express.Multer.File): Promise<FileInfo> => {
  return uploadFile(file, 'images', {
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: FILE_TYPES.images,
  });
};

// ロゴ画像アップロード専用
export const uploadLogoImage = async (file: Express.Multer.File): Promise<FileInfo> => {
  return uploadFile(file, 'images', {
    maxFileSize: 3 * 1024 * 1024, // 3MB
    allowedTypes: FILE_TYPES.images,
  });
}; 