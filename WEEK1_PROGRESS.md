# FYP — 第1週進度報告

日期：2025-11-03

專案：meta-crm-system

負責人：Ching

---

## 一句摘要

第1週完成專案架構檢視與基礎骨幹整理，包含後端 DAO 與部分 API 處理器、資料庫連線設定、以及前端主要頁面和元件的初步骨架（UI/路由結構）。已把目前狀態整理成可供指導老師審閱的進度報告。

## 本週完成重點

- 建置並整理後端目錄結構（`backend/`）：包含 `server.js`、`package.json` 與環境設定範例 `simple.env`。
- 實作資料庫連線池：`db/pool.js` 與資料庫 schema (`resources/schema.sql`) 已放置於專案。
- 完成多個 DAO（資料存取層）檔案：
  - `backend/dao/assignmentsDao.js`
  - `backend/dao/assignmentSubmissionsDao.js`
  - `backend/dao/eventAttendanceDao.js`
  - `backend/dao/eventEnrollmentsDao.js`
  - `backend/dao/eventsDao.js`
  - `backend/dao/eventSessionsDao.js`
  - `backend/dao/holidaysDao.js`
  - `backend/dao/noticesDao.js`
  - `backend/dao/notificationsDao.js`
  - `backend/dao/paymentsDao.js`
  - `backend/dao/requestsDao.js`
  - `backend/dao/servicesDao.js`
  - `backend/dao/sessionRegistrationsDao.js`
  - `backend/dao/subscriptionsDao.js`
  - `backend/dao/uploadsDao.js`
  - `backend/dao/usersDao.js`
  - `backend/dao/waitlistDao.js`
- 新增後端功能模組：
  - `function/dataSanitizer.js`, `function/dateFormatter.js`（工具函式）
  - `handleAPI/` 裡的多個 API 處理器：`login.js`, `customersList.js`, `eventList.js`, `homework.js`。
  - `services/azureBlobService.js`（整合 Azure Blob 的上傳服務介面，方便未來上傳檔案）
- 前端骨幹（`frontend/src/`）建立：
  - 主要頁面與路由（`pages/` 下的 admin、member、sales、shared）
  - 主要元件：`Header.jsx`, `CustomersTable.jsx`, `EventsTable.jsx`, `CustomerForm.jsx`, `EventForm.jsx`, `Calendar.jsx` 等
  - `AuthContext.jsx` 已存在以供後續登入狀態管理

## 已實作 / 可立即檢視的功能

- 後端：基本 API 處理器（登入、顧客列表、活動列表、作業相關 handler）已存在於 `backend/handleAPI/`，可用作串接測試。
- 前端：頁面與表格元件的 UI 骨架已完成，能快速用假資料或後端 API 做串接測試。

## 重要檔案一覽（含用途）

- `server.js`（後端伺服啟動點）
- `backend/package.json`（後端相依與啟動 script）
- `backend/simple.env`（環境變數範例）
- `db/pool.js`（DB 連線池）
- `resources/schema.sql`（資料庫 schema）
- `backend/dao/*.js`（DAO：資料存取層）
- `backend/handleAPI/*.js`（API 處理器）
- `services/azureBlobService.js`（檔案上傳服務介面）
- `frontend/src/*`（React 前端程式碼：元件、頁面、context 等）

## 如何在本地快速啟動（開發環境）

注意：以下為一般開發啟動指引，請先依 `backend/simple.env` 填入資料庫與第三方（Azure 等）設定值。

在 macOS (zsh) 下的範例指令：

```bash
# 後端
cd backend
npm install
# 若 package.json 有 start 或 dev script，使用對應指令；否則可直接
node server.js

# 另開一個終端機啟動前端
cd frontend
npm install
npm start
```

## 尚未完成但建議優先處理的項目（下一步）

1. 身分驗證與 session/token 完整串接（後端與 `AuthContext` 整合）
2. 表單驗證與後端 input sanitize（避免 SQL injection、XSS）
3. 檔案上傳完整流程（前端上傳組件 → 後端接收 → 上傳至 Azure Blob）
4. 單元測試與整合測試（DAO 層與 API 層）
5. CI / CD 與部署規劃（優先考慮 Azure，並設置 secrets/環境變數管理）

## 風險與阻礙

- 需要有效的資料庫連線資訊（host / user / password / DB）與 Azure 帳戶/權限才能完成上傳整合。
- 若要進行自動化測試或 CI，需要補上測試資料與範例環境設定。

## 時程建議（下週目標）

- 2 天：完成登入與授權（JWT 或 session）之前後端整合。
- 3 天：完成檔案上傳端對端（含 Azure Blob）與前端上傳 UX。
- 2 天：補上 10~15 個單元測試（DAO + API happy path）並在本地跑綠。

---

如需我將此檔案 commit 並建立一個分支（或 push 到遠端），我可以代為產生 commit 與分支建議步驟，或直接幫你建立 PR（需你授權我執行 push/PR）。

如果要我把報告改成 PDF、或把內容縮短成 1 頁摘要給指導老師，告訴我要的格式與長度，我會繼續修改。
