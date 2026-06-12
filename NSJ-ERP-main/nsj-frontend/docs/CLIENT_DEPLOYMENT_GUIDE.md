# 🚀 Client Deployment Guide - NSJ Project

## Overview

This guide will help you deploy the NSJ project to a live server so your client can test it via a public URL.

---

## 🎯 Deployment Options (Ranked by Ease)

### Option 1: Railway.app (Easiest - Recommended) ⭐

- **Cost**: Free tier available, ~$5-10/month for production
- **Time**: 15-20 minutes
- **Best for**: Quick demos, client testing
- **Pros**: Zero DevOps, automatic HTTPS, easy setup
- **Cons**: Limited free tier

### Option 2: Render.com (Easy)

- **Cost**: Free tier available, ~$7-15/month for production
- **Time**: 20-30 minutes
- **Best for**: Production-ready deployments
- **Pros**: Free PostgreSQL, automatic deploys
- **Cons**: Free tier has cold starts

### Option 3: AWS (EC2 + RDS) (Professional)

- **Cost**: ~$20-50/month
- **Time**: 1-2 hours
- **Best for**: Enterprise clients, scalability
- **Pros**: Full control, scalable
- **Cons**: Requires AWS knowledge

### Option 4: DigitalOcean Droplet (Balanced)

- **Cost**: $6-12/month
- **Time**: 45-60 minutes
- **Best for**: Cost-effective production
- **Pros**: Simple, affordable, good performance
- **Cons**: Manual setup required

---

## 🚀 Option 1: Railway.app (RECOMMENDED FOR CLIENT DEMO)

### Why Railway?

- ✅ Fastest deployment (15 minutes)
- ✅ Automatic HTTPS with custom domain
- ✅ Built-in PostgreSQL
- ✅ GitHub integration
- ✅ Free $5 credit monthly
- ✅ Perfect for client demos

### Step-by-Step Deployment

#### Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Your code pushed to GitHub

#### Step 1: Prepare Your Code

**1.1 Update Backend Settings**

Create `nsj-backend/nsj-backend/nsj_backend/settings_production.py`:

```python
from .settings import *
import os

# Production settings
DEBUG = False
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('PGDATABASE'),
        'USER': os.environ.get('PGUSER'),
        'PASSWORD': os.environ.get('PGPASSWORD'),
        'HOST': os.environ.get('PGHOST'),
        'PORT': os.environ.get('PGPORT', 5432),
    }
}

# Security
SECRET_KEY = os.environ.get('SECRET_KEY')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# CORS
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
CSRF_TRUSTED_ORIGINS = os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',')

# Static files
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'
```

**1.2 Create Railway Config Files**

Create `railway.json` in project root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Create `Procfile` in `nsj-backend/nsj-backend/`:

```
web: gunicorn nsj_backend.wsgi --bind 0.0.0.0:$PORT
release: python manage.py migrate --noinput
```

**1.3 Update requirements.txt**

Add to `nsj-backend/nsj-backend/requirements.txt`:

```
gunicorn==21.2.0
psycopg2-binary==2.9.9
whitenoise==6.6.0
```

**1.4 Commit and Push**

```bash
git add .
git commit -m "feat: add Railway deployment configuration"
git push origin main
```

#### Step 2: Deploy Backend to Railway

1. **Go to Railway.app** and login
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your repository**
5. **Railway will detect Django automatically**

6. **Add PostgreSQL Database:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically link it

7. **Configure Environment Variables:**

   Click on your backend service → Variables → Add these:

   ```
   DJANGO_SETTINGS_MODULE=nsj_backend.settings_production
   SECRET_KEY=<generate-random-key>
   ALLOWED_HOSTS=*.railway.app,*.up.railway.app
   CORS_ALLOWED_ORIGINS=https://your-frontend.up.railway.app
   CSRF_TRUSTED_ORIGINS=https://your-frontend.up.railway.app
   PORT=8000
   ```

   To generate SECRET_KEY:

   ```bash
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```

8. **Deploy:**
   - Railway will automatically deploy
   - Wait for build to complete (3-5 minutes)
   - Note your backend URL: `https://your-backend.up.railway.app`

9. **Create Superuser:**
   - Go to your service → Settings → "Deploy Logs"
   - Click "Shell" tab
   - Run: `python manage.py createsuperuser`

#### Step 3: Deploy Frontend to Railway

1. **In Railway, click "New" → "GitHub Repo"**
2. **Select the same repository**
3. **Configure Build:**
   - Root Directory: `nsj-frontend/nsj-frontend`
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm start`

4. **Add Environment Variables:**

   ```
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
   NODE_ENV=production
   PORT=3000
   ```

5. **Deploy:**
   - Railway will build and deploy
   - Wait for completion (5-7 minutes)
   - Note your frontend URL: `https://your-frontend.up.railway.app`

