# 実際のメール送信設定ガイド

## 現在の問題
現在、メール送信は**Ethereal Email**（テスト用サービス）を使用しているため、実際のメールボックスには届きません。

## 解決方法：Gmail SMTPを使用（推奨）

### 1. Gmailでアプリパスワードを取得

1. **Googleアカウントの2段階認証を有効化**
   - https://myaccount.google.com/security にアクセス
   - 「2段階認証プロセス」を有効にする

2. **アプリパスワードを生成**
   - https://myaccount.google.com/apppasswords にアクセス
   - 「アプリを選択」→「その他（カスタム名）」
   - 名前を「Ambassador POC」などと入力
   - 生成された16文字のパスワードをコピー

### 2. 環境変数を設定

`.env.local`ファイルを以下のように更新：

```env
# Gmail SMTP設定
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASS="your-16-character-app-password"
FROM_EMAIL="your-gmail@gmail.com"
```

**重要**: 
- `your-gmail@gmail.com` → 実際のGmailアドレスに変更
- `your-16-character-app-password` → 生成したアプリパスワードに変更

### 3. アプリケーションを再起動

```bash
# サーバーを停止
Ctrl+C

# 再起動
npm run dev
```

### 4. テスト

認証メールを送信してテスト：
```bash
curl -X POST http://localhost:3000/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","role":"STUDENT"}'
```

## 代替案：SendGrid（業務用推奨）

### 1. SendGridアカウント作成
- https://sendgrid.com でアカウント作成
- API キーを生成

### 2. 環境変数設定
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
FROM_EMAIL="noreply@yourdomain.com"
```

## トラブルシューティング

### Gmail設定が認識されない場合
1. `.env.local`の内容を確認
2. アプリケーションを完全に再起動
3. ログでSMTP設定を確認

### 認証エラーが発生する場合
1. 2段階認証が有効化されているか確認
2. アプリパスワードが正しいか確認
3. 通常のGmailパスワードではなくアプリパスワードを使用

### メール送信が失敗する場合
1. Gmailの「安全性の低いアプリのアクセス」を無効化（アプリパスワードを使用）
2. ファイアウォール設定を確認
3. SMTP_USER にGmailアドレス全体を入力

## 確認方法

メール送信が成功すると、ログに以下が表示されます：
```
メール送信成功: <message-id>
```

実際のメールボックスに認証メールが届きます。 