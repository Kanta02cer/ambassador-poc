const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Next.jsアプリケーションを準備
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // HTTPサーバーを作成
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // WebSocketサーバーを初期化（本番環境のみ）
  if (!dev) {
    try {
      // dynamic importでESモジュールを読み込み
      import('./src/lib/websocket-server.js').then(({ notificationManager }) => {
        notificationManager.initialize(server, '/ws');
        console.log('🔔 WebSocket server initialized');
      }).catch(error => {
        console.error('Failed to initialize WebSocket server:', error);
      });
    } catch (error) {
      console.error('WebSocket initialization error:', error);
    }
  }

  // サーバー起動
  server.listen(port, () => {
    console.log(`🚀 Server ready on http://${hostname}:${port}`);
    if (dev) {
      console.log('💡 Development mode: WebSocket disabled');
    }
  });

  // 正常にシャットダウン
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}); 