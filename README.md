# 日本学生アンバサダー協議会プラットフォーム

企業のアンバサダープログラムと学生をつなぐ革新的なプラットフォームです。学生は実践的な経験を積み、信頼性の高いデジタルバッジを取得できます。

## 🚀 機能概要

### 学生向け機能
- **プログラム検索・応募**: 企業のアンバサダープログラムを検索し応募
- **ダッシュボード**: 応募状況とおすすめプログラムの確認
- **デジタルバッジ**: 完了したプログラムのバッジ申請・取得
- **プロフィール管理**: 学歴・スキル・ポートフォリオの管理

### 企業向け機能
- **プログラム管理**: アンバサダープログラムの作成・編集・公開
- **応募者管理**: 学生の応募を確認し選考プロセスを管理
- **バッジ発行**: 完了した学生へのデジタルバッジ発行
- **企業プロフィール**: 会社情報・ロゴの管理

### 管理者機能
- **全体管理**: プラットフォーム全体の監視・管理
- **バッジ承認**: 企業が発行したバッジの最終承認
- **ユーザー管理**: 学生・企業アカウントの管理

## 🛠 技術スタック

### フロントエンド
- **Next.js 15** - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **React Hook Form** - フォーム管理

### バックエンド
- **Next.js API Routes** - サーバーサイドAPI
- **Prisma** - データベースORM
- **SQLite/PostgreSQL** - データベース
- **JWT** - 認証・認可

### インフラ・デプロイ
- **Docker** - コンテナ化
- **GitHub Actions** - CI/CD
- **Nginx** - リバースプロキシ
- **Redis** - キャッシュ・セッション管理

## 📦 セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn
- Git

### ローカル開発環境

1. **リポジトリのクローン**
```bash
git clone https://github.com/your-username/ambassador-poc.git
cd ambassador-poc
```

2. **依存関係のインストール**
```bash
npm install
```

3. **環境変数の設定**
```bash
cp .env.example .env
# .envファイルを編集して必要な値を設定
```

4. **データベースの初期化**
```bash
npm run db:generate
npm run db:push
```

5. **開発サーバーの起動**
```bash
npm run dev
```

アプリケーションは http://localhost:3000 で利用できます。

### テストアカウント

開発環境では以下のテストアカウントが利用できます：

- **学生**: success-test@example.com / password123
- **企業**: company@example.com / password123  
- **管理者**: admin@example.com / password123

## 🐳 Docker での実行

### 開発環境
```bash
npm run docker:compose
```

### 本番環境
```bash
docker-compose -f docker-compose.yml up -d
```

## 📚 API ドキュメント

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/register` - ユーザー登録

### プログラム管理
- `GET /api/programs` - プログラム一覧取得
- `POST /api/programs` - プログラム作成（企業のみ）
- `PUT /api/programs/:id` - プログラム更新（企業のみ）

### 応募管理
- `GET /api/applications` - 応募一覧取得
- `POST /api/applications` - 新規応募（学生のみ）
- `PUT /api/applications/:id` - 応募状況更新（企業のみ）

### バッジ管理
- `GET /api/badges` - バッジ一覧取得
- `POST /api/badges` - バッジ作成（企業・管理者のみ）
- `POST /api/badge-requests` - バッジ申請（学生のみ）

### ファイルアップロード
- `POST /api/upload` - ファイルアップロード（ロール別権限）

### システム
- `GET /api/health` - ヘルスチェック

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# リンター実行
npm run lint

# 型チェック
npm run type-check

# データベース操作
npm run db:generate    # Prismaクライアント生成
npm run db:push        # スキーマをデータベースに反映
npm run db:migrate     # マイグレーション実行
npm run db:studio      # Prisma Studio起動

# Docker操作
npm run docker:build   # Dockerイメージビルド
npm run docker:run     # Dockerコンテナ実行
npm run docker:compose # Docker Compose起動
```

## 🚀 デプロイ

### GitHub Actions CI/CD

1. **GitHub Secrets の設定**
```
JWT_SECRET=your-production-jwt-secret
DATABASE_URL=your-production-database-url
SMTP_HOST=your-smtp-host
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
PRODUCTION_HOST=your-server-ip
PRODUCTION_USER=your-server-user
PRODUCTION_SSH_KEY=your-ssh-private-key
```

2. **mainブランチにプッシュ**
```bash
git push origin main
```

GitHub Actionsが自動的にテスト・ビルド・デプロイを実行します。

### 手動デプロイ

```bash
# Dockerイメージをビルド
npm run docker:build

# 本番環境で実行
docker-compose -f docker-compose.yml up -d
```

## 📁 プロジェクト構造

```
ambassador-poc/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # 認証ページ
│   ├── student/           # 学生向けページ
│   ├── company/           # 企業向けページ
│   ├── admin/             # 管理者向けページ
│   └── programs/          # プログラム一覧ページ
├── src/
│   ├── lib/               # ユーティリティ・ライブラリ
│   ├── generated/         # Prisma生成ファイル
│   └── types/             # TypeScript型定義
├── public/
│   └── uploads/           # アップロードファイル
├── prisma/                # データベーススキーマ
├── .github/workflows/     # GitHub Actions
├── docker-compose.yml     # Docker Compose設定
├── Dockerfile            # Docker設定
└── README.md             # このファイル
```

## 🔒 セキュリティ

- JWT認証による安全なユーザー認証
- ロールベースアクセス制御（RBAC）
- ファイルアップロード時の型・サイズ検証
- SQLインジェクション対策（Prisma ORM）
- XSS対策（Next.jsの自動エスケープ）
- CSRF対策（SameSite Cookie）

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📞 サポート

質問や問題がある場合は、以下の方法でお問い合わせください：

- GitHub Issues: [Issues ページ](https://github.com/your-username/ambassador-poc/issues)
- Email: support@ambassador-council.jp

---

**日本学生アンバサダー協議会** - 学生と企業をつなぐ革新的なプラットフォーム
