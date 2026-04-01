"""
Railway-specific Django settings
"""

from .settings import *
import os
import dj_database_url

# Override settings for Railway deployment
DEBUG = os.environ.get("DEBUG", "False") == "True"

# Security settings
SECRET_KEY = os.environ.get("SECRET_KEY", SECRET_KEY)

# Allowed hosts - include Railway health check
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")
if not ALLOWED_HOSTS or ALLOWED_HOSTS == [""]:
    ALLOWED_HOSTS = ["*"]  # Allow all for Railway (Railway handles routing)
else:
    # Clean up empty strings from split
    ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS if host.strip()]

# Always add Railway health check host
if "healthcheck.railway.app" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append("healthcheck.railway.app")

# Add Railway public domain if available
railway_public_domain = os.environ.get("RAILWAY_PUBLIC_DOMAIN")
if railway_public_domain and railway_public_domain not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(railway_public_domain)

# Add Railway static URL if available (for older Railway deployments)
railway_static_url = os.environ.get("RAILWAY_STATIC_URL")
if railway_static_url:
    # Extract domain from URL
    from urllib.parse import urlparse

    domain = urlparse(railway_static_url).netloc
    if domain and domain not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(domain)

# Database - Railway provides DATABASE_URL
if os.environ.get("DATABASE_URL"):
    DATABASES = {
        "default": dj_database_url.config(
            default=os.environ.get("DATABASE_URL"),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }

# CORS settings
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
if not CORS_ALLOWED_ORIGINS or CORS_ALLOWED_ORIGINS == [""]:
    CORS_ALLOWED_ORIGINS = []

CSRF_TRUSTED_ORIGINS = os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",")
if not CSRF_TRUSTED_ORIGINS or CSRF_TRUSTED_ORIGINS == [""]:
    CSRF_TRUSTED_ORIGINS = []

# Security settings for production
if not DEBUG:
    # Railway handles HTTPS termination, so we need to trust the proxy headers
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    # Don't force SSL redirect - Railway handles this
    SECURE_SSL_REDIRECT = False

    # Exempt health check from SSL redirect for Railway healthcheck
    SECURE_REDIRECT_EXEMPT = [r"^health/$"]

    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

    # Disable HSTS for now to avoid redirect loops
    # SECURE_HSTS_SECONDS = 31536000
    # SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    # SECURE_HSTS_PRELOAD = True

# Static files
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATIC_URL = "/static/"

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": os.getenv("DJANGO_LOG_LEVEL", "INFO"),
            "propagate": False,
        },
    },
}