6. **Update Backend CORS:**
   - Go back to backend service
   - Update `CORS_ALLOWED_ORIGINS` with your actual frontend URL
   - Redeploy backend

#### Step 4: Setup Custom Domain (Optional)

1. **In Railway, go to your frontend service**
2. **Click "Settings" → "Domains"**
3. **Click "Generate Domain"** or add custom domain
4. **Update backend CORS** with new domain

#### Step 5: Test Deployment

1. Visit your frontend URL
2. Login with superuser credentials
3. Test all features
4. Check browser console for errors

---

## 🚀 Option 2: Render.com

### Step-by-Step

#### Step 1: Prepare Code

Same as Railway Step 1, but create `render.yaml`:

```yaml
services:
  # Backend
  - type: web
    name: nsj-backend
    env: python
    region: oregon
    buildCommand: "cd nsj-backend/nsj-backend && pip install -r requirements.txt"
    startCommand: "cd nsj-backend/nsj-backend && gunicorn nsj_backend.wsgi:application"
    envVars:
      - key: DJANGO_SETTINGS_MODULE
        value: nsj_backend.settings_production
      - key: SECRET_KEY
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: nsj-db
          property: connectionString

  # Frontend
  - type: web
    name: nsj-frontend
    env: node
    region: oregon
    buildCommand: "cd nsj-frontend/nsj-frontend && pnpm install && pnpm build"
    startCommand: "cd nsj-frontend/nsj-frontend && pnpm start"
    envVars:
      - key: NEXT_PUBLIC_API_URL
        value: https://nsj-backend.onrender.com

databases:
  - name: nsj-db
    region: oregon
    plan: free
```

#### Step 2: Deploy

1. Go to https://render.com
2. Click "New" → "Blueprint"
3. Connect GitHub repository
4. Render will auto-detect `render.yaml`
5. Click "Apply"
6. Wait for deployment (10-15 minutes)

---

## 🚀 Option 3: DigitalOcean Droplet (Manual Setup)

### Step-by-Step

#### Step 1: Create Droplet

1. Go to https://digitalocean.com
2. Create Droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic $6/month (1GB RAM)
   - **Region**: Choose closest to client
   - **Authentication**: SSH Key (recommended)

#### Step 2: Initial Server Setup

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y python3.11 python3-pip python3-venv postgresql postgresql-contrib nginx certbot python3-certbot-nginx nodejs npm git

# Install pnpm
npm install -g pnpm

# Create app user
adduser nsj
usermod -aG sudo nsj
su - nsj
```

#### Step 3: Setup PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE nsj_db;
CREATE USER nsj_user WITH PASSWORD 'your_secure_password';
ALTER ROLE nsj_user SET client_encoding TO 'utf8';
ALTER ROLE nsj_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE nsj_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE nsj_db TO nsj_user;
\q
```

#### Step 4: Deploy Backend

```bash
# Clone repository
cd /home/nsj
git clone <your-repo-url> nsj-project
cd nsj-project/nsj-backend/nsj-backend

# Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt gunicorn psycopg2-binary

# Configure environment
cat > .env << EOF
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
DATABASE_URL=postgresql://nsj_user:your_secure_password@localhost/nsj_db
CORS_ALLOWED_ORIGINS=https://your-domain.com
EOF

# Run migrations
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

#### Step 5: Setup Gunicorn Service

```bash
sudo nano /etc/systemd/system/nsj-backend.service
```

Add:

```ini
[Unit]
Description=NSJ Backend
After=network.target

[Service]
User=nsj
Group=www-data
WorkingDirectory=/home/nsj/nsj-project/nsj-backend/nsj-backend
Environment="PATH=/home/nsj/nsj-project/nsj-backend/nsj-backend/venv/bin"
ExecStart=/home/nsj/nsj-project/nsj-backend/nsj-backend/venv/bin/gunicorn \
          --workers 3 \
          --bind unix:/home/nsj/nsj-project/nsj-backend/nsj-backend/nsj.sock \
          nsj_backend.wsgi:application

[Install]
WantedBy=multi-user.target
```

Start service:

```bash
sudo systemctl start nsj-backend
sudo systemctl enable nsj-backend
```

#### Step 6: Deploy Frontend

```bash
cd /home/nsj/nsj-project/nsj-frontend/nsj-frontend

# Install dependencies
pnpm install

# Build
NEXT_PUBLIC_API_URL=https://your-domain.com pnpm build

# Setup PM2 for process management
sudo npm install -g pm2
pm2 start npm --name "nsj-frontend" -- start
pm2 save
pm2 startup
```

#### Step 7: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/nsj
```

Add:

