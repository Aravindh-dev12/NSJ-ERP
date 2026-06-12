# 🚀 Quick Testing Setup

## For Someone Testing This Project

Hi! This guide will get you up and running in **5 minutes**.

---

## 🎯 Choose Your Method

### Method 1: Automated Setup (Recommended) ⚡

**Windows:**

```bash
# Just double-click or run:
setup-for-testing.bat
```

**macOS/Linux:**

```bash
# Make executable and run:
chmod +x setup-for-testing.sh
./setup-for-testing.sh
```

The script will:

- ✅ Check all prerequisites
- ✅ Install dependencies
- ✅ Setup database
- ✅ Create admin user
- ✅ Configure environment

### Method 2: Docker (Easiest) 🐳

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start everything
docker-compose up -d --build

# 3. Setup database
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser

# 4. Access
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### Method 3: Manual Setup (Full Control) 🛠️

See the complete guide: **[HANDOVER_GUIDE.md](HANDOVER_GUIDE.md)**

---

## 📱 After Setup

### Start the Application

**Terminal 1 - Backend:**

```bash
cd nsj-backend/nsj-backend
uv run python manage.py runserver
```

**Terminal 2 - Frontend:**

```bash
cd nsj-frontend/nsj-frontend
pnpm dev
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin

### Login

Use the superuser credentials you created during setup.

---

## 🧪 Quick Test

1. Open http://localhost:3000
2. Login with your credentials
3. Navigate to Dashboard
4. Try creating an account: Accounts → New Account
5. Check the accounts list

---

## 📚 Full Documentation

For detailed information, see:

- **[HANDOVER_GUIDE.md](HANDOVER_GUIDE.md)** - Complete setup and testing guide
- **[DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)** - Docker deployment guide
- **nsj-backend/nsj-backend/README.md** - Backend documentation
- **nsj-frontend/nsj-frontend/README.md** - Frontend documentation

---

## 🆘 Need Help?

### Common Issues

**Backend won't start:**

```bash
# Check if port 8000 is free
# Windows: netstat -ano | findstr :8000
# Mac/Linux: lsof -ti:8000

# Try different port
python manage.py runserver 8001
```

**Frontend won't start:**

```bash
# Check if port 3000 is free
# Delete node_modules and reinstall
rm -rf node_modules
pnpm install
```

**Can't login:**

- Make sure backend is running
- Check browser console for errors
- Verify .env.local has correct API URL

### Get More Help

Check the troubleshooting section in [HANDOVER_GUIDE.md](HANDOVER_GUIDE.md)

---

## ✅ Testing Checklist

- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] Can login to the application
- [ ] Dashboard loads
- [ ] Can create an account
- [ ] Can create a voucher
- [ ] Can view tasks (new feature)

---

## 🎉 You're Ready!

The application is now running and ready for testing.

**Happy Testing!** 🚀
