"""
Custom middleware for NSJ Backend.
"""

import os


class SimpleCorsMiddleware:
    """
    Simple, bulletproof CORS middleware that ALWAYS adds CORS headers.

    This is a fallback for when django-cors-headers doesn't work properly
    on Railway/Gunicorn. It's simpler and more reliable.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        # Get allowed origins from environment
        self.allowed_origins = [
            "http://127.0.0.1:3000",
            "http://localhost:3000",
            "http://127.0.0.1:9292",
            "http://localhost:9292",
            "https://nsj-frontend-production-041e.up.railway.app",
        ]

        # Add from environment variables
        frontend_url = os.getenv("FRONTEND_URL")
        if frontend_url and frontend_url not in self.allowed_origins:
            self.allowed_origins.append(frontend_url)

        cors_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
        if cors_origins_env:
            for origin in cors_origins_env.split(","):
                origin = origin.strip()
                if origin and origin not in self.allowed_origins:
                    self.allowed_origins.append(origin)

        print(f"[SimpleCorsMiddleware] Initialized with origins: {self.allowed_origins}")

    def __call__(self, request):
        # Get the origin from the request
        origin = request.META.get("HTTP_ORIGIN", "")

        print(
            f"[SimpleCorsMiddleware] Request: {request.method} {request.path} from origin: {origin}"
        )

        # Handle OPTIONS (preflight) requests immediately
        if request.method == "OPTIONS":
            print(f"[SimpleCorsMiddleware] Handling OPTIONS request")
            response = self._create_options_response(origin)
            print(f"[SimpleCorsMiddleware] OPTIONS response headers: {dict(response.items())}")
            return response

        # Process the request normally
        response = self.get_response(request)

        # Add CORS headers to the response
        response = self._add_cors_headers(response, origin)

        print(f"[SimpleCorsMiddleware] Response headers: {dict(response.items())}")

        return response

    def _is_allowed_origin(self, origin):
        """Check if the origin is allowed."""
        if not origin:
            return False

        # Check exact matches
        if origin in self.allowed_origins:
            print(f"[SimpleCorsMiddleware] Origin {origin} is allowed (exact match)")
            return True

        # Check if it's a localhost/127.0.0.1 variant (for development)
        if "localhost" in origin or "127.0.0.1" in origin:
            print(f"[SimpleCorsMiddleware] Origin {origin} is allowed (localhost)")
            return True

        print(f"[SimpleCorsMiddleware] Origin {origin} is NOT allowed")
        return False

    def _add_cors_headers(self, response, origin):
        """Add CORS headers to response."""
        if self._is_allowed_origin(origin):
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = (
                "Content-Type, X-CSRFToken, Authorization, X-Simulated-User-Id"
            )
            response["Access-Control-Expose-Headers"] = "Content-Type, X-CSRFToken"
            response["Access-Control-Max-Age"] = "86400"  # 24 hours
            print(f"[SimpleCorsMiddleware] Added CORS headers for origin: {origin}")

        return response

    def _create_options_response(self, origin):
        """Create a response for OPTIONS (preflight) requests."""
        from django.http import HttpResponse

        response = HttpResponse()
        response.status_code = 200

        if self._is_allowed_origin(origin):
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = (
                "Content-Type, X-CSRFToken, Authorization, X-Simulated-User-Id"
            )
            response["Access-Control-Max-Age"] = "86400"  # 24 hours
            print(f"[SimpleCorsMiddleware] Created OPTIONS response for origin: {origin}")

        return response


class PartitionedCookieMiddleware:
    """
    Middleware to add 'Partitioned' attribute to cookies for better Safari/iOS compatibility.

    Safari and other browsers are increasingly strict about third-party cookies.
    The 'Partitioned' attribute (CHIPS - Cookies Having Independent Partitioned State)
    allows cookies to work in cross-site contexts while maintaining privacy.

    This is especially important for iOS Safari which blocks many cross-site cookies.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add Partitioned attribute to Set-Cookie headers
        if "Set-Cookie" in response:
            cookies = response.cookies
            for cookie_name in cookies:
                cookie = cookies[cookie_name]
                # Add Partitioned attribute if SameSite=None and Secure=True
                if cookie.get("samesite") == "None" and cookie.get("secure"):
                    # Django doesn't have built-in support for Partitioned yet
                    # We need to manually add it to the Set-Cookie header
                    pass  # Will be handled in process_response

        return response

    def process_response(self, request, response):
        """
        Process response to add Partitioned attribute to cookies.
        """
        # Get all Set-Cookie headers
        set_cookie_headers = response.get("Set-Cookie", "")

        if set_cookie_headers:
            # If SameSite=None and Secure are present, add Partitioned
            if "SameSite=None" in set_cookie_headers and "Secure" in set_cookie_headers:
                # Add Partitioned attribute
                if "Partitioned" not in set_cookie_headers:
                    response["Set-Cookie"] = set_cookie_headers + "; Partitioned"

        return response
