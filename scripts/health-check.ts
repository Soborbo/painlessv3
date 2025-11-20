/**
 * STARTUP HEALTH CHECK
 * 
 * Verifies all external services are reachable
 * Run before deployment or as part of CI/CD
 */

import { createClient } from '@libsql/client';

interface HealthCheck {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  message?: string;
  responseTime?: number;
}

async function checkTurso(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      return {
        name: 'Turso Database',
        status: 'fail',
        message: 'Missing credentials',
      };
    }

    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    await client.execute('SELECT 1');

    return {
      name: 'Turso Database',
      status: 'ok',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Turso Database',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkResend(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        name: 'Resend Email',
        status: 'warn',
        message: 'API key not configured (optional)',
      };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'HEAD',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return {
      name: 'Resend Email',
      status: 'ok',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Resend Email',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runHealthChecks() {
  console.log('🏥 Running health checks...\n');

  const checks = await Promise.all([checkTurso(), checkResend()]);

  let hasFailures = false;

  for (const check of checks) {
    const icon = check.status === 'ok' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';

    console.log(`${icon} ${check.name}`);

    if (check.message) {
      console.log(`   ${check.message}`);
    }

    if (check.responseTime) {
      console.log(`   Response time: ${check.responseTime}ms`);
    }

    if (check.status === 'fail') {
      hasFailures = true;
    }

    console.log('');
  }

  if (hasFailures) {
    console.error('❌ Health check failed');
    process.exit(1);
  }

  console.log('✅ All health checks passed');
  process.exit(0);
}

runHealthChecks().catch((error) => {
  console.error('Health check error:', error);
  process.exit(1);
});
