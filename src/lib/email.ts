import nodemailer from 'nodemailer';

// メール設定の型定義
interface EmailConfig {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

// HTMLテンプレートの型定義
interface EmailTemplate {
  title: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
  footerText?: string;
}

// メール送信用トランスポーターの作成
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  if (!config.auth.user || !config.auth.pass) {
    console.warn('SMTP credentials not configured. Email sending disabled.');
    return null;
  }

  return nodemailer.createTransport(config);
};

// HTMLテンプレートの生成
const generateEmailHTML = (template: EmailTemplate): string => {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${template.title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-container {
          background-color: white;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2563eb;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        .content {
          margin-bottom: 30px;
        }
        .action-button {
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
        }
        .footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
          margin-top: 30px;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>日本学生アンバサダー協議会</h1>
        </div>
        <div class="content">
          ${template.content}
        </div>
        ${template.actionUrl && template.actionText ? `
          <div style="text-align: center;">
            <a href="${template.actionUrl}" class="action-button">${template.actionText}</a>
          </div>
        ` : ''}
        <div class="footer">
          ${template.footerText || 'このメールは自動送信されています。返信はできません。'}
        </div>
      </div>
    </body>
    </html>
  `;
};

// メール送信機能
export const sendEmail = async (config: EmailConfig): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email sending skipped: SMTP not configured');
      return false;
    }

    const mailOptions = {
      from: `"日本学生アンバサダー協議会" <${process.env.SMTP_USER}>`,
      to: config.to,
      subject: config.subject,
      text: config.text,
      html: config.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;

  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// 応募通知メール（企業宛）
export const sendApplicationNotificationEmail = async (
  companyEmail: string,
  studentName: string,
  programTitle: string,
  applicationId: number
): Promise<boolean> => {
  const template: EmailTemplate = {
    title: '新しい応募通知',
    content: `
      <h2>新しい応募が届きました</h2>
      <p>プログラム「<strong>${programTitle}</strong>」に新しい応募がありました。</p>
      <p><strong>応募者:</strong> ${studentName}</p>
      <p>応募内容を確認し、選考を進めてください。</p>
    `,
    actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/company/applications/${applicationId}`,
    actionText: '応募を確認する',
  };

  return sendEmail({
    to: companyEmail,
    subject: `【アンバサダー協議会】新しい応募通知: ${programTitle}`,
    html: generateEmailHTML(template),
  });
};

// 選考結果通知メール（学生宛）
export const sendApplicationStatusEmail = async (
  studentEmail: string,
  studentName: string,
  programTitle: string,
  companyName: string,
  status: string,
  rejectionReason?: string
): Promise<boolean> => {
  const isAccepted = status === 'ACCEPTED';
  const isRejected = status === 'REJECTED_BY_COMPANY';
  
  let content = `
    <h2>選考結果のお知らせ</h2>
    <p>${studentName} 様</p>
    <p>この度は、${companyName}の「<strong>${programTitle}</strong>」にご応募いただき、ありがとうございました。</p>
  `;

  if (isAccepted) {
    content += `
      <p>厳正な選考の結果、<strong style="color: #16a34a;">採用</strong>とさせていただくことになりました。</p>
      <p>今後の詳細については、別途ご連絡いたします。</p>
    `;
  } else if (isRejected) {
    content += `
      <p>厳正な選考の結果、今回は見送らせていただくことになりました。</p>
      ${rejectionReason ? `<p><strong>理由:</strong> ${rejectionReason}</p>` : ''}
      <p>今後も様々なプログラムをご用意しておりますので、ぜひ他の機会にもご応募ください。</p>
    `;
  }

  const template: EmailTemplate = {
    title: '選考結果通知',
    content,
    actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/student/applications`,
    actionText: 'マイページで確認する',
  };

  return sendEmail({
    to: studentEmail,
    subject: `【アンバサダー協議会】選考結果: ${programTitle}`,
    html: generateEmailHTML(template),
  });
};

// バッジ申請通知メール（企業・管理者宛）
export const sendBadgeRequestNotificationEmail = async (
  recipientEmail: string,
  studentName: string,
  badgeTitle: string,
  programTitle: string,
  requestId: number
): Promise<boolean> => {
  const template: EmailTemplate = {
    title: 'バッジ申請通知',
    content: `
      <h2>新しいバッジ申請が届きました</h2>
      <p>学生「<strong>${studentName}</strong>」から、プログラム「${programTitle}」の「<strong>${badgeTitle}</strong>」バッジの申請がありました。</p>
      <p>申請内容を確認し、承認・却下の判断をお願いします。</p>
    `,
    actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/admin/badge-requests/${requestId}`,
    actionText: '申請を確認する',
  };

  return sendEmail({
    to: recipientEmail,
    subject: `【アンバサダー協議会】バッジ申請通知: ${badgeTitle}`,
    html: generateEmailHTML(template),
  });
};

// バッジ申請結果通知メール（学生宛）
export const sendBadgeRequestStatusEmail = async (
  studentEmail: string,
  studentName: string,
  badgeTitle: string,
  programTitle: string,
  status: string,
  rejectionReason?: string
): Promise<boolean> => {
  const isApproved = status === 'APPROVED';
  const isRejected = status === 'REJECTED';
  
  let content = `
    <h2>バッジ申請結果のお知らせ</h2>
    <p>${studentName} 様</p>
    <p>プログラム「${programTitle}」の「<strong>${badgeTitle}</strong>」バッジの申請結果をお知らせします。</p>
  `;

  if (isApproved) {
    content += `
      <p>おめでとうございます！申請が<strong style="color: #16a34a;">承認</strong>されました。</p>
      <p>バッジがプロフィールに追加されました。今後のキャリア形成にお役立てください。</p>
    `;
  } else if (isRejected) {
    content += `
      <p>申請を慎重に検討させていただきましたが、今回は見送らせていただくことになりました。</p>
      ${rejectionReason ? `<p><strong>理由:</strong> ${rejectionReason}</p>` : ''}
      <p>今後も引き続きプログラムに取り組み、再度申請していただけますと幸いです。</p>
    `;
  }

  const template: EmailTemplate = {
    title: 'バッジ申請結果通知',
    content,
    actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/student/badges`,
    actionText: 'マイページで確認する',
  };

  return sendEmail({
    to: studentEmail,
    subject: `【アンバサダー協議会】バッジ申請結果: ${badgeTitle}`,
    html: generateEmailHTML(template),
  });
}; 