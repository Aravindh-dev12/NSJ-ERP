# NSJ ERP System

A comprehensive, production-ready ERP system designed specifically for jewelry businesses. Built with modern web technologies, it helps streamline accounting, sales, inventory, manufacturing, customer management, reporting, and day-to-day business operations.

![Django](https://img.shields.io/badge/Django-4.2+-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)

---

## 🎯 Overview

NSJ ERP is a full-stack Enterprise Resource Planning (ERP) solution built for jewelry manufacturers, wholesalers, and retailers. It centralizes all business operations into a single platform, enabling organizations to efficiently manage finance, production, inventory, sales, customer relationships, reporting, and operational workflows.

The system is designed to improve productivity, reduce manual processes, provide real-time business insights, and support efficient decision-making across departments.

---

# 📁 Project Structure

```text
NSJ-ERP/
├── nsj-backend/
│   ├── accounts/
│   ├── core/
│   ├── products/
│   ├── rates/
│   ├── reports/
│   ├── sales_queries/
│   ├── tasks/
│   ├── users/
│   ├── vouchers/
│   └── nsj_backend/
│
└── nsj-frontend/
    ├── app/
    ├── components/
    ├── lib/
    └── public/
```
## 🤖 AI Agents

NSJ ERP includes intelligent AI agents that assist employees in managing day-to-day business operations across the organization. These AI agents help automate routine tasks, improve productivity, and provide faster access to business information.

### Key Capabilities

* **Product Management Agent** – Assists in creating, updating, searching, and organizing product information.
* **Accounting Agent** – Helps users manage vouchers, ledgers, invoices, financial transactions, and accounting records.
* **Vendor Management Agent** – Assists in finding vendor details, tracking purchases, managing supplier information, and monitoring transactions.
* **Inventory Agent** – Provides real-time stock information, material availability, and inventory tracking.
* **Sales & CRM Agent** – Helps employees manage customer inquiries, orders, quotations, and sales activities.
* **Production Agent** – Tracks manufacturing workflows, job progress, and production status.
* **Reporting Agent** – Generates business reports, summaries, and operational insights based on ERP data.

Employees can interact with these AI agents using natural language to quickly retrieve information, perform business operations, and automate repetitive tasks, improving efficiency and reducing manual effort across departments.

---

# 🚀 Features

## 📊 Accounting & Finance

* Voucher Management

  * Receipt
  * Payment
  * Journal
  * Contra

* Sales Invoice Management

* Estimate Creation

* Financial Reports

* Ledger Management

* Account Statements

* PDF Invoice Generation

---

## 💼 Sales & CRM

* Customer Management
* Sales Lead Tracking
* Sales Order Management
* Estimate to Order Conversion
* Customer History
* Follow-up Tracking

---

## 🏭 Production Management

Complete jewelry production workflow including:

* Product Design Tracking
* Metal Issue & Receive
* Gemstone Issue & Receive
* Casting Process
* Manufacturing Workflow
* Quality Inspection
* Rhodium Process
* Final Packing
* Production Status Tracking

---

## 📦 Inventory Management

* Gold Inventory
* Silver Inventory
* Raw Material Management
* Diamond & Gemstone Inventory
* Purchase Management
* Stock Verification
* Inventory Reports
* Stock Valuation

---

## 📋 Task Management

* Department-wise Task Assignment
* Employee Task Tracking
* Daily Reports
* Status Updates
* Performance Analytics
* Email Notifications

---

## 📈 Reports & Dashboard

* Dashboard Analytics
* Daily Transaction Report
* Financial Reports
* Department Reports
* Inventory Reports
* Sales Reports
* Production Reports
* Gold Rate Tracking

---

# 🛠 Technology Stack

## Backend

* Django 4.2+
* Django REST Framework
* PostgreSQL
* SQLite (Development)
* JWT Authentication
* WeasyPrint
* SMTP Email Integration
* Background Task Processing

---

## Frontend

* Next.js 14
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Hook Form
* Axios
* React Context API
* Lucide React
* Recharts

---

## Development Tools

* Git
* GitHub
* pnpm
* pip
* ESLint
* Prettier
* Black
* isort
* Pytest
* Jest
* Docker
* GitHub Actions

---

# ⚙️ Installation

## Prerequisites

* Python 3.10+
* Node.js 18+
* pnpm / npm
* PostgreSQL

---

## Backend Setup

```bash
cd nsj-backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env

python manage.py migrate

python manage.py createsuperuser

python manage.py runserver
```

Backend:

```
http://localhost:8000
```

---

## Frontend Setup

```bash
cd nsj-frontend

pnpm install

cp .env.local.example .env.local

pnpm dev
```

Frontend:

```
http://localhost:3000
```

---

# 🔐 Default Login

```text
Email:
admin@nsj.com

Password:
admin123@
```

> Change the default credentials before deploying to production.

---

# 📖 API

## Base URL

Development

```
http://localhost:8000/api/
```

Production

```
https://your-domain/api/
```

### Authentication

```http
POST /api/users/login/
POST /api/users/logout/
GET  /api/users/me/
```

### Voucher APIs

```http
GET    /api/vouchers/
POST   /api/vouchers/
GET    /api/vouchers/{id}/
PATCH  /api/vouchers/{id}/
DELETE /api/vouchers/{id}/
```

### Sales APIs

```http
GET  /api/sales-queries/
POST /api/sales-queries/
```

### Task APIs

```http
GET  /api/tasks/
POST /api/tasks/
GET  /api/tasks/stats/
```

---

# 🧪 Testing

## Backend

```bash
cd nsj-backend

pytest

pytest --cov
```

---

## Frontend

```bash
cd nsj-frontend

pnpm test

pnpm test:coverage
```

---

# 🚢 Deployment

## Backend

```bash
pip install -r requirements.txt

python manage.py collectstatic --noinput

python manage.py migrate

gunicorn nsj_backend.wsgi:application
```

---

## Frontend

```bash
pnpm install

pnpm build
```

---

# 🌍 Environment Variables

## Backend

```env
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@host:port/dbname
ALLOWED_HOSTS=your-domain.com
CORS_ALLOWED_ORIGINS=https://your-frontend.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

---

## Frontend

```env
NEXT_PUBLIC_API_URL=https://your-backend.com/api
NEXT_PUBLIC_APP_URL=https://your-frontend.com
```

---

# 📚 Documentation

* Backend Documentation
* Frontend Documentation
* API Documentation
* Deployment Guide

---


**NSJ ERP** is a complete business management solution for the jewelry industry, providing an integrated platform to manage accounting, inventory, production, sales, customer relationships, reporting, and operational workflows efficiently from a single system.
