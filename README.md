# meta-academy-crm — Local Development and Testing Guide

## Brief Description
- This project contains frontend and backend examples:
  - `frontend`: React single-page application (dev server at http://localhost:3000)
  - `backend`: Minimal Express server (provides /api/login, /api/me, /api/logout, default http://localhost:4000)



## Prerequisites
- Node.js (recommended v18+)
- npm (comes with Node) or yarn
- Git

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

### 2) Environment Configuration

Copy the environment template and configure your settings:

```bash
# Navigate to backend folder
cd meta-crm-system/backend

# Copy the template file
cp simple.env .env

# Edit .env with your actual configuration
nano .env  # or use your preferred editor
```

**Required Environment Variables:**
- `PORT`: Server port (default: 4000)
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `AZURE_STORAGE_CONNECTION_STRING`: Azure Blob Storage connection string

### 3) Setup Database
Download PostgreSQL & Docker Desktop first
```bash
===Database Configuration===
Username: postgres
Password: postgres
Port: 5432
Database Name: meta_academy_crm
```


### 4) Start backend

Execute in backend folder:

```bash
cd meta-crm-system/backend
npm start
# Default listening: http://localhost:4000
```

### 5) Start frontend

Execute in frontend folder:

```bash
cd meta-crm-system/frontend
npm start
# React dev server default: http://localhost:3000
```

Open browser and go to http://localhost:3000

## Environment Configuration Details

### Setting up .env file

1. **Copy the template:**
   ```bash
   cp backend/simple.env backend/.env
   ```

2. **Configure your settings:**
   Edit `backend/.env` with your actual values:
   
   ```env
   # Server Configuration
   PORT=4000
   NODE_ENV=development
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=meta_academy_crm
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   
   # JWT Configuration
   JWT_SECRET=your_secure_random_string
   
   # Azure Storage Configuration (for file uploads)
   AZURE_STORAGE_CONNECTION_STRING=your_azure_connection_string
   ```

3. **Security Note:**
   - Never commit `.env` files to version control
   - Use `simple.env` as a template only
   - Generate strong, unique values for production




