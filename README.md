# 日本学生アンバサダー協議会 - POCシステム

企業・学生・管理者のための包括的なアンバサダープログラム管理システムです。

## 🌟 主な機能

### 認証システム
- **マジックリンク認証**: パスワード不要の安全な認証システム
- **役割ベースアクセス制御**: 学生・企業・管理者の3つの役割
- **JWT トークン認証**: セキュアなAPIアクセス

### 学生向け機能
- プログラム検索・応募
- 応募状況管理
- プロフィール管理
- 通知システム

### 企業向け機能
- プログラム作成・管理
- 応募者管理
- ステータス追跡
- 分析ダッシュボード

### 管理者向け機能
- 全体管理
- ユーザー管理
- システム監視

### 通知システム
- リアルタイム通知
- メール通知
- プッシュ通知

### プログラム管理
- プログラム作成・編集・削除
- 応募管理
- ステータス管理
- レポート機能

## 🚀 セットアップ手順

### 1. 必要な環境
- Node.js 18.x以上
- npm または yarn
- SQLite（開発環境）

### 2. インストール
```bash
git clone <repository-url>
cd ambassador-poc
npm install
```

### 3. 環境変数設定
```bash
cp env.example .env
```

`.env`ファイルを編集して必要な値を設定：

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret (本番環境では安全なランダム文字列に変更)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Next.js
NEXTAUTH_URL="http://localhost:3000"

# メール設定（開発環境）
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_USER="your-ethereal-user"
SMTP_PASS="your-ethereal-pass"
FROM_EMAIL="noreply@ambassador-council.jp"
```

### 4. データベースセットアップ
```bash
npx prisma generate
npx prisma db push
```

### 5. メール設定（開発環境）
```bash
node scripts/setup-email.js
```

このスクリプトが生成するSMTP設定を`.env`ファイルに追加してください。

### 6. 開発サーバー起動
```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

## 🔐 認証システムの使用方法

### マジックリンク認証の流れ

1. **ログインページアクセス**: `/auth/login`
2. **アカウントタイプ選択**: 学生・企業・管理者から選択
3. **メールアドレス入力**: 登録済みまたは新規メールアドレス
4. **認証メール送信**: 15分間有効な認証リンクがメールで送信
5. **認証リンククリック**: メールの認証ボタンをクリック
6. **自動ログイン**: 対応するダッシュボードに自動遷移

### 初回ログイン
- 新しいメールアドレスでログインすると自動的にアカウントが作成されます
- 選択した役割（学生・企業・管理者）に応じたプロフィールが作成されます

### セキュリティ機能
- **有効期限**: 認証リンクは15分間のみ有効
- **ワンタイム使用**: 一度使用したリンクは無効化
- **レート制限**: 5分間に1回のみメール送信可能
- **SSL暗号化**: 全ての通信が暗号化

## 📧 メール設定

### 開発環境
- **Ethereal Email**: テスト用メールサービス
- 送信されたメールはブラウザで確認可能
- 実際のメール送信は行われません

### 本番環境の設定例

#### Gmail使用時
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASS="your-app-password"
```

#### SendGrid使用時
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

## 🎯 ユーザー役割とアクセス権限

### 学生アカウント
- プログラム検索・閲覧
- プログラム応募
- 応募状況確認
- プロフィール管理
- 通知受信

### 企業アカウント
- プログラム作成・編集・削除
- 応募者管理
- 応募状況確認
- 統計ダッシュボード
- 自社プログラムのみ管理可能

### 管理者アカウント
- 全体システム管理
- 全ユーザー・プログラム閲覧
- システム統計
- コンテンツ管理

## 🛠 API仕様

### 認証API
- `POST /api/auth/send-magic-link` - マジックリンク送信
- `GET /api/auth/verify?token=xxx` - トークン認証

### プログラムAPI
- `GET /api/programs` - プログラム一覧
- `POST /api/programs` - プログラム作成（企業のみ）
- `GET /api/programs/[id]` - プログラム詳細
- `PUT /api/programs/[id]` - プログラム更新（作成者のみ）
- `DELETE /api/programs/[id]` - プログラム削除（作成者のみ）

### 応募API
- `POST /api/applications` - 応募作成
- `GET /api/applications` - 応募一覧
- `PUT /api/applications/[id]` - 応募更新

## 🚀 デプロイメント

### Vercel（推奨）
1. GitHubリポジトリをVercelに接続
2. 環境変数を設定
3. 自動デプロイ

### 本番環境の設定
- 本格的なデータベース（PostgreSQL推奨）
- メールサービス（SendGrid、AWS SES等）
- SSL証明書の設定
- セキュリティヘッダーの設定

## 🧪 テスト

### 開発環境でのテスト
```bash
# メール設定テスト
node scripts/setup-email.js

# アプリケーション起動
npm run dev
```

### テスト用アカウント
開発環境では任意のメールアドレスでアカウントを作成できます：
- `student@example.com` - 学生アカウント
- `company@example.com` - 企業アカウント  
- `admin@example.com` - 管理者アカウント

## 📁 プロジェクト構造

```
ambassador-poc/
├── app/                    # Next.js App Router
│   ├── api/               # APIルート
│   │   ├── auth/          # 認証API
│   │   ├── programs/      # プログラムAPI
│   │   └── applications/  # 応募API
│   ├── auth/              # 認証ページ
│   ├── student/           # 学生ダッシュボード
│   ├── company/           # 企業ダッシュボード
│   └── admin/             # 管理者ダッシュボード
├── src/
│   ├── components/        # 共通コンポーネント
│   ├── lib/               # ユーティリティ
│   └── generated/         # Prisma生成ファイル
├── prisma/                # データベーススキーマ
└── scripts/               # ユーティリティスクリプト
```

## 🤝 コントリビューション

1. フォークする
2. フィーチャーブランチを作成する
3. コミットする
4. プッシュする
5. プルリクエストを作成する

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🆘 サポート

問題や質問がある場合は、以下の方法でお問い合わせください：

- **Issue**: GitHubのIssueを作成
- **Email**: support@ambassador-council.jp
- **Discord**: [開発者コミュニティ](https://discord.gg/ambassador-council)

---

**注意**: これはPoC（概念実証）システムです。本番環境での使用前には十分なセキュリティ監査とテストを実施してください。
