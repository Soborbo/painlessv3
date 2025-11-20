globalThis.process ??= {}; globalThis.process.env ??= {};
import { f as decodeKey } from './chunks/astro/server_D8h8_7uD.mjs';
import './chunks/astro-designed-error-pages_CeKPqRuY.mjs';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/noop-middleware_CRGhM98l.mjs';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///workspace/","adapterName":"@astrojs/cloudflare","routes":[{"file":"404.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/404","isIndex":false,"type":"page","pattern":"^\\/404\\/?$","segments":[[{"content":"404","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/404.astro","pathname":"/404","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"500.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/500","isIndex":false,"type":"page","pattern":"^\\/500\\/?$","segments":[[{"content":"500","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/500.astro","pathname":"/500","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/calculate","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/calculate","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/calculate\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"calculate","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/calculate.ts","pathname":"/api/calculate","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/health","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/health","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/health\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"health","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/health.ts","pathname":"/api/health","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/save-quote","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/save-quote","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/save-quote\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"save-quote","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/save-quote.ts","pathname":"/api/save-quote","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/validate","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/validate","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/validate\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"validate","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/validate.ts","pathname":"/api/validate","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"calculator/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/calculator","isIndex":true,"type":"page","pattern":"^\\/calculator\\/?$","segments":[[{"content":"calculator","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/calculator/index.astro","pathname":"/calculator","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"thank-you/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/thank-you","isIndex":false,"type":"page","pattern":"^\\/thank-you\\/?$","segments":[[{"content":"thank-you","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/thank-you.astro","pathname":"/thank-you","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/quotes/[id]","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/quotes\\/([^/]+?)\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"quotes","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/api/quotes/[id].ts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}}],"site":"https://your-domain.com","base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/workspace/src/pages/404.astro",{"propagation":"none","containsHead":true}],["/workspace/src/pages/500.astro",{"propagation":"none","containsHead":true}],["/workspace/src/pages/thank-you.astro",{"propagation":"none","containsHead":true}],["/workspace/src/pages/index.astro",{"propagation":"none","containsHead":true}],["/workspace/src/pages/calculator/[step].astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(o,t)=>{let i=async()=>{await(await o())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var s=(i,t)=>{let a=async()=>{await(await i())()};if(t.value){let e=matchMedia(t.value);e.matches?a():e.addEventListener(\"change\",a,{once:!0})}};(self.Astro||(self.Astro={})).media=s;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var l=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let a of e)if(a.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=l;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astrojs-ssr-virtual-entry":"index.js","\u0000@astro-page:node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint@_@js":"pages/_image.astro.mjs","\u0000@astro-page:src/pages/404@_@astro":"pages/404.astro.mjs","\u0000@astro-page:src/pages/500@_@astro":"pages/500.astro.mjs","\u0000@astro-page:src/pages/api/calculate@_@ts":"pages/api/calculate.astro.mjs","\u0000@astro-page:src/pages/api/health@_@ts":"pages/api/health.astro.mjs","\u0000@astro-page:src/pages/api/quotes/[id]@_@ts":"pages/api/quotes/_id_.astro.mjs","\u0000@astro-page:src/pages/api/validate@_@ts":"pages/api/validate.astro.mjs","\u0000@astro-page:src/pages/calculator/index@_@astro":"pages/calculator.astro.mjs","\u0000@astro-page:src/pages/thank-you@_@astro":"pages/thank-you.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astro-page:src/pages/calculator/[step]@_@astro":"pages/calculator/_step_.astro.mjs","\u0000astro-internal:middleware":"_astro-internal_middleware.mjs","\u0000@astro-page:src/pages/api/save-quote@_@ts":"pages/api/save-quote.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astro-renderers":"renderers.mjs","/workspace/src/lib/features/security/index.ts":"chunks/index_CEzqAFoP.mjs","/workspace/src/lib/features/analytics/index.ts":"chunks/index_DwPXT9RG.mjs","__vite-optional-peer-dep:@react-email/render:resend":"chunks/render_resend_DLE_5PtG.mjs","/workspace/src/lib/features/enrichment/index.ts":"chunks/index_C3tTPVrZ.mjs","\u0000@astrojs-manifest":"manifest_BqIH1N-1.mjs","@astrojs/react/client.js":"_astro/client.BuOr9PT5.js","/astro/hoisted.js?q=0":"_astro/hoisted.DVI16Jtz.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/_step_.qoF7SLzy.css","/favicon.svg","/robots.txt","/_worker.js/_@astrojs-ssr-adapter.mjs","/_worker.js/_astro-internal_middleware.mjs","/_worker.js/index.js","/_worker.js/renderers.mjs","/_astro/client.BuOr9PT5.js","/_astro/hoisted.DVI16Jtz.js","/_astro/index.CVf8TyFT.js","/_worker.js/_astro/_step_.qoF7SLzy.css","/_worker.js/chunks/_@astro-renderers_Dr3Tfn0V.mjs","/_worker.js/chunks/astro-designed-error-pages_CeKPqRuY.mjs","/_worker.js/chunks/astro_9aMafRlL.mjs","/_worker.js/chunks/button_DqWRloqW.mjs","/_worker.js/chunks/calculations_C0b40Imc.mjs","/_worker.js/chunks/card_BcolzI_U.mjs","/_worker.js/chunks/error_CRm63q5p.mjs","/_worker.js/chunks/index_BaQqAmII.mjs","/_worker.js/chunks/index_C3tTPVrZ.mjs","/_worker.js/chunks/index_CEzqAFoP.mjs","/_worker.js/chunks/index_DgSsSIS0.mjs","/_worker.js/chunks/index_DwPXT9RG.mjs","/_worker.js/chunks/logger_AxPQEXXw.mjs","/_worker.js/chunks/noop-middleware_CRGhM98l.mjs","/_worker.js/chunks/payload-limit_DXE4oF9B.mjs","/_worker.js/chunks/queries_CDSZzn1y.mjs","/_worker.js/chunks/rate-limit_CAI_5mdE.mjs","/_worker.js/chunks/render_resend_DLE_5PtG.mjs","/_worker.js/chunks/schemas_QYUciPlW.mjs","/_worker.js/chunks/sha2_D3U_rMn9.mjs","/_worker.js/pages/404.astro.mjs","/_worker.js/pages/500.astro.mjs","/_worker.js/pages/_image.astro.mjs","/_worker.js/pages/calculator.astro.mjs","/_worker.js/pages/index.astro.mjs","/_worker.js/pages/thank-you.astro.mjs","/_worker.js/chunks/astro/env-setup_DUaZ-hTo.mjs","/_worker.js/chunks/astro/server_D8h8_7uD.mjs","/_worker.js/pages/api/calculate.astro.mjs","/_worker.js/pages/api/health.astro.mjs","/_worker.js/pages/api/save-quote.astro.mjs","/_worker.js/pages/api/validate.astro.mjs","/_worker.js/pages/calculator/_step_.astro.mjs","/_worker.js/pages/api/quotes/_id_.astro.mjs","/404.html","/500.html","/api/calculate","/api/health","/api/save-quote","/api/validate","/calculator/index.html","/thank-you/index.html","/index.html"],"buildFormat":"directory","checkOrigin":false,"serverIslandNameMap":[],"key":"eqdx+Lj6DbnfOyE3R8f7iIKnihK3xVO7uMaRdiVrMtE=","experimentalEnvGetSecretEnabled":false});

export { manifest };
