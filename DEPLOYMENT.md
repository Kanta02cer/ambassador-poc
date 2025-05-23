# 🚀 本番環境デプロイメントガイド

日本学生アンバサダー協議会プラットフォームの本番環境へのデプロイメント手順を説明します。

## 📋 事前準備

### 1. 必要なもの
- **VPS/クラウドサーバー** (Ubuntu 20.04/22.04 推奨)
- **ドメイン名** (例: ambassador-council.jp)
- **メールサービス** (Gmail、SendGrid、Amazon SES など)
- **GitHubアカウント** (CI/CD設定用)

### 2. 推奨スペック
- **CPU:** 2コア以上
- **メモリ:** 4GB以上 
- **ストレージ:** 50GB以上
- **帯域幅:** 無制限

## 🖥 サーバー初期設定

### 1. サーバーセットアップスクリプト実行

```bash
# ルートユーザーでサーバーにログイン
ssh root@your-server-ip

# セットアップスクリプトのダウンロードと実行
wget https://raw.githubusercontent.com/Kanta02cer/ambassador-poc/main/deploy/server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

このスクリプトが自動的に以下を実行します：
- システムパッケージの更新
- Docker & Docker Compose のインストール
- Nginx、Certbot、Fail2ban の設定
- ファイアウォールの設定
- プロジェクトディレクトリの作成

### 2. 環境変数の設定

```bash
cd /opt/ambassador-platform
cp .env.production.template .env.production
nano .env.production
```

以下の値を適切に設定してください：

```env
# データベース設定
DATABASE_URL="postgresql://ambassador_user:YOUR_DB_PASSWORD@db:5432/ambassador_platform"
DB_PASSWORD="your-strong-database-password-here"

# JWT設定（64文字以上の強力なランダム文字列）
JWT_SECRET="your-super-secret-jwt-key-64-characters-or-more-please-change-this"

# アプリケーション設定
NODE_ENV="production"
NEXTAUTH_URL="https://your-domain.com"
ADMIN_EMAIL="admin@your-domain.com"

# SMTP設定
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_NAME="日本学生アンバサダー協議会"
FROM_EMAIL="noreply@your-domain.com"
```

### 3. JWT秘密鍵の生成

```bash
# 強力なJWT秘密鍵を生成
openssl rand -base64 64
```

## 🌐 ドメイン・DNS設定

### 1. DNS レコードの設定

ドメインのDNS管理画面で以下のレコードを追加：

```
# Aレコード
ambassador-council.jp        → your-server-ip
www.ambassador-council.jp    → your-server-ip

# CNAMEレコード（オプション）
api.ambassador-council.jp    → ambassador-council.jp
```

### 2. SSL証明書の取得

```bash
cd /opt/ambassador-platform

# ドメイン名を変更してSSL証明書を取得
sed -i 's/your-domain.com/ambassador-council.jp/g' ssl-setup.sh
./ssl-setup.sh
```

## 📧 メール設定

### 1. Gmail使用時（推奨）

1. **Googleアカウントで2段階認証を有効化**
2. **アプリパスワードを生成：**
   - Google アカウント設定 → セキュリティ → アプリパスワード
   - アプリを選択：「メール」、デバイスを選択：「その他」
   - 生成されたパスワードを `SMTP_PASS` に設定

### 2. SendGrid使用時

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

### 3. Amazon SES使用時

```env
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-access-key-id"
SMTP_PASS="your-secret-access-key"
```

## 🐳 アプリケーションの起動

### 1. Docker Compose での起動

```bash
cd /opt/ambassador-platform

# アプリケーションを起動
systemctl start ambassador-platform

# 起動状況確認
systemctl status ambassador-platform
docker-compose logs -f
```

### 2. サービスの自動起動設定

```bash
# システム起動時の自動起動を有効化
systemctl enable ambassador-platform

# サービスの確認
systemctl is-enabled ambassador-platform
```

## 🔧 GitHub Actions CI/CD設定

### 1. GitHub Secrets の設定

リポジトリの Settings > Secrets and variables > Actions で以下を追加：

```
JWT_SECRET=your-production-jwt-secret
DATABASE_URL=postgresql://ambassador_user:password@db:5432/ambassador_platform
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NEXTAUTH_URL=https://ambassador-council.jp
DB_PASSWORD=your-database-password
PRODUCTION_HOST=your-server-ip
PRODUCTION_USER=root
PRODUCTION_SSH_KEY=your-ssh-private-key
```

### 2. SSH キーペアの生成

```bash
# サーバー上でSSHキーを生成
ssh-keygen -t rsa -b 4096 -C "github-actions@ambassador-council.jp"

# 公開鍵を認証済みキーに追加
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys

# 秘密鍵をGitHub Secretsに設定
cat ~/.ssh/id_rsa
```

## 🏥 ヘルスチェック・監視

### 1. ヘルスチェック

```bash
# アプリケーションの健全性確認
curl -f https://ambassador-council.jp/api/health

# レスポンス例
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": 150,
    "total": 200
  },
  "database": "connected"
}
```

### 2. ログ監視

```bash
# アプリケーションログ
docker-compose logs -f app

# Nginxログ
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# システムログ
journalctl -u ambassador-platform -f
```

## 🔐 セキュリティ設定

### 1. ファイアウォール確認

```bash
# UFW ステータス確認
ufw status

# 開放されているポート
22/tcp  (SSH)
80/tcp  (HTTP)
443/tcp (HTTPS)
```

### 2. Fail2ban 設定

```bash
# Fail2ban ステータス確認
fail2ban-client status

# SSH保護の確認
fail2ban-client status sshd
```

### 3. SSL証明書の自動更新確認

```bash
# Certbotの自動更新テスト
certbot renew --dry-run

# Cronジョブの確認
crontab -l
```

## 🔄 メンテナンス

### 1. アプリケーションの更新

```bash
cd /opt/ambassador-platform

# 最新コードを取得
git pull origin main

# サービスを再起動
systemctl restart ambassador-platform
```

### 2. データベースバックアップ

```bash
# PostgreSQL バックアップ
docker-compose exec db pg_dump -U ambassador_user ambassador_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# バックアップファイルの確認
ls -la backup_*.sql
```

### 3. ログローテーション

```bash
# Nginx ログローテーション
logrotate -f /etc/logrotate.d/nginx

# Docker ログのクリーンアップ
docker system prune -f
```

## 🚨 トラブルシューティング

### 1. よくある問題

#### アプリケーションが起動しない
```bash
# Docker コンテナの状態確認
docker-compose ps

# エラーログの確認
docker-compose logs app
```

#### メールが送信されない
```bash
# メール設定の診断（管理者権限必要）
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     https://ambassador-council.jp/api/admin/email-test

# テストメール送信
curl -X POST \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}' \
     https://ambassador-council.jp/api/admin/email-test
```

#### SSL証明書の問題
```bash
# SSL証明書の有効期限確認
openssl x509 -in /etc/letsencrypt/live/ambassador-council.jp/fullchain.pem -noout -dates

# 手動更新
certbot renew --force-renewal
```

### 2. 緊急時の連絡先

- **システム管理者:** admin@ambassador-council.jp
- **技術サポート:** tech-support@ambassador-council.jp

## 📚 参考資料

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt Certbot](https://certbot.eff.org/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**注意:** 本番環境では定期的なセキュリティアップデート、バックアップ、監視の実施を強く推奨します。 