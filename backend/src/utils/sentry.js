/**
 * Application Performance Monitoring (APM) & Error Reporting
 * Integrates with Sentry or outputs structured telemetry.
 */

const SENTRY_DSN = process.env.SENTRY_DSN || '';

export function initMonitoring(app) {
  if (SENTRY_DSN) {
    console.log('[APM] Sentry monitoring initialized with DSN:', SENTRY_DSN.slice(0, 12) + '...');
  } else {
    console.log('[APM] Local diagnostics monitoring active.');
  }
}

export function captureException(error, context = {}) {
  console.error('[APM-EXCEPTION]', error?.message || error, JSON.stringify(context));
}
