globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createDbClient, g as getQuoteById } from '../../../chunks/queries_CDSZzn1y.mjs';
import { g as generateErrorId, a as getCORSHeaders, c as createErrorResponse } from '../../../chunks/error_CRm63q5p.mjs';
import { l as logger } from '../../../chunks/logger_AxPQEXXw.mjs';
export { a as renderers } from '../../../chunks/_@astro-renderers_Dr3Tfn0V.mjs';

const prerender = false;
const GET = async (context) => {
  const runtime = context.locals.runtime;
  const errorId = generateErrorId();
  const origin = context.request.headers.get("Origin");
  const corsHeaders = getCORSHeaders(origin);
  const id = context.params.id;
  if (!id) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Quote ID is required",
        errorId
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
  try {
    const quoteId = Number.parseInt(id, 10);
    if (Number.isNaN(quoteId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid quote ID",
          errorId
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }
    const db = createDbClient({
      TURSO_DATABASE_URL: runtime.env.TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN: runtime.env.TURSO_AUTH_TOKEN
    });
    const quote = await getQuoteById(db, quoteId);
    if (!quote) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Quote not found",
          errorId
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }
    logger.info("API", "Quote retrieved", { quoteId: quote.id });
    const sanitized = {
      id: quote.id,
      totalPrice: quote.totalPrice,
      currency: quote.currency,
      breakdown: quote.breakdown,
      language: quote.language,
      status: quote.status,
      createdAt: quote.createdAt
    };
    return new Response(
      JSON.stringify({
        success: true,
        quote: sanitized
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=300",
          // 5 minutes
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    logger.error("API", "Get quote failed", { error, id });
    return createErrorResponse("Failed to retrieve quote", errorId, 500);
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
