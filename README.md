# Ambassador PoC - 日本学生アンバサダー協議会プラットフォーム

企業のアンバサダープログラムに参加する学生と企業をつなぐプラットフォームのPoC（Proof of Concept）実装です。

## プロジェクト概要

### スプリント1（完了）
- ✅ 認証機能（ログイン・登録）
- ✅ ランディングページ
- ✅ 学生ダッシュボード
- ✅ 企業ダッシュボード
- ✅ 管理者ダッシュボード

### スプリント2（現在）
- ✅ PostgreSQL + Prismaデータベース実装
- ✅ 認証API（実データベース対応）
- ✅ プログラム管理API
- 🔄 応募管理API（実装予定）
- 🔄 バッジ管理API（実装予定）
- 🔄 フロントエンドの実API接続（実装予定）

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL + Prisma ORM
- **認証**: JWT + bcryptjs
- **状態管理**: Zustand（必要に応じて）

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. PostgreSQLの設定

PostgreSQLをインストールして起動してください：

```bash
# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# データベース作成
createdb ambassador_poc
```

### 3. 環境変数の設定

`.env`ファイルをプロジェクトルートに作成してください：

```env
# データベース接続URL
DATABASE_URL="postgresql://username:password@localhost:5432/ambassador_poc?schema=public"

# JWT認証用シークレットキー
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Next.js設定
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# 環境設定
NODE_ENV="development"
```

**注意**: 
- `username`と`password`は実際のPostgreSQLユーザー情報に置き換えてください
- 本番環境では強力なランダム文字列をJWT_SECRETに使用してください

### 4. データベース初期化

```bash
# Prismaクライアント生成
npx prisma generate

# データベーススキーマ適用
npx prisma db push

# データベースの確認（オプション）
npx prisma studio
```

### 5. 開発サーバー起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で利用できます。

## データベーススキーマ

主要なテーブル構成：

- **User**: ユーザー情報（学生・企業・管理者）
- **StudentProfile**: 学生プロフィール詳細
- **CompanyProfile**: 企業プロフィール詳細
- **AdminProfile**: 管理者プロフィール詳細
- **Program**: アンバサダープログラム
- **Application**: プログラム応募
- **Badge**: バッジ情報
- **BadgeRequest**: バッジ発行申請

## API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン

### プログラム管理
- `GET /api/programs` - プログラム一覧取得
- `POST /api/programs` - プログラム作成（企業のみ）
- `GET /api/programs/[id]` - プログラム詳細取得
- `PUT /api/programs/[id]` - プログラム更新
- `DELETE /api/programs/[id]` - プログラム削除

### 応募管理（実装予定）
- `POST /api/applications` - プログラム応募
- `GET /api/applications/student/me` - 学生の応募一覧
- `GET /api/applications/company/[programId]` - 企業のプログラム応募者一覧

### バッジ管理（実装予定）
- `POST /api/badges/request` - バッジ発行申請
- `GET /api/badges/requests` - バッジ申請一覧（管理者）
- `PUT /api/badges/requests/[id]` - バッジ申請承認/却下

## 開発ワークフロー

1. **新機能開発**
   ```bash
   git checkout -b feature/new-feature
   # 開発作業
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

2. **データベーススキーマ変更**
   ```bash
   # schema.prismaを編集
   npx prisma db push
   npx prisma generate
   ```

3. **型定義の更新**
   Prismaスキーマを変更した場合、自動で型定義が更新されます。

## テストユーザー

開発環境でテスト用ユーザーを作成するには、登録画面から以下の情報で登録してください：

- **学生**: role="STUDENT"
- **企業**: role="COMPANY"  
- **管理者**: role="ADMIN"

## トラブルシューティング

### データベース接続エラー
- PostgreSQLが起動しているか確認
- `.env`ファイルのDATABASE_URLが正しいか確認
- データベース権限の確認

### Prismaエラー
```bash
# クライアント再生成
npx prisma generate

# データベース状態確認
npx prisma studio
```

### 型エラー
```bash
# 型定義の更新
npx prisma generate
npm run lint
```

## 今後の実装予定

### スプリント3（予定）
- 応募管理フローの完全実装
- バッジ発行・承認システム
- メール通知機能
- ファイルアップロード機能
- 検索・フィルタリング強化

### スプリント4（予定）
- パフォーマンス最適化
- セキュリティ強化
- 本番環境デプロイ準備
- 管理者機能拡張

## ライセンス

このプロジェクトは開発中のPoCであり、商用利用前に適切なライセンスを設定する予定です。
