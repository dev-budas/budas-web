import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Allow login page through
  if (pathname === "/crm/login") {
    // Redirect to CRM if already logged in
    if (user) {
      return NextResponse.redirect(new URL("/crm", request.url));
    }
    return supabaseResponse;
  }

  // Protect all /crm routes
  if (pathname.startsWith("/crm") && !user) {
    return NextResponse.redirect(new URL("/crm/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/crm/:path*"],
};
