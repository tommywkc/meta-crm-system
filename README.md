# meta-academy-crm — Local Development and Testing Guide

## Brief Description
- This project contains frontend and backend examples:
  - `frontend`: React single-page application (dev server at http://localhost:3000)
  - `backend`: Minimal Express server (provides /api/login, /api/me, /api/logout, default http://localhost:4000)



## Prerequisites
- Node.js (recommended v18+)
- npm (comes with Node) or yarn
- Git (if cloning)

## Getting Started

## Clone from GitHub
```bash
# Clone the repository
git clone https://github.com/tommywkc/meta-crm-system.git

# Navigate to the project directory
cd meta-crm-system
```



## Quick Start (macOS / zsh example)

### 1) Install dependencies

Execute in two different terminals:

```bash
# Backend
cd meta-crm-system/backend
npm install

# Frontend  
cd meta-crm-system/frontend
npm install
```

### 2) Setup Database
Download PostgreSQL & Docker Desktop first
```bash
===Database Configuration===
Username: postgres
Password: postgres
Port: 5432
Database Name: meta_academy_crm
```


### 3) Start backend

Execute in backend folder:

```bash
cd meta-crm-system/backend
npm start
# Default listening: http://localhost:4000
```

### 4) Start frontend

Execute in frontend folder:

```bash
cd meta-crm-system/frontend
npm start
# React dev server default: http://localhost:3000
```

Open browser and go to http://localhost:3000


## Important routes (commonly used in development)
- `/login`: Login page
- `/member`: Member homepage (member role)
- `/admin`: Admin homepage (admin role)
- `/sales`: Sales homepage (sales role)
- `/customers`: Customer list (admin / sales)
- `/notifications`: Notification center (visible to admin/sales/member)

## Key file descriptions
- Frontend (`frontend/src`)
  - `App.js`: Routing and `ProtectedRoute` (requests `AuthContext` to determine role)
  - `contexts/AuthContext.jsx`: Handles communication with backend `/api/me`, `/api/login`, `/api/logout` and manages user state
  - `pages/`: Pages categorized by role (`admin/`, `member/`, `sales/`, `shared/`)
  - `components/`: Shared components (Header, table components, etc.)

- Backend (`backend`)
  - `server.js`: Simple Express server; uses cookie (httpOnly) to save token by default and implements `authMiddleware`

