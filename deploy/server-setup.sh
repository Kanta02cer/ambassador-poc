#!/bin/bash

# 日本学生アンバサダー協議会プラットフォーム
# 本番サーバー初期設定スクリプト
# 
# 使用方法:
# wget https://raw.githubusercontent.com/your-username/ambassador-poc/main/deploy/server-setup.sh
# chmod +x server-setup.sh
# sudo ./server-setup.sh

set -e

echo "🚀 日本学生アンバサダー協議会プラットフォーム - 本番サーバー設定開始"

# 基本パッケージの更新
echo "📦 システムパッケージを更新中..."
apt-get update && apt-get upgrade -y

# 必要なパッケージのインストール
echo "📦 必要なパッケージをインストール中..."
apt-get install -y \
  curl \
  wget \
  git \
  ufw \
  nginx \
  certbot \
  python3-certbot-nginx \
  fail2ban \
  htop \
  tree

# Docker のインストール
echo "🐳 Docker をインストール中..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER

# Docker Compose のインストール
echo "🐳 Docker Compose をインストール中..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Node.js のインストール（開発用）
echo "📦 Node.js をインストール中..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# プロジェクトディレクトリの作成
echo "📁 プロジェクトディレクトリを作成中..."
mkdir -p /opt/ambassador-platform
cd /opt/ambassador-platform

# リポジトリのクローン
echo "📥 リポジトリをクローン中..."
git clone https://github.com/Kanta02cer/ambassador-poc.git .

# ファイアウォールの設定
echo "🔥 ファイアウォールを設定中..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Nginx の基本設定
echo "🌐 Nginx を設定中..."
systemctl enable nginx
systemctl start nginx

# データディレクトリの作成
echo "📁 データディレクトリを作成中..."
mkdir -p /opt/ambassador-platform/data
mkdir -p /opt/ambassador-platform/uploads
chmod 755 /opt/ambassador-platform/data
chmod 755 /opt/ambassador-platform/uploads

# 環境変数ファイルのテンプレート作成
echo "⚙️ 環境変数テンプレートを作成中..."
cat > /opt/ambassador-platform/.env.production.template << 'EOF'
# データベース設定
DATABASE_URL="postgresql://ambassador_user:YOUR_DB_PASSWORD@db:5432/ambassador_platform"
DB_PASSWORD="YOUR_STRONG_DB_PASSWORD"

# JWT設定
JWT_SECRET="YOUR_SUPER_SECRET_JWT_KEY_64_CHARACTERS_OR_MORE"

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
EOF

# SSL証明書の準備（手動実行が必要）
cat > /opt/ambassador-platform/ssl-setup.sh << 'EOF'
#!/bin/bash
# SSL証明書取得スクリプト
# 実行前にドメインのDNSが正しく設定されていることを確認してください

DOMAIN="your-domain.com"

echo "🔐 SSL証明書を取得中... ($DOMAIN)"
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# 自動更新の設定
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

echo "✅ SSL証明書の設定が完了しました"
EOF

chmod +x /opt/ambassador-platform/ssl-setup.sh

# systemd サービス作成
echo "⚙️ systemd サービスを作成中..."
cat > /etc/systemd/system/ambassador-platform.service << 'EOF'
[Unit]
Description=Ambassador Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/ambassador-platform
ExecStart=/usr/local/bin/docker-compose -f docker-compose.yml --env-file .env.production up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ambassador-platform

echo "✅ サーバー設定が完了しました！"
echo ""
echo "🔧 次のステップ:"
echo "1. .env.production.template をコピーして .env.production を作成"
echo "2. 環境変数を適切な値に設定"
echo "3. ドメインのDNS設定を行う"
echo "4. SSL証明書を取得: ./ssl-setup.sh"
echo "5. アプリケーションを起動: systemctl start ambassador-platform"
echo ""
echo "📝 重要なファイル:"
echo "- 設定ファイル: /opt/ambassador-platform/.env.production"
echo "- ログ: docker-compose logs -f"
echo "- データ: /opt/ambassador-platform/data"
echo "- アップロード: /opt/ambassador-platform/uploads" 