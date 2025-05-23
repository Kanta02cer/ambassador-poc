import { NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prisma';

export async function GET() {
  try {
    // データベース接続確認
    await prisma.$queryRaw`SELECT 1`;
    
    // 基本的なシステム情報
    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      database: 'connected',
    };

    return NextResponse.json(healthInfo);
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  }
} 