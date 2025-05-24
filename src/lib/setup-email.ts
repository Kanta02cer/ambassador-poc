import nodemailer from 'nodemailer';

// 開発環境用のEthereal Emailアカウント自動設定
export async function setupDevelopmentEmail() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // 既に設定されている場合はスキップ
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('メール設定は既に設定されています');
    return {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };
  }

  try {
    console.log('開発用メールアカウントを作成中...');
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('開発用メールアカウントが作成されました:');
    console.log('SMTP設定:');
    console.log(`  Host: ${testAccount.smtp.host}`);
    console.log(`  Port: ${testAccount.smtp.port}`);
    console.log(`  User: ${testAccount.user}`);
    console.log(`  Pass: ${testAccount.pass}`);
    console.log('');
    console.log('送信されたメールは以下のURLで確認できます:');
    console.log(`  ${testAccount.web}`);
    console.log('');
    console.log('⚠️ .envファイルに以下の設定を追加してください:');
    console.log(`SMTP_USER="${testAccount.user}"`);
    console.log(`SMTP_PASS="${testAccount.pass}"`);
    console.log('');

    return testAccount;
  } catch (error) {
    console.error('開発用メールアカウントの作成に失敗しました:', error);
    return null;
  }
}

// メール送信のテスト
export async function testEmailSending() {
  try {
    const testAccount = await setupDevelopmentEmail();
    if (!testAccount) {
      console.log('メールテストをスキップします');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"日本学生アンバサダー協議会" <noreply@ambassador-council.jp>',
      to: 'test@example.com',
      subject: 'メール送信テスト',
      text: 'これはメール送信のテストです。',
      html: '<p>これはメール送信のテストです。</p>',
    });

    console.log('テストメールが送信されました:', info.messageId);
    console.log('プレビューURL:', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    console.error('メール送信テストに失敗しました:', error);
    return null;
  }
} 