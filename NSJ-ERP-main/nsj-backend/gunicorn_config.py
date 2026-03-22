# Gunicorn configuration file with CORS headers
import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
backlog = 2048

# Worker processes
workers = int(os.getenv("GUNICORN_WORKERS", "4"))
worker_class = "sync"
worker_connections = 1000
threads = int(os.getenv("GUNICORN_THREADS", "2"))
timeout = int(os.getenv("GUNICORN_TIMEOUT", "120"))
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
capture_output = True

# Process naming
proc_name = "nsj-backend"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (if needed)
keyfile = None
certfile = None

print("[Gunicorn] Configuration loaded successfully")
print(f"[Gunicorn] Workers: {workers}, Threads: {threads}, Timeout: {timeout}")
print(f"[Gunicorn] Binding to: {bind}")


def when_ready(server):
    """Called just after the server is started."""
    print(f"[Gunicorn] Server is ready. Listening on {bind}")
    print(f"[Gunicorn] Workers: {workers}, Threads: {threads}")
