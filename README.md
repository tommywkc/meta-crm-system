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

### Option 1: Clone from GitHub
```bash
# Clone the repository
git clone https://github.com/tommywkc/meta-crm-system.git

# Navigate to the project directory
cd meta-crm-system
```

### Option 2: Download ZIP
1. Go to [https://github.com/tommywkc/meta-crm-system](https://github.com/tommywkc/meta-crm-system)
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the downloaded file
5. Open terminal and navigate to the extracted folder

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

### 2) Start backend

Execute in backend folder:

```bash
cd meta-crm-system/backend
npm start
# Default listening: http://localhost:4000
```

### 3) Start frontend

Execute in frontend folder:

```bash
cd meta-crm-system/frontend
npm start
# React dev server default: http://localhost:3000
```

Open browser and go to http://localhost:3000

## Built-in test accounts (can login directly)
- member / password
- sales  / password
- admin  / adminpass

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

## Troubleshooting

### Common Issues

**1. Permission denied errors when running npm commands:**
```bash
# Fix npm cache permissions
sudo chown -R $(whoami) ~/.npm

# Or use a different cache directory
npm install --cache /tmp/.npm
```

**2. bcrypt installation issues on macOS:**
- The project has been configured to work without bcrypt for development
- If you encounter bcrypt errors, try rebuilding:
```bash
npm rebuild bcrypt
```

**3. Node.js not found:**
```bash
# Check if Node.js is installed
node --version

# If not installed, download from https://nodejs.org/
# Or install via Homebrew:
brew install node
```

**4. Port already in use:**
- Backend (port 4000): Kill the process using `lsof -ti:4000 | xargs kill -9`
- Frontend (port 3000): Kill the process using `lsof -ti:3000 | xargs kill -9`
