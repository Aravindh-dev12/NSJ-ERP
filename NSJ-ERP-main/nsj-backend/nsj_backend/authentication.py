"""
Custom authentication classes for NSJ Backend.

This module provides a CSRF-exempt session authentication class for use with
cross-origin API requests where CSRF cookies cannot be reliably shared between
different domains (e.g., Railway frontend and backend deployments).
"""

from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Session authentication that does not enforce CSRF validation.

    This is safe to use when:
    1. The API is accessed via Bearer token authentication (primary auth method)
    2. Cross-origin requests are properly validated via CORS settings
    3. Session cookies are used only as a fallback for browser-based requests

    The CORS middleware already validates the Origin header, providing protection
    against cross-site request forgery for cross-origin requests.
    """

    def enforce_csrf(self, request):
        """
        Skip CSRF validation for API requests.

        CORS headers provide sufficient protection for cross-origin requests,
        and Bearer token authentication is the primary auth method for the API.
        """
        return  # Skip CSRF check
