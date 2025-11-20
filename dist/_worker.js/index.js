globalThis.process ??= {}; globalThis.process.env ??= {};
import { a as renderers } from './chunks/_@astro-renderers_Dr3Tfn0V.mjs';
import { createExports } from './_@astrojs-ssr-adapter.mjs';
import { manifest } from './manifest_ClaF3_Xa.mjs';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/500.astro.mjs');
const _page3 = () => import('./pages/api/calculate.astro.mjs');
const _page4 = () => import('./pages/api/health.astro.mjs');
const _page5 = () => import('./pages/api/quotes/_id_.astro.mjs');
const _page6 = () => import('./pages/api/save-quote.astro.mjs');
const _page7 = () => import('./pages/api/validate.astro.mjs');
const _page8 = () => import('./pages/calculator/_step_.astro.mjs');
const _page9 = () => import('./pages/calculator.astro.mjs');
const _page10 = () => import('./pages/thank-you.astro.mjs');
const _page11 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/500.astro", _page2],
    ["src/pages/api/calculate.ts", _page3],
    ["src/pages/api/health.ts", _page4],
    ["src/pages/api/quotes/[id].ts", _page5],
    ["src/pages/api/save-quote.ts", _page6],
    ["src/pages/api/validate.ts", _page7],
    ["src/pages/calculator/[step].astro", _page8],
    ["src/pages/calculator/index.astro", _page9],
    ["src/pages/thank-you.astro", _page10],
    ["src/pages/index.astro", _page11]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _exports = createExports(_manifest);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
