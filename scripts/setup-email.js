const { setupDevelopmentEmail, testEmailSending } = require('../src/lib/setup-email');

async function main() {
  console.log('=== メール設定セットアップ ===\n');
  
  // 開発用メールアカウントのセットアップ
  await setupDevelopmentEmail();
  
  console.log('\n=== メール送信テスト ===\n');
  
  // メール送信のテスト
  await testEmailSending();
  
  console.log('\n=== セットアップ完了 ===');
  console.log('上記の設定を.envファイルに追加した後、アプリケーションを再起動してください。');
}

main().catch(console.error); 