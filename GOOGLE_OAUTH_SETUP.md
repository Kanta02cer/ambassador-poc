# Google OAuth認証セットアップガイド

## 🚨 エラー修正: 401 invalid_client

**現在の状況**: Google認証が無効化されており、メール認証のみが利用可能です。

### 手順1: .env.localファイルを作成

プロジェクトルートに`.env.local`ファイルを作成してください：

```bash
# .env.localファイルを作成
touch .env.local
```

### 手順2: 必要な環境変数を設定

`.env.local`ファイルに以下の環境変数を設定してください：

```env
# NextAuth.js設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=lV5aKpHgZrma9z/aRrdyEoz/kcK0vROu6SxcsyO9oDE=

# Google OAuth設定（Google Cloud Consoleで取得）
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret

# メール設定（既存のマジックリンク認証用）
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

## Google OAuth設定手順

### 1. Google Cloud Consoleでプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成またはexistingプロジェクトを選択
3. プロジェクト名：「Student Ambassador Council」

### 2. OAuth 2.0認証情報を作成

1. ナビゲーションメニューから「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuth クライアント ID」
3. アプリケーションの種類：「ウェブアプリケーション」
4. 名前：「Ambassador POC App」

### 3. リダイレクトURIを設定

**承認済みリダイレクトURI：**
- `http://localhost:3000/api/auth/callback/google` (開発環境)
- `https://your-domain.com/api/auth/callback/google` (本番環境)

### 4. 同意画面を設定

1. 「OAuth同意画面」タブに移動
2. User Type：「外部」を選択
3. アプリ情報を入力：
   - アプリ名：「学生アンバサダー協議会」
   - ユーザーサポートメール：あなたのメールアドレス
   - デベロッパーの連絡先情報：あなたのメールアドレス

### 5. スコープを設定

必要最小限のスコープを追加：
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`

## NEXTAUTH_SECRETの生成

以下のコマンドでランダムな秘密鍵を生成できます：

```bash
openssl rand -base64 32
```

または：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📋 現在利用可能な認証方法

### ✅ メール認証（マジックリンク）
- アカウントタイプ選択（学生/企業/管理者）
- メールアドレス入力でマジックリンク送信
- 15分間有効な認証リンク

### ⚠️ Google認証（設定が必要）
- 適切な環境変数設定後に自動で有効化
- ログインページに「Googleでログイン」ボタンが表示

## 開発環境での動作確認

1. 環境変数を設定
2. アプリケーションを再起動：`npm run dev`
3. `http://localhost:3000/auth/login`にアクセス
4. Google認証ボタンが表示されることを確認
5. 「Googleでログイン」ボタンをクリック
6. Google認証フローを完了
7. ダッシュボードにリダイレクトされることを確認

## トラブルシューティング

### エラー：「redirect_uri_mismatch」
- Google Cloud ConsoleのリダイレクトURIが正しく設定されているか確認
- URLが完全に一致していることを確認（末尾のスラッシュにも注意）

### エラー：「access_denied」
- OAuth同意画面の設定を確認
- テストユーザーに自分のメールアドレスが追加されているか確認

### エラー：「invalid_client」（401）
- `GOOGLE_CLIENT_ID`と`GOOGLE_CLIENT_SECRET`が正しく設定されているか確認
- 環境変数ファイル（.env.local）が正しく読み込まれているか確認
- ダミー値（dummy-client-id）が残っていないか確認

### Google認証ボタンが表示されない
- `.env.local`ファイルが存在するか確認
- 環境変数が正しく設定されているか確認
- アプリケーションを再起動

## ユーザータイプの自動判定

現在の実装では、Googleアカウントのメールアドレスに基づいてユーザータイプを自動判定しています：

- `@company.`または`@corp.`を含む → 企業ユーザー
- `@admin.`または`@ambassador-council.`を含む → 管理者
- その他 → 学生ユーザー

この判定ロジックは`app/api/auth/[...nextauth]/route.ts`の`signIn`コールバックで変更できます。

## セキュリティ考慮事項

1. **NEXTAUTH_SECRET**: 本番環境では強固なランダム文字列を使用
2. **リダイレクトURI**: 本番ドメインのみを設定
3. **OAuth同意画面**: 必要最小限の権限のみを要求
4. **環境変数**: `.env.local`をGitにコミットしない

## 🔧 開発時の便利機能

- Google認証が設定されていない場合、自動的にメール認証のみが表示
- 設定完了後、アプリケーション再起動でGoogle認証が自動有効化
- エラーメッセージでより詳細な情報を表示 