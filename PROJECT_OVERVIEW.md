# Project Overview — meta-crm-system

說明時間：2025-11-03

這份文件簡潔說明本專案做了什麼，以及各個層（後端、前端、DB、DAO、服務）的運作與資料流，方便開發者快速理解整體架構與重點檔案。

## 一、專案簡介
meta-crm-system 是一個以活動與會員管理為核心的 CRM 範例系統。主要功能包含：
- 使用者管理（Admin / Sales / Leader / Member）
- 活動（Events）與場次（Event Sessions）管理
- 報名（Registrations）、等候名單（Waitlist）、出席（Attendance）管理
- 作業/上傳/作業繳交（Assignments & Submissions）
- 繳費（Payments）與憑證
- 公告/通知（Notices / Notifications）

技術棧：
- Backend: Node.js + Express
- Database: PostgreSQL（使用 `pg`）
- Frontend: React
- Auth: JWT (httpOnly cookie)
- 其他：Azure Blob 支援（檔案上傳）


## 二、主要目錄與重要檔案
- `backend/`
  - `server.js` — Express 主程式：註冊 router、CORS、cookie-parser、JWT 驗證 middleware、啟動前初始化資料庫。
  - `db/pool.js` — PostgreSQL 連線池與 `initDatabase()`（會讀 `resources/schema.sql` 並執行，包含 DROP/CREATE 與 seed 資料）。
  - `resources/schema.sql` — 所有資料表定義與部分 seed 資料（USERS、EVENTS 等）。
  - `dao/` — 各種資料存取物件（DAO），例如 `usersDao.js`、`eventsDao.js`、`requestsDao.js`...（負責 SQL 查詢/更新的封裝）。
  - `handleAPI/` — 各 API 群組的 Router，例如 `login.js`, `customersList.js`, `eventList.js`, `homework.js`。
  - `services/azureBlobService.js` — Azure Blob 上傳/下載輔助。

- `frontend/`
  - `src/contexts/AuthContext.jsx` — 前端登入狀態管理（恢復 session、login、logout）。
  - `src/api/*.js` — 前端 API 封裝（loginAPI.js, customersListAPI.js 等）。
  - `src/pages/`、`src/components/` — UI 頁面與元件。


## 三、認證與授權（Auth）
- 登入方式：`POST /api/login`（在 `backend/handleAPI/login.js`）。流程：
  1. 後端使用 DAO（`usersDao.findByUserId`）查使用者。
  2. 目前程式以明文字串比對密碼（注意：生產不可），比對成功後建立 JWT（`jsonwebtoken`），並以 httpOnly cookie `token` 回傳給瀏覽器。
  3. Cookie 屬性：`httpOnly: true`, `secure: (production)`, `sameSite: 'lax'`, `maxAge` 30 分鐘。
  4. 前端在之後的請求會使用 `credentials: 'include'` 將 cookie 一併送出。

- Token 驗證：`server.js` 的 `authMiddleware` 會讀 `req.cookies.token` 或 `Authorization` header，使用 `jwt.verify()` 驗證，成功後把 payload 放在 `req.user`。
- 權限檢查：路由內可檢查 `req.user.role`（例如 admin-only 路由回傳 403）。


## 四、資料層（DAO）— 責任與實作
- 目的：DAO（Data Access Object）負責把 SQL 與 DB 的細節封裝，提供高階介面給 API handler 呼叫。
- 位置：`backend/dao/`，且由 `backend/dao/index.js` 匯出集合。
- 範例（`usersDao.js`）：
  - `createUser`, `findByUserId`, `findUserByEmail`, `updateByUserId`, `removeByUserId`, `listByUsersId`。
  - 使用 `db/pool.query()`（參數化 `$1,$2`）以避免 SQL 注入。唯獨 `updateByUserId` 動態生成欄位時要小心欄位白名單。
- 使用情境：API handler 接收 request → 驗證資料 → 呼叫 DAO → DAO 回傳 DB 結果 → handler 組成 JSON 回應。


## 五、資料庫（schema 與重要表）
- 使用 PostgreSQL；連線與管理在 `backend/db/pool.js`。
- 重要資料表：`USERS`, `EVENTS`, `EVENT_SESSIONS`, `SESSION_REGISTRATIONS`, `WAITLIST`, `EVENT_ATTENDANCE`, `PAYMENTS`, `UPLOADS`, `ASSIGNMENTS`, `ASSIGNMENT_SUBMISSIONS`, `REQUESTS`, `SERVICES`, `SUBSCRIPTIONS`, `NOTICES`, `NOTIFICATIONS`, `HOLIDAYS`。
- `resources/schema.sql` 含有 DROP + CREATE + INSERT seed（注意：`initDatabase()` 每次啟動會執行 schema，會清空既有資料）。


## 六、典型資料流（範例場景）
- 登入：前端呼叫 `POST /api/login` → `login.js` 用 DAO 查 user → 驗證密碼 → 產 JWT 並以 cookie 回傳 → 前端存 user state 並導向相應頁面。
- 拿取當前用戶：前端呼叫 `GET /api/me`（帶 cookie）→ `authMiddleware` 驗證 token → 回傳 user info。
- 取得活動清單：前端呼叫 `/api/events` → 對應 router 使用 `eventsDao` 查詢 → 回傳 events JSON。
- 上傳檔案：前端傳檔到後端 → 後端上傳到 Azure Blob（`azureBlobService`）→ 得到 URL 並寫入 `UPLOADS` table → 回傳上傳結果。


## 七、目前已知問題與安全建議（必讀）
1. 密碼目前以明文儲存與比對（`users.password` 與 `login.js` 的比對）。生產環境必須改為使用 bcrypt 或 argon2 雜湊。
2. JWT secret 預設為 `dev-secret-local`，務必在生產以強 secret 設定環境變數 `JWT_SECRET`。
3. `initDatabase()` 在啟動時執行 `schema.sql`（包含 DROP），這會在 production 刪除資料。建議僅在開發環境執行，或改用 migration 工具（例如 `node-pg-migrate` / `knex`）。
4. `updateByUserId` 動態組欄位，務必對欄位名稱做白名單檢查。
5. 考慮加入 Refresh Token 或 Session 機制以提升使用者體驗（目前 access token 30 分鐘）。


## 八、如何在本機執行（簡短步驟）
1. 後端
```bash
cd backend
npm install
# 設定環境變數，至少：JWT_SECRET、DB_*（DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD）
node server.js
```
2. 前端
```bash
cd frontend
npm install
npm start
```
3. 測試登入（開發方便測試，可使用 schema.sql 中的 seed user）
- 範例 user_id: `50003`，password: `password`（請注意 username 目前只允許數字格式檢查）


## 九、建議的後續工作（優先順序）
- 優先：將密碼改為雜湊儲存（bcrypt），並更新 `createUser` 與 `login` 的流程。
- 優先：把 `initDatabase()` 僅限於 dev 環境，並導入 migration 機制。
- 中期：實作 Refresh Token 與更完整的 token lifecycle 管理。
- 中期：加入單元測試與 API 測試（針對 DAO 與 handler）。
- 長期：加入 structured logging、監控、Sentry 或相似錯誤追蹤。


---
檔案位置：`PROJECT_OVERVIEW.md`（專案根目錄）

如需我把這份文件放到 `docs/` 或 README 裡，或要我直接實作「將密碼改為 bcrypt 並補上測試」的修改，我可以在下一步執行（會更新 todo 並做程式修改與本地測試）。