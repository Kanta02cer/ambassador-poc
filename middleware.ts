import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // ここで追加のロジックを実装可能（ロールベースアクセス制御など）
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 認証が必要なページかどうかをチェック
        const { pathname } = req.nextUrl
        
        // 公開ページは認証不要
        if (
          pathname === '/' ||
          pathname.startsWith('/auth/') ||
          pathname.startsWith('/api/auth/') ||
          pathname.startsWith('/api/auth/send-magic-link') ||
          pathname.startsWith('/api/auth/verify') ||
          pathname.startsWith('/_next/') ||
          pathname.startsWith('/favicon.ico')
        ) {
          return true
        }
        
        // その他のページは認証が必要
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 