# 日本学生アンバサダー協議会 - プラットフォーム

学生と企業を繋ぐアンバサダープログラムプラットフォーム。バッジ認定システムを通じて学生のスキル向上と企業の人材発掘を支援します。

## 🎯 プロジェクト概要

**目標売上**: 月間1億円
**ターゲット**: 大学生・企業・教育機関
**主要機能**: アンバサダープログラム管理、バッジ認定システム、マッチング機能

## 🚀 開発進捗

### ✅ Sprint 1 (完了)
- 認証システム（JWT）
- ランディングページ
- ロール別ダッシュボード（学生・企業・管理者）
- 基本的なUI/UX

### ✅ Sprint 2 (完了)
- PostgreSQL + Prisma ORM実装
- データベース設計・マイグレーション
- プログラム管理API
- 認証システムの実データベース対応

### ✅ Sprint 3 (完了)
- **応募管理システム**
  - 学生による応募機能
  - 企業による選考管理
  - ステータス追跡（応募中・選考中・採用・不採用）
- **バッジ管理システム**
  - バッジ作成・管理（企業・管理者）
  - バッジ申請・承認フロー
  - 実績・証拠提出機能
- **メール通知システム**
  - 応募通知（企業宛）
  - 選考結果通知（学生宛）
  - バッジ申請・結果通知
- **ファイルアップロード機能**
  - プロフィール画像
  - ポートフォリオファイル
  - バッジ画像・企業ロゴ

### 🔄 Sprint 4 (予定)
- フロントエンド実装（React/Next.js）
- リアルタイム通知
- 検索・フィルタリング機能
- 分析ダッシュボード

## 🛠 技術スタック

### Backend
- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Email**: Nodemailer
- **File Upload**: Multer
- **Language**: TypeScript

### Frontend
- **Framework**: Next.js 15 + React 18
- **Styling**: Tailwind CSS
- **State Management**: React Context/Hooks
- **UI Components**: Custom components

### Infrastructure
- **Deployment**: Vercel (予定)
- **Database**: PostgreSQL (Supabase/Railway予定)
- **File Storage**: Local storage (AWS S3予定)
- **Email Service**: SMTP (SendGrid予定)

## 📊 データベース設計

### 主要テーブル
- **User**: ユーザー基本情報
- **StudentProfile**: 学生プロフィール
- **CompanyProfile**: 企業プロフィール
- **AdminProfile**: 管理者プロフィール
- **Program**: アンバサダープログラム
- **Application**: 応募情報
- **Badge**: バッジ情報
- **BadgeRequest**: バッジ申請

### リレーション
- User → Profile (1:1)
- Company → Program (1:N)
- Student → Application (1:N)
- Program → Application (1:N)
- Program → Badge (1:N)
- Student → BadgeRequest (1:N)
- Badge → BadgeRequest (1:N)

## 🔧 セットアップ

### 前提条件
- Node.js 18+
- PostgreSQL
- npm/yarn

### インストール
```bash
# リポジトリクローン
git clone <repository-url>
cd ambassador-poc

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .envファイルを編集

# データベースセットアップ
npx prisma generate
npx prisma db push

# 開発サーバー起動
npm run dev
```

### 環境変数
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ambassador_db"

# JWT
JWT_SECRET="your-jwt-secret-key"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Application
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@example.com"
```

## 📡 API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン

### プログラム管理
- `GET /api/programs` - プログラム一覧
- `POST /api/programs` - プログラム作成
- `GET /api/programs/[id]` - プログラム詳細
- `PUT /api/programs/[id]` - プログラム更新
- `DELETE /api/programs/[id]` - プログラム削除

### 応募管理
- `GET /api/applications` - 応募一覧
- `POST /api/applications` - 応募作成
- `GET /api/applications/[id]` - 応募詳細
- `PUT /api/applications/[id]` - 応募ステータス更新
- `DELETE /api/applications/[id]` - 応募削除（管理者のみ）

### バッジ管理
- `GET /api/badges` - バッジ一覧
- `POST /api/badges` - バッジ作成
- `GET /api/badges/requests` - バッジ申請一覧
- `POST /api/badges/requests` - バッジ申請作成
- `GET /api/badges/requests/[id]` - バッジ申請詳細
- `PUT /api/badges/requests/[id]` - バッジ申請承認・却下
- `DELETE /api/badges/requests/[id]` - バッジ申請削除

### ファイルアップロード
- `POST /api/upload` - ファイルアップロード

## 🔐 認証・認可

### ロール
- **STUDENT**: 学生ユーザー
- **COMPANY**: 企業ユーザー
- **ADMIN**: 管理者

### 権限
- 学生: 応募作成、バッジ申請、プロフィール管理
- 企業: プログラム管理、応募管理、バッジ作成・承認
- 管理者: 全機能アクセス、ユーザー管理

## 📧 メール通知

### 自動送信メール
- 新規応募通知（企業宛）
- 選考結果通知（学生宛）
- バッジ申請通知（企業・管理者宛）
- バッジ申請結果通知（学生宛）

### メール設定
SMTPサーバーの設定が必要です。Gmail、SendGrid、AWS SESなどに対応。

## 📁 ファイルアップロード

### サポートファイル
- **画像**: JPEG, PNG, GIF, WebP (最大5MB)
- **ドキュメント**: PDF, Word (最大20MB)

### アップロード種別
- プロフィール画像 (5MB制限)
- ポートフォリオファイル (20MB制限)
- バッジ画像 (2MB制限)
- 企業ロゴ (3MB制限)

## 🧪 テスト

```bash
# ユニットテスト
npm run test

# E2Eテスト
npm run test:e2e

# テストカバレッジ
npm run test:coverage
```

## 📈 パフォーマンス

### 最適化
- Next.js App Router使用
- 画像最適化
- データベースインデックス
- APIレスポンスキャッシュ

### 監視
- エラー追跡
- パフォーマンス監視
- ユーザー行動分析

## 🚀 デプロイ

### 本番環境
```bash
# ビルド
npm run build

# 本番起動
npm start
```

### 環境別設定
- 開発: `npm run dev`
- ステージング: `npm run build && npm start`
- 本番: Vercel自動デプロイ

## 🤝 コントリビューション

1. フォークする
2. フィーチャーブランチ作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. プッシュ (`git push origin feature/amazing-feature`)
5. プルリクエスト作成

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 📞 サポート

- 技術的な質問: [GitHub Issues](https://github.com/your-repo/issues)
- ビジネス関連: contact@ambassador-platform.com

---

**開発チーム**: 日本学生アンバサダー協議会 開発部
**最終更新**: 2024年12月
