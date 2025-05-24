const CACHE_NAME = 'ambassador-platform-v1.0.0';
const STATIC_CACHE_NAME = 'ambassador-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'ambassador-dynamic-v1.0.0';

// キャッシュするリソース
const STATIC_FILES = [
  '/',
  '/programs',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // フォントやCSSなどの静的リソース
];

// API エンドポイントのキャッシュ戦略
const API_CACHE_PATTERNS = [
  '/api/programs',
  '/api/programs/search',
  '/api/auth/me'
];

// インストールイベント
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // 静的ファイルのキャッシュ
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      // 即座にアクティベート
      self.skipWaiting()
    ])
  );
});

// アクティベーションイベント
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // 古いキャッシュを削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME
            ) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // すべてのクライアントを制御
      self.clients.claim()
    ])
  );
});

// フェッチイベント
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Same-origin requests only
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(handleFetch(request));
});

// フェッチハンドラー
async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // 静的ファイルの処理
    if (isStaticFile(url.pathname)) {
      return await handleStaticFile(request);
    }
    
    // API リクエストの処理
    if (isApiRequest(url.pathname)) {
      return await handleApiRequest(request);
    }
    
    // HTML ページの処理
    if (isHtmlRequest(request)) {
      return await handleHtmlRequest(request);
    }
    
    // その他のリクエスト
    return await fetch(request);
    
  } catch (error) {
    console.error('Service Worker: Fetch error:', error);
    return await handleOfflineResponse(request);
  }
}

// 静的ファイルの処理（Cache First戦略）
async function handleStaticFile(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// API リクエストの処理（Network First戦略）
async function handleApiRequest(request) {
  try {
    // まずネットワークを試行
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // GET リクエストのみキャッシュ
      if (request.method === 'GET') {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    // ネットワークが失敗した場合、キャッシュから返す
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // オフライン通知を追加
        const response = cachedResponse.clone();
        const body = await response.text();
        const modifiedBody = addOfflineIndicator(body);
        
        return new Response(modifiedBody, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }
    }
    
    // オフライン用のエラーレスポンス
    return new Response(
      JSON.stringify({ 
        error: 'オフラインです。ネットワーク接続を確認してください。',
        offline: true 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// HTML ページの処理（Stale While Revalidate戦略）
async function handleHtmlRequest(request) {
  const cachedResponse = await caches.match(request);
  
  // キャッシュから即座にレスポンス
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(DYNAMIC_CACHE_NAME);
        cache.then(c => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// オフライン時のフォールバック
async function handleOfflineResponse(request) {
  const url = new URL(request.url);
  
  // HTML ページの場合
  if (isHtmlRequest(request)) {
    const cachedResponse = await caches.match('/');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(
      getOfflinePage(),
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
  
  // API の場合
  if (isApiRequest(url.pathname)) {
    return new Response(
      JSON.stringify({ 
        error: 'オフラインです',
        offline: true 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // その他
  return new Response('オフラインです', { status: 503 });
}

// ヘルパー関数
function isStaticFile(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext)) || 
         pathname.includes('/icons/') ||
         pathname === '/manifest.json';
}

function isApiRequest(pathname) {
  return pathname.startsWith('/api/');
}

function isHtmlRequest(request) {
  const acceptHeader = request.headers.get('Accept');
  return acceptHeader && acceptHeader.includes('text/html');
}

function addOfflineIndicator(body) {
  if (body.includes('<body')) {
    return body.replace(
      '<body',
      '<body data-offline="true" style="border-top: 3px solid #f59e0b;"'
    );
  }
  return body;
}

function getOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>オフライン - 日本学生アンバサダー協議会</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 2rem;
          max-width: 600px;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        p {
          font-size: 1.1rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        .button {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s ease;
        }
        .button:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>オフラインモード</h1>
        <p>
          インターネット接続がありません。<br>
          ネットワーク接続を確認してページを再読み込みしてください。
        </p>
        <a href="/" class="button" onclick="window.location.reload()">
          再読み込み
        </a>
      </div>
    </body>
    </html>
  `;
}

// プッシュ通知の受信
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  let notification = {
    title: 'アンバサダー協議会',
    body: 'プッシュ通知が届きました',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'ambassador-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '開く'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ]
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notification = { ...notification, ...data };
    } catch (error) {
      console.error('Push data parsing error:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notification.title, notification)
  );
});

// プッシュ通知のクリック処理
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  const action = event.action;
  const notification = event.notification;
  
  if (action === 'close') {
    return;
  }
  
  // 通知データからURLを取得
  const url = notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // 既存のウィンドウがあれば、そこにフォーカス
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

// バックグラウンド同期の実行
async function performBackgroundSync() {
  try {
    // 未送信のデータがあるかチェック
    const pendingRequests = await getPendingRequests();
    
    for (const request of pendingRequests) {
      try {
        await fetch(request.url, request.options);
        await removePendingRequest(request.id);
        console.log('Background sync: Request completed', request.url);
      } catch (error) {
        console.error('Background sync: Request failed', request.url, error);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// ペンディングリクエストの管理（IndexedDBを使用する実装が理想的）
async function getPendingRequests() {
  // 簡易実装：実際はIndexedDBを使用
  return [];
}

async function removePendingRequest(id) {
  // 簡易実装：実際はIndexedDBを使用
  return true;
}

console.log('Service Worker: Loaded successfully'); 