# Copilot Instructions for meta-crm-system

## Project Overview
- **Monorepo** with two main apps:
  - `backend/`: Node.js Express API server (default: http://localhost:4000)
  - `frontend/`: React SPA (default: http://localhost:3000)
- Backend connects to PostgreSQL and Azure Blob Storage.
- Frontend communicates with backend via REST API endpoints under `/api/*`.

## Key Workflows
- **Install dependencies:**
  - `cd backend && npm install`
  - `cd frontend && npm install`
- **Start development servers:**
  - Backend: `npm start` in `backend/`
  - Frontend: `npm start` in `frontend/`
- **Environment setup:**
  - Copy `backend/simple.env` to `backend/.env` and fill in required values (see `README.md`).
- **Database:**
  - Uses PostgreSQL (default user/pass: `postgres`/`postgres`, db: `meta_academy_crm`).
  - Schema in `backend/resources/schema.sql`.
- **Azure Integration:**
  - File uploads use Azure Blob Storage (see `AZURE_STORAGE_CONNECTION_STRING`).
  - GitHub Actions deploy to Azure Web Apps (see `.github/workflows/`).

## Backend Structure
- **API routes:** `backend/handleAPI/`
- **Data access:** `backend/dao/` (one DAO per entity, e.g., `usersDao.js`)
- **DB pool:** `backend/db/pool.js`
- **Middleware:** `backend/middleware/`
- **Azure/file logic:** `backend/services/`
- **Scripts:** `backend/scripts/` (e.g., import holidays)

## Frontend Structure
- **API calls:** `frontend/src/api/`
- **Components:** `frontend/src/components/`
- **Pages:** `frontend/src/pages/` (by user role: `admin/`, `member/`, `sales/`)
- **Context:** `frontend/src/contexts/`
- **Styles:** `frontend/src/styles/`
- **Utils:** `frontend/src/utils/`

## Conventions & Patterns
- **Backend:**
  - Each API route has a corresponding DAO for DB access.
  - Use async/await for all DB and API logic.
  - Environment variables are required for DB and Azure config.
- **Frontend:**
  - Use React Context for auth state (`AuthContext.jsx`).
  - API base URL is set via `REACT_APP_API_BASE_URL`.
  - Organize UI by user role in `pages/`.

## Testing & Debugging
- **Frontend:**
  - Run `npm test` in `frontend/` (Jest, React Testing Library).
- **Backend:**
  - No formal test suite; test via API calls (e.g., Postman) or frontend.

## Deployment
- **CI/CD:**
  - GitHub Actions auto-deploy on push to `main` (see `.github/workflows/`).
  - Set required secrets/variables in GitHub repo settings (see `README.md`).

## Examples
- To add a new API:
  1. Create a DAO in `backend/dao/`.
  2. Add a handler in `backend/handleAPI/`.
  3. Wire up the route in `backend/server.js`.
  4. Add frontend API call in `frontend/src/api/` and UI in `components/` or `pages/`.

- To add a new DB table:
  1. Update `backend/resources/schema.sql`.
  2. Create a new DAO.
  3. Add API and UI as above.

---

For more, see the root `README.md` and code comments in each directory.