```nginx
# Backend
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://unix:/home/nsj/nsj-project/nsj-backend/nsj-backend/nsj.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /home/nsj/nsj-project/nsj-backend/nsj-backend/staticfiles/;
    }
}

# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/nsj /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 8: Setup SSL with Let's Encrypt

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All tests pass locally
- [ ] Environment variables are configured
- [ ] Database migrations are up to date
- [ ] Static files are collected
- [ ] CORS settings are correct
- [ ] SECRET_KEY is strong and unique
- [ ] DEBUG is set to False
- [ ] ALLOWED_HOSTS includes your domain
- [ ] SSL certificate is configured
- [ ] Backup strategy is in place

---

## 🎯 Post-Deployment Steps

### 1. Create Demo Data

```bash
# SSH into server or use Railway shell
python manage.py shell

# Create sample data
from accounts.models import Account
from vouchers.models import Voucher
# ... create sample records
```

### 2. Create Test User for Client

```bash
python manage.py createsuperuser
# Email: client@example.com
# Password: <secure-password>
```

### 3. Test Everything

- [ ] Frontend loads correctly
- [ ] Can login
- [ ] Dashboard displays
- [ ] Can create accounts
- [ ] Can create vouchers
- [ ] Can manage tasks
- [ ] All API endpoints work
- [ ] No console errors

### 4. Setup Monitoring (Optional)

**Using UptimeRobot (Free):**

1. Go to https://uptimerobot.com
2. Add monitor for your frontend URL
3. Add monitor for backend health endpoint
4. Get alerts if site goes down

---

## 📧 Email Template for Client

```
Subject: NSJ Application - Ready for Testing

Hi [Client Name],

The NSJ application is now deployed and ready for your testing!

🔗 Access Details:
Frontend: https://your-app.up.railway.app
Admin Panel: https://your-api.up.railway.app/admin

🔐 Test Credentials:
Email: demo@example.com
Password: [provide securely]

📱 What to Test:
1. Login to the application
2. Navigate through the dashboard
3. Create and manage accounts
4. Create vouchers (Sales, Purchase, Receipt, Payment)
5. Manage queries and tasks
6. Test the search and filter features

📝 Feedback:
Please test all features and let me know:
- Any bugs or issues you encounter
- Features that need clarification
- Performance concerns
- UI/UX suggestions

⏰ Availability:
I'm available for a walkthrough session if needed.
Best times: [your availability]

📞 Support:
Email: [your-email]
Phone: [your-phone]

Looking forward to your feedback!

Best regards,
[Your Name]
```

---

## 💰 Cost Comparison

| Platform     | Free Tier         | Paid (Production) | Best For       |
| ------------ | ----------------- | ----------------- | -------------- |
| Railway      | $5 credit/month   | $10-20/month      | Quick demos    |
| Render       | Yes (with limits) | $15-25/month      | Production     |
| DigitalOcean | No                | $12-24/month      | Cost-effective |
| AWS          | 12 months free    | $30-60/month      | Enterprise     |
| Heroku       | No free tier      | $16-50/month      | Legacy apps    |

---

## 🚨 Common Deployment Issues

### Issue: CORS Errors

**Solution:**

```python
# settings_production.py
CORS_ALLOWED_ORIGINS = [
    'https://your-frontend.com',
    'https://www.your-frontend.com',
]
CSRF_TRUSTED_ORIGINS = [
    'https://your-frontend.com',
    'https://www.your-frontend.com',
]
```

### Issue: Static Files Not Loading

**Solution:**

```bash
python manage.py collectstatic --noinput
```

### Issue: Database Connection Failed

**Solution:**

- Check DATABASE_URL format
- Verify PostgreSQL is running
- Check firewall rules
- Verify credentials

### Issue: 502 Bad Gateway

**Solution:**

- Check if backend service is running
- Verify port configuration
- Check logs for errors
- Restart services

---

## 📊 Monitoring & Maintenance

### Health Checks

Add to `nsj-backend/nsj-backend/core/views.py`:

```python
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    try:
        # Check database
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")

        return JsonResponse({
            'status': 'healthy',
            'database': 'connected'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)
```

### Logging

Configure in `settings_production.py`:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/var/log/nsj/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
```

---

## ✅ Final Checklist

Before sending to client:

- [ ] Application is deployed and accessible
- [ ] SSL certificate is active (HTTPS)
- [ ] Test user account created
- [ ] Sample data loaded
- [ ] All features tested
- [ ] No console errors
- [ ] Mobile responsive checked
- [ ] Performance is acceptable
- [ ] Monitoring is setup
- [ ] Backup strategy in place
- [ ] Documentation sent to client
- [ ] Support contact provided

---

## 🎉 You're Ready!

Choose your deployment method, follow the steps, and your client will have a live application to test!

**Recommended for Quick Client Demo**: Railway.app (15 minutes)
**Recommended for Production**: Render.com or DigitalOcean

Good luck with your deployment! 🚀
