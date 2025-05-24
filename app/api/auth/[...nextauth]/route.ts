import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "../../../../src/lib/prisma"
import type { UserRole } from "../../../../src/generated/prisma"

const providers = []

// Google認証プロバイダー（適切な認証情報が設定されている場合のみ有効）
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID !== "dummy-client-id") {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

// メール認証プロバイダー
providers.push(
  EmailProvider({
    server: {
      host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
      auth: {
        user: process.env.EMAIL_SERVER_USER || "",
        pass: process.env.EMAIL_SERVER_PASSWORD || "",
      },
    },
    from: process.env.EMAIL_FROM || "noreply@localhost",
  })
)

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Googleアカウントからユーザータイプを推定
        let role: UserRole = "STUDENT" // デフォルトは学生
        
        const email = user.email
        if (email) {
          // 企業ドメインやアドミンドメインの判定ロジック
          if (email.includes('@company.') || email.includes('@corp.')) {
            role = "COMPANY"
          } else if (email.includes('@admin.') || email.includes('@ambassador-council.')) {
            role = "ADMIN"
          }
        }
        
        // ユーザーが存在しない場合は作成
        const existingUser = await prisma.user.findUnique({
          where: { email: email! }
        })
        
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: email!,
              name: user.name,
              image: user.image,
              role: role,
              emailVerified: new Date(),
            }
          })
        }
      }
      return true
    },
    async session({ session }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! }
        })
        
        if (dbUser) {
          session.user.id = dbUser.id.toString()
          session.user.role = dbUser.role
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })
        
        if (dbUser) {
          token.id = dbUser.id.toString()
          token.role = dbUser.role
        }
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "development-secret-key",
})

export { handler as GET, handler as POST } 