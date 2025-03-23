import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

// Define protected routes that require authentication
const protectedRoutes = ["/dashboard", "/bookings", "/profile", "/create-booking"]
const authRoutes = ["/login", "/signup"]

export async function middleware(request: NextRequest) {
  // Update the session first
  const response = await updateSession(request)

  const { pathname } = request.nextUrl

  // Get the user from the session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If the user is not authenticated and trying to access a protected route
  if (!user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const redirectUrl = new URL("/login", request.url)
    // Preserve existing query parameters
    const currentSearchParams = new URLSearchParams(request.nextUrl.search)
    currentSearchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value)
    })
    // Add the redirect parameter
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If the user is authenticated and trying to access auth routes
  if (user && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

// Helper function to create a server client
import { createServerClient } from "@supabase/ssr"

