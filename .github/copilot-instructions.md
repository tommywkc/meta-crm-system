# Copilot Instructions for meta-crm-system

## System Architecture & "Big Picture"
- **Monorepo Structure**: Distinct `backend` (Node/Express) and `frontend` (React) projects.
  - **Backend**: Listens on port `4000` (default). Manages DB, Azure Blob, and WhatsApp Webhooks.
  - **Frontend**: Runs on port `3000` (default). Consumes backend APIs via `frontend/src/api/*`.
- **Boundaries**:
  - `backend/handleAPI/` routes handle HTTP logic => call `backend/dao/` for SQL => return JSON.
  - `frontend/src/api/` wraps `fetch` calls => used by React components/pages.

## Critical Developer Workflows
- **Setup & Run**:
  - **Backend**: `cd backend && npm install && npm start`.
  - **Frontend**: `cd frontend && npm install && npm start`.
- **Configuration**:
  - Backend requires `backend/.env` (derived from `simple.env`).
  - Frontend uses `REACT_APP_API_BASE_URL` (defaults to `http://localhost:4000`).
- **Scripts**:
  - `npm run import:holidays` (in `backend/`): Run this periodically to update holiday data.

## Project-Specific patterns
### Backend (Node.js/Express)
- **Routing**: Routes are explicitly required and mounted in `server.js` (e.g., `app.use('/api', loginRouter)`).
- **Authentication**:
  - Uses **HTTP-only Cookies** for JWTs.
  - CORS must be configured with `credentials: true` and specific origin (not `*`).
- **Webhooks**:
  - WhatsApp webhook is at `/webhook/whatsapp` (NOT `/api/...`).
  - **Critical**: `verifier` middleware in `server.js` captures `req.rawBody` for `X-Hub-Signature-256` verification. **Do not remove `req.rawBody` logic.**
- **Database**:
  - Uses `pg` pool from `backend/db/pool.js`.
  - Pattern: One DAO file per entity (e.g., `usersDao.js`) exporting async functions.

### Frontend (React)
- **API Layer**:
  - **Always** use helper functions in `frontend/src/api/`. Do not use `fetch` directly in components.
  - Requests must include `credentials: 'include'` to send auth cookies (handled in `loginAPI.js` example).
- **State Management**:
  - `AuthContext.jsx` manages user session. Use `useAuth()` hook for access control.
- **Navigation**:
  - Role-based routing strategy in `App.js` (Admin/Sales/Member paths).

## External Integrations
- **Azure Blob Storage**: Used for file uploads. See `backend/services/azureBlobService.js`.
- **WhatsApp Cloud API**: 
  - Complex logic resides in `backend/handleAPI/whatsapp/` (handler, sender, state, templates).
  - Integration relies on `backend/handleAPI/whatsappWebhook.js`.

## Deployment
- **GitHub Actions**: Deploys to Azure Web Apps.
- **Environment**: Production uses `process.env.PORT`. Frontend uses `normalizeBaseUrl` to handle protocol mismatches.
