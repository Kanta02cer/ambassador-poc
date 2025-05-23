import nodemailer from 'nodemailer';

// サポートするメールプロバイダーの設定
export const EMAIL_PROVIDERS = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    description: 'Gmail (Googleアプリパスワード必須)'
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    description: 'Outlook/Hotmail'
  },
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    description: 'SendGrid'
  },
  ses: {
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
    description: 'Amazon SES'
  },
  custom: {
    host: '',
    port: 587,
    secure: false,
    description: 'カスタムSMTP'
  }
} as const;

// 環境変数からSMTP設定を取得
export const getEmailConfig = () => {
  const config = {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    },
    from: {
      name: process.env.FROM_NAME || '日本学生アンバサダー協議会',
      email: process.env.FROM_EMAIL || process.env.SMTP_USER || ''
    }
  };

  return config;
};

// SMTP接続テスト
export const testEmailConnection = async (): Promise<{
  success: boolean;
  error?: string;
  provider?: string;
}> => {
  try {
    const config = getEmailConfig();
    
    if (!config.auth.user || !config.auth.pass) {
      return {
        success: false,
        error: 'SMTP認証情報が設定されていません'
      };
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });

    // 接続テスト
    await transporter.verify();
    
    // プロバイダーを推測
    const provider = Object.keys(EMAIL_PROVIDERS).find(key => 
      EMAIL_PROVIDERS[key as keyof typeof EMAIL_PROVIDERS].host === config.host
    );

    return {
      success: true,
      provider: provider || 'custom'
    };

  } catch (error) {
    console.error('Email connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMTP接続に失敗しました'
    };
  }
};

// テストメール送信
export const sendTestEmail = async (toEmail: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  try {
    const config = getEmailConfig();
    
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    });

    const mailOptions = {
      from: `"${config.from.name}" <${config.from.email}>`,
      to: toEmail,
      subject: '【テスト】メール送信テスト - 日本学生アンバサダー協議会',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>メール送信テスト</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
            <h1 style="color: #2563eb; text-align: center; margin-bottom: 30px;">
              🎉 メール送信テスト成功！
            </h1>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <p>このメールは、<strong>日本学生アンバサダー協議会プラットフォーム</strong>のメール送信機能のテストです。</p>
              
              <p>✅ SMTP接続が正常に動作しています</p>
              <p>✅ メールテンプレートが正しく表示されています</p>
              <p>✅ 本番環境でのメール送信準備が完了しました</p>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #1976d2; margin-top: 0;">📧 送信情報</h3>
              <ul style="margin-bottom: 0;">
                <li><strong>送信日時:</strong> ${new Date().toLocaleString('ja-JP')}</li>
                <li><strong>送信先:</strong> ${toEmail}</li>
                <li><strong>プラットフォーム:</strong> Ambassador Platform</li>
              </ul>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px; border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px;">
              <p>このメールは自動送信されています。返信はできません。</p>
              <p>&copy; 2024 日本学生アンバサダー協議会. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
【メール送信テスト成功】

このメールは、日本学生アンバサダー協議会プラットフォームのメール送信機能のテストです。

✅ SMTP接続が正常に動作しています
✅ メールテンプレートが正しく表示されています  
✅ 本番環境でのメール送信準備が完了しました

送信情報:
- 送信日時: ${new Date().toLocaleString('ja-JP')}
- 送信先: ${toEmail}
- プラットフォーム: Ambassador Platform

このメールは自動送信されています。返信はできません。
© 2024 日本学生アンバサダー協議会. All rights reserved.
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    console.error('Test email sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'テストメール送信に失敗しました'
    };
  }
};

// 管理者用メール設定診断
export const diagnoseEmailConfig = () => {
  const config = getEmailConfig();
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // 必須設定チェック
  if (!config.host) issues.push('SMTP_HOST が設定されていません');
  if (!config.auth.user) issues.push('SMTP_USER が設定されていません');
  if (!config.auth.pass) issues.push('SMTP_PASS が設定されていません');
  
  // 推奨設定チェック
  if (!config.from.email) warnings.push('FROM_EMAIL が設定されていません（SMTP_USERが使用されます）');
  if (!process.env.FROM_NAME) warnings.push('FROM_NAME が設定されていません（デフォルト名が使用されます）');
  
  // プロバイダー識別
  const provider = Object.entries(EMAIL_PROVIDERS).find(([_, providerConfig]) => 
    providerConfig.host === config.host
  )?.[0] || 'custom';
  
  // プロバイダー固有の警告
  if (provider === 'gmail' && !warnings.some(w => w.includes('アプリパスワード'))) {
    warnings.push('Gmailを使用する場合は、2段階認証を有効にしてアプリパスワードを生成してください');
  }
  
  return {
    config: {
      ...config,
      auth: { user: config.auth.user, pass: config.auth.pass ? '***' : '' }
    },
    provider,
    issues,
    warnings,
    isValid: issues.length === 0
  };
}; 