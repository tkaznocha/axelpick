import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // If Supabase isn't configured, skip auth checks
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Read the session from the cookie. The Supabase client will automatically
  // refresh an expired token using the refresh token (only makes a network call
  // when the JWT has actually expired, ~once per hour). For the vast majority of
  // requests this is a local cookie read with zero latency.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  // Redirect unauthenticated users away from protected routes
  const protectedPaths = ["/dashboard", "/events", "/skaters", "/leaderboard", "/leagues", "/settings", "/admin"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    const returnTo = request.nextUrl.pathname;
    url.pathname = "/login";
    url.search = "";
    if (returnTo && returnTo !== "/dashboard") {
      url.searchParams.set("next", returnTo);
    }
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login/landing page
  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/")) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get("next");
    url.pathname = next && /^\/[a-zA-Z0-9\-_/]*$/.test(next) ? next : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
