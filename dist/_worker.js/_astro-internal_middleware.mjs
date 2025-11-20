globalThis.process ??= {}; globalThis.process.env ??= {};
import { d as defineMiddleware, s as sequence } from './chunks/index_BaQqAmII.mjs';
import { l as logger, C as CONFIG } from './chunks/logger_AxPQEXXw.mjs';
import './chunks/astro-designed-error-pages_CeKPqRuY.mjs';

let _booted$1 = false;
let _bootError = null;
async function bootApp(_env) {
  if (_booted$1) {
    logger.debug("Boot", "Already booted, skipping");
    return;
  }
  if (_bootError) {
    logger.error("Boot", "Previous boot failed, not retrying", { error: _bootError });
    throw _bootError;
  }
  logger.info("Boot", "Starting application boot...");
  try {
    const startTime = Date.now();
    logger.debug("Boot", "Initializing security...");
    const { initSecurity } = await import('./chunks/index_CEzqAFoP.mjs');
    await initSecurity();
    if (CONFIG.features.ipEnrichment) {
      logger.debug("Boot", "Initializing enrichment...");
      const { initEnrichment } = await import('./chunks/index_C3tTPVrZ.mjs');
      await initEnrichment();
    }
    if (CONFIG.features.analytics) {
      logger.debug("Boot", "Initializing analytics...");
      const { initAnalytics } = await import('./chunks/index_DwPXT9RG.mjs');
      await initAnalytics(_env);
    }
    if (CONFIG.features.auth) {
      logger.debug("Boot", "Initializing auth...");
      logger.info("Boot", "Auth configured (on-demand initialization)");
    }
    if (CONFIG.features.sentry) {
      logger.debug("Boot", "Initializing monitoring...");
      logger.info("Boot", "Monitoring configured (per-request initialization)");
    }
    const bootTime = Date.now() - startTime;
    _booted$1 = true;
    logger.info("Boot", `✓ Application boot complete (${bootTime}ms)`, {
      features: {
        security: true,
        enrichment: CONFIG.features.ipEnrichment,
        analytics: CONFIG.features.analytics,
        auth: CONFIG.features.auth,
        monitoring: CONFIG.features.sentry
      }
    });
  } catch (error) {
    _bootError = error instanceof Error ? error : new Error(String(error));
    logger.error("Boot", "Boot failed", { error: _bootError });
    throw _bootError;
  }
}

function initSentry(_request, _env, _context) {
  logger.debug("Monitoring", "Sentry init (placeholder)");
  return null;
}
function captureException(_error, _context) {
  logger.debug("Monitoring", "Capture exception (placeholder)");
}

let _booted = false;
const onRequest$2 = defineMiddleware(async (context, next) => {
  const { request, locals, url } = context;
  const runtime = locals.runtime;
  if (!_booted && runtime?.env) {
    try {
      await bootApp(runtime.env);
      _booted = true;
      logger.info("Middleware", "Application booted successfully");
    } catch (error) {
      logger.error("Middleware", "Boot failed", { error });
    }
  }
  if (CONFIG.features.sentry && runtime?.env) {
    try {
      const sentry = initSentry(request, runtime.env, context);
      if (sentry) ;
    } catch (error) {
      logger.error("Middleware", "Sentry init failed", { error });
    }
  }
  let response;
  try {
    response = await next();
  } catch (error) {
    logger.error("Middleware", "Unhandled route error", { error });
    if (locals.sentry && error instanceof Error) {
      captureException(error, { url: url.pathname });
    }
    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
  const headers = new Headers(response.headers);
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (url.pathname.startsWith("/api/")) {
    headers.set("Cache-Control", "private, no-store, must-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
});

const When = {
                	Client: 'client',
                	Server: 'server',
                	Prerender: 'prerender',
                	StaticBuild: 'staticBuild',
                	DevServer: 'devServer',
              	};
            	
              const isBuildContext = Symbol.for('astro:when/buildContext');
              const whenAmI = globalThis[isBuildContext] ? When.Prerender : When.Server;

const middlewares = {
  [When.Client]: () => {
    throw new Error("Client should not run a middleware!");
  },
  [When.DevServer]: (_, next) => next(),
  [When.Server]: (_, next) => next(),
  [When.Prerender]: (ctx, next) => {
    if (ctx.locals.runtime === void 0) {
      ctx.locals.runtime = {
        env: process.env
      };
    }
    return next();
  },
  [When.StaticBuild]: (_, next) => next()
};
const onRequest$1 = middlewares[whenAmI];

const onRequest = sequence(
	onRequest$1,
	onRequest$2
	
);

export { onRequest };
