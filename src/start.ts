import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

// NOTE: The Supabase auth-attacher middleware is intentionally NOT registered.
// This project doesn't use Supabase auth, and the attacher would spam the
// console with "Missing SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY" errors on
// every server function call. If Supabase auth is added later, re-import
// `attachSupabaseAuth` from `@/integrations/supabase/auth-attacher` and put
// it back into `functionMiddleware`.

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [],
  requestMiddleware: [errorMiddleware],
}));
