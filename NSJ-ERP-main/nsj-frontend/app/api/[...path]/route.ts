import { NextRequest, NextResponse } from "next/server";

/**
 * Catch-all API proxy route.
 *
 * Every request to /api/* on the frontend is forwarded to the Django backend.
 * This eliminates cross-origin issues (CORS, third-party cookie blocking,
 * SameSite cookie problems) because the browser only ever talks to the
 * frontend's own origin.
 *
 * The backend URL is read from the BACKEND_URL env var at runtime (server-side
 * only, no NEXT_PUBLIC_ prefix needed).  Falls back to the build-time
 * NEXT_PUBLIC_API_BASE_URL with the /api suffix stripped.
 */

function getBackendOrigin(): string {
  // Prefer a dedicated server-side env var
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/+$/, "");
  }
  
  // Check the public URL, but only use it if it's an absolute URL
  const pub = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (pub && pub.startsWith("http")) {
    return pub.replace(/\/api\/?$/, "");
  }
  
  // Fall back to the production backend origin
  return "https://nsj-backend-production-6642.up.railway.app";
}

async function handler(
  req: NextRequest
) {
  const backendOrigin = getBackendOrigin();
  // Use nextUrl.pathname to perfectly preserve trailing slashes for most Django routes
  let targetPath = req.nextUrl.pathname;

  // Django's auth endpoints do not use trailing slashes.
  // Because next.config.mjs has trailingSlash: true, Next.js adds them, which causes 404s.
  const noTrailingSlashPaths = [
    "/api/auth/csrf",
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/auth/me",
    "/api/auth/logout",
    "/api/users/me"
  ];
  if (noTrailingSlashPaths.includes(targetPath.replace(/\/$/, ""))) {
    targetPath = targetPath.replace(/\/$/, "");
  }

  // Preserve query string
  const url = new URL(req.url);
  const qs = url.search; // includes leading "?"

  const targetUrl = `${backendOrigin}${targetPath}${qs}`;

  // Build headers – forward everything except host
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "connection") return;
    headers.set(key, value);
  });

  // Forward cookies
  const cookie = req.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }

  // Build fetch options
  const init: RequestInit = {
    method: req.method,
    headers,
    duplex: "half",
  };

  // Forward body for non-GET/HEAD requests via stream
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body as any;
  }

  try {
    const upstream = await fetch(targetUrl, init);

    // Build response headers
    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      // Skip hop-by-hop headers
      if (
        lower === "transfer-encoding" ||
        lower === "connection" ||
        lower === "keep-alive" ||
        lower === "content-encoding"
      ) {
        return;
      }
      responseHeaders.append(key, value);
    });

    // Handle Set-Cookie exactly as it was
    const setCookieHeader = upstream.headers.get("set-cookie");
    if (setCookieHeader) {
      const cookies = setCookieHeader.split(/,(?=\s*[a-zA-Z0-9_-]+\s*=)/);
      cookies.forEach((cookieStr) => {
        let modifiedCookie = cookieStr
          .replace(/Domain=[^;]+;/i, "")
          .replace(/SameSite=None/i, "SameSite=Lax");

        if (req.nextUrl.protocol === "http:") {
          modifiedCookie = modifiedCookie.replace(/Secure;/i, "");
        }
        responseHeaders.append("Set-Cookie", modifiedCookie);
      });
    }

    // Stream the response body directly back to the client
    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[API Proxy] Failed to reach backend:", targetUrl, error);
    return NextResponse.json(
      { detail: "Backend service unavailable" },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
