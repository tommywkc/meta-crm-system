# 認證與授權系統文檔

## 📋 目錄
1. [系統架構概述](#系統架構概述)
2. [技術棧](#技術棧)
3. [登入流程](#登入流程)
4. [JWT Token 實現](#jwt-token-實現)
5. [角色權限控制](#角色權限控制)
6. [API 權限配置](#api-權限配置)
7. [前後端實現細節](#前後端實現細節)
8. [安全考慮](#安全考慮)

---

## 系統架構概述

本系統採用 **JWT (JSON Web Token) + 基於角色的訪問控制 (RBAC)** 架構。

```
┌─────────────────────────────────────────────────────────────┐
│                    用戶瀏覽器 (Frontend)                      │
│  React + AuthContext + Protected Routes                     │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP 請求 + Cookie (JWT Token)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js 後端服務器                       │
│  ├─ authMiddleware (驗證 JWT Token)                         │
│  ├─ roleMiddleware (檢查角色權限)                            │
│  └─ API Routes (受保護的端點)                               │
└──────────────────┬──────────────────────────────────────────┘
                   │ 
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL 數據庫                          │
│  USERS 表 (包含 user_id, password, role, 等)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 技術棧

### Frontend
- **React 18+** - UI 框架
- **React Context API** - 全局認證狀態管理
- **React Router v6** - 路由和受保護路由
- **Fetch API** - HTTP 請求

### Backend
- **Express.js** - Web 框架
- **jsonwebtoken** - JWT 簽名和驗證
- **cookie-parser** - 解析 HTTP Cookie
- **CORS** - 跨源資源共享
- **dotenv** - 環境變量管理

### 數據庫
- **PostgreSQL** - 用戶數據存儲

---

## 登入流程

### 完整流程圖

```
用戶在登入頁面輸入
    │
    ▼
┌─────────────────────────────────────────────┐
│ 前端: handleLogin()                         │
│ 1. 收集用戶名和密碼                         │
│ 2. 調用 authLogin() (AuthContext)           │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ AuthContext: login()                        │
│ POST /api/login {username, password}        │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 後端: POST /api/login                       │
│ 1. 驗證用戶名 (只能是數字)                  │
│ 2. 查詢數據庫中的用戶                       │
│ 3. 驗證密碼 (現在是明文比對，未來需改進)   │
│ 4. 如果成功:                                │
│    - 生成 JWT Token                         │
│    - 設置 HttpOnly Cookie                   │
│    - 返回用戶信息                           │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 前端: handleLogin() 重定向                  │
│ 根據角色 (role) 跳轉到:                     │
│ - admin → /admin                            │
│ - sales/leader → /sales                     │
│ - member → /member                          │
└─────────────────────────────────────────────┘
```

### 代碼流程示例

**1. 用戶在登入頁提交表單**
```jsx
// frontend/src/pages/shared/LoginPage.jsx
const handleLoginClick = () => {
  handleLogin(null, { 
    username, 
    password, 
    navigate, 
    setError, 
    authLogin 
  });
};
```

**2. 調用 handleLogin**
```javascript
// frontend/src/api/loginAPI.js
export async function handleLogin(e, { username, password, navigate, setError, authLogin }) {
  try {
    const payload = await authLogin(username, password);
    const user = payload.user || payload;
    const role = (user.role || '').toLowerCase();
    
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'sales' || role === 'leader') {
      navigate('/sales');
    } else {
      navigate('/member');
    }
  } catch (err) {
    setError(err.message || 'Login failed');
  }
}
```

**3. AuthContext 進行認證**
```javascript
// frontend/src/contexts/AuthContext.jsx
const login = async (username, password) => {
  const res = await fetch('http://localhost:4000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // 包含 Cookie
    body: JSON.stringify({ username, password })
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(err.message || 'Login failed');
  }
  
  const data = await res.json();
  const userData = data.user || data;
  setUser(userData);  // 更新全局狀態
  return data;
};
```

**4. 後端驗證和簽發 Token**
```javascript
// backend/handleAPI/login.js
router.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // 驗證用戶名格式 (只能是數字)
  if (/\D/.test(username)) {
    return res.status(400).json({ message: '使用者名稱只能包含數字' });
  }
  
  // 從數據庫查詢用戶
  const user = await findByUserId(username);
  
  // 驗證密碼 (明文比對 - 不安全!)
  if (!user || user.password !== password) {
    return res.status(401).json({ message: '使用者名稱或密碼錯誤' });
  }
  
  // 生成 JWT Token
  const payload = {
    sub: user.user_id,           // Subject (用戶 ID)
    username: user.email || username,
    role: user.role || 'member'
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30m' });
  
  // 設置 Cookie (HttpOnly, Secure, SameSite)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? true : false,
    sameSite: 'lax',
    maxAge: 30 * 60 * 1000  // 30 分鐘
  });
  
  // 返回用戶信息 (不包含密碼)
  const { password: _p, ...safe } = user;
  return res.json({ 
    user: { 
      id: safe.user_id, 
      name: safe.name, 
      role: safe.role, 
      username: safe.email || username 
    } 
  });
});
```

---

## JWT Token 實現

### Token 結構

JWT Token 由三部分組成，用點 (`.`) 分隔：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiI1MDAwMCIsInVzZXJuYW1lIjoibWVtYmVyQGV4YW1wbGUuY29tIiwicm9sZSI6Im1lbWJlciIsImlhdCI6MTczMTQzNjAwMCwiZXhwIjoxNzMxNDM3ODAwfQ.
signature...
```

**Header (第 1 部分):**
```json
{
  "alg": "HS256",  // 使用 HMAC SHA256 算法
  "typ": "JWT"
}
```

**Payload (第 2 部分):**
```json
{
  "sub": "50000",              // 用戶 ID
  "username": "member@example.com",
  "role": "member",            // 用戶角色
  "iat": 1731436000,          // 簽發時間
  "exp": 1731437800           // 過期時間 (30 分鐘後)
}
```

**Signature (第 3 部分):**
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

### Token 生命週期

```
┌──────────────────────────────────────────────┐
│ 1. 登入時生成 Token (30 分鐘有效期)           │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ 2. 存儲在 HttpOnly Cookie 中                  │
│    自動隨每個請求發送到後端                   │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ 3. 後端驗證 Token 有效性                      │
│    - 檢查簽名 (確保未被篡改)                  │
│    - 檢查過期時間                            │
│    - 提取用戶信息                            │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ 4. 過期後用戶需要重新登入                     │
│    (暫無刷新 Token 機制)                     │
└──────────────────────────────────────────────┘
```

### 配置

```javascript
// backend/middleware/auth.js
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-local';
const ACCESS_EXPIRES = '30m';
```

**環境變量** (`.env`):
```
JWT_SECRET=your-super-secret-key-here
NODE_ENV=development
```

### Token 驗證實現

```javascript
// backend/middleware/auth.js
function authMiddleware(req, res, next) {
  // 嘗試從 Cookie 或 Authorization Header 獲取 Token
  const token = req.cookies.token || 
                (req.headers.authorization && 
                 req.headers.authorization.split(' ')[1]);
  
  if (!token) {
    return res.status(401).json({ message: '未認證 (Not authenticated)' });
  }
  
  try {
    // 驗證並解碼 Token
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;  // payload = { sub, username, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: '無效的 token (Invalid token)' });
  }
}
```

---

## 角色權限控制

### 支持的角色

系統支持 4 種角色，每種角色有不同的權限：

| 角色 | 代碼 | 描述 | 權限 |
|------|------|------|------|
| **管理員** | `admin` | 系統管理員 | 完全訪問所有功能 |
| **銷售** | `sales` | 銷售代表 | 查看客戶、事件、KPI |
| **領導** | `leader` | 團隊領導 | 同銷售 + 管理權限 |
| **成員** | `member` | 普通成員 | 查看事件、提交作業、查看收據 |

### Role-based Middleware 實現

```javascript
// backend/middleware/auth.js
function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '未認證' });
    }
    
    // 轉換為數組以支持單個或多個角色
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // Case-insensitive 角色比較
    const userRole = (req.user.role || '').toLowerCase();
    const hasPermission = rolesArray.some(role => role.toLowerCase() === userRole);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        message: '禁止存取 (Forbidden)',
        requiredRoles: rolesArray,
        userRole: req.user.role
      });
    }
    
    next();
  };
}
```

### 使用方式

```javascript
// 單個角色檢查
router.delete('/customers/:id', 
  authMiddleware, 
  roleMiddleware('admin'),
  handler
);

// 多個角色檢查
router.get('/events', 
  authMiddleware, 
  roleMiddleware(['admin', 'sales', 'leader', 'member']),
  handler
);
```

---

## API 權限配置

### 客戶管理 API

```
GET  /customers              ✓ admin, sales, leader   查看客戶列表
GET  /customers/:id          ✓ admin, sales, leader   查看客戶詳情
GET  /customers/:id/edit     ✓ admin                  編輯客戶表單
PUT  /customers/:id          ✓ admin                  更新客戶信息
POST /customers              ✓ admin                  新增客戶
DELETE /customers/:id        ✓ admin                  刪除客戶
GET  /customers/myqrcode     ✓ 已認證 (自己的 QR)    查看自己的 QR code
```

### 事件管理 API

```
GET  /events                 ✓ admin, sales, leader, member   查看事件列表
GET  /events/:id             ✓ admin, sales, leader, member   查看事件詳情
POST /events                 ✓ admin                          新增事件
PUT  /events/:id             ✓ admin                          更新事件
DELETE /events/:id           ✓ admin                          刪除事件
```

### 作業管理 API

```
GET  /homework/upload        ✓ member                 查看作業上傳
POST /homework/upload        ✓ member                 上傳作業文件
GET  /homework/files         ✓ member                 查看自己的作業
DELETE /homework/file/:name  ✓ member                 刪除自己的作業
GET  /homework/files/admin/all ✓ admin                查看所有作業
```

### 登出 API

```
POST /api/logout             ✓ 公開                   清除 Cookie
GET  /api/me                 ✓ 已認證                 獲取當前用戶信息
```

---

## 前後端實現細節

### Frontend 實現

#### 1. AuthContext (全局認證狀態)

```javascript
// frontend/src/contexts/AuthContext.jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初始化：嘗試從 /api/me 恢復會話
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('http://localhost:4000/api/me', {
          credentials: 'include'  // 發送 Cookie
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);  // 設置當前用戶
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, []);

  // 登入方法
  const login = async (username, password) => {
    const res = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    const userData = data.user || data;
    setUser(userData);
    return data;
  };

  // 登出方法
  const logout = async () => {
    try {
      await fetch('http://localhost:4000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      // 忽略
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### 2. ProtectedRoute (路由保護)

```javascript
// frontend/src/App.js
const ProtectedRoute = ({ children, allowedRole, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  // 支持單個角色或角色陣列
  if (allowedRole && user.role?.toLowerCase() !== allowedRole.toLowerCase()) {
    return <Navigate to="/login" />;
  }
  if (Array.isArray(allowedRoles) && !allowedRoles.some(role => 
    role.toLowerCase() === user.role?.toLowerCase())) {
    return <Navigate to="/login" />;
  }

  return children;
};

// 使用示例
<Route path="/admin" element={
  <ProtectedRoute allowedRole="admin">
    <AdminPage />
  </ProtectedRoute>
} />

<Route path="/events" element={
  <ProtectedRoute allowedRoles={["admin", "sales", "leader", "member"]}>
    <EventList />
  </ProtectedRoute>
} />
```

### Backend 實現

#### 1. Middleware 文件

```javascript
// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-local';

function authMiddleware(req, res, next) {
  const token = req.cookies.token || 
                (req.headers.authorization && 
                 req.headers.authorization.split(' ')[1]);
  
  if (!token) {
    return res.status(401).json({ message: '未認證' });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: '無效的 token' });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '未認證' });
    }
    
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRole = (req.user.role || '').toLowerCase();
    const hasPermission = rolesArray.some(role => 
      role.toLowerCase() === userRole);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        message: '禁止存取',
        requiredRoles: rolesArray,
        userRole: req.user.role
      });
    }
    
    next();
  };
}

module.exports = {
  authMiddleware,
  roleMiddleware
};
```

#### 2. 在路由中使用 Middleware

```javascript
// backend/handleAPI/customersList.js
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// 獲取客戶列表 - 需要認證並擁有特定角色
router.get('/customers', 
  authMiddleware, 
  roleMiddleware(['admin', 'sales', 'leader']), 
  async (req, res) => {
    try {
      const customers = await listByUsersId();
      res.json({ customers });
    } catch (error) {
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
);

// 創建客戶 - 僅允許 admin
router.post('/customers', 
  authMiddleware, 
  roleMiddleware('admin'), 
  async (req, res) => {
    try {
      const newCustomer = await createUser(req.body);
      res.status(201).json({
        message: '客戶新增成功',
        newId: newCustomer.user_id
      });
    } catch (error) {
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
);
```

---

## 安全考慮

### ✅ 已實現

1. **HttpOnly Cookie**
   - Token 存儲在 HttpOnly Cookie 中
   - 防止 JavaScript XSS 攻擊訪問 Token
   ```javascript
   res.cookie('token', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax'
   });
   ```

2. **CORS 設置**
   - 限制只有 `http://localhost:3000` 可以訪問
   ```javascript
   app.use(cors({ 
     origin: 'http://localhost:3000', 
     credentials: true
   }));
   ```

3. **Token 過期**
   - Token 30 分鐘後過期
   - 過期後需要重新登入

4. **Role-based Access Control**
   - 所有 API 都檢查用戶角色
   - 未授權訪問返回 403 Forbidden

5. **Case-insensitive 角色比較**
   - 防止角色大小寫不匹配導致的權限繞過

### ⚠️ 需要改進

1. **密碼加密** (P0 - 重要)
   ```bash
   npm install bcrypt
   ```
   現在密碼是明文存儲和比對，需要改為使用 bcrypt：
   ```javascript
   // 存儲時
   const hashedPassword = await bcrypt.hash(password, 10);
   
   // 驗證時
   const isValid = await bcrypt.compare(password, user.password);
   ```

2. **Token 刷新機制**
   - 實現 Refresh Token 以延長會話
   - 缺少舊 Token 刷新的機制

3. **速率限制**
   - 防止暴力破解登入
   ```bash
   npm install express-rate-limit
   ```

4. **HTTPS 生產環境**
   - 確保所有生產環境連接都使用 HTTPS
   - Cookie 應設置 `secure: true`

5. **審計日誌**
   - 記錄所有認證和授權事件
   - 便於安全審計

6. **會話超時**
   - 實現自動登出機制
   - 防止無人值守機器的權限濫用

---

## 測試用戶

系統預設提供以下測試用戶（密碼都是 `password`）：

| User ID | 密碼 | 角色 | 用途 |
|---------|------|------|------|
| 50000 | password | admin | 系統管理員 |
| 50001 | password | sales | 銷售代表 |
| 50002 | password | leader | 團隊領導 |
| 50003 | password | member | 普通成員 |

### 測試流程

1. **登入**
   ```
   用戶名: 50000
   密碼: password
   ```

2. **驗證權限**
   - 嘗試訪問不同角色的頁面
   - 確認 403 錯誤出現在未授權的訪問上

3. **驗證 Token 有效性**
   - 等待 30 分鐘或手動修改 Token
   - 確認會獲得 401 未認證錯誤

---

## 目錄結構

```
meta-crm-system/
├── backend/
│   ├── middleware/
│   │   └── auth.js              ← 認證和授權 middleware
│   ├── handleAPI/
│   │   ├── login.js             ← 登入端點
│   │   ├── customersList.js     ← 客戶 API (受保護)
│   │   ├── eventList.js         ← 事件 API (受保護)
│   │   └── homework.js          ← 作業 API (受保護)
│   ├── dao/
│   │   └── usersDao.js          ← 用戶數據訪問層
│   ├── server.js                ← Express 應用主文件
│   └── db/
│       └── pool.js              ← PostgreSQL 連接池
│
└── frontend/
    └── src/
        ├── contexts/
        │   └── AuthContext.jsx  ← 全局認證狀態
        ├── pages/
        │   ├── shared/
        │   │   └── LoginPage.jsx ← 登入頁面
        │   ├── admin/
        │   │   └── Page.jsx     ← 管理員頁面 (受保護)
        │   ├── sales/
        │   │   └── Page.jsx     ← 銷售頁面 (受保護)
        │   └── member/
        │       └── Page.jsx     ← 成員頁面 (受保護)
        ├── api/
        │   └── loginAPI.js      ← 登入 API 調用
        └── App.js               ← ProtectedRoute 實現
```

---

## 流程圖總結

### 認證流程
```
用戶登入 → 發送憑證 → 後端驗證 → 生成 JWT Token
         ↓
    設置 Cookie (HttpOnly)
         ↓
    返回用戶信息
         ↓
前端保存狀態 (AuthContext)
         ↓
    重定向到根據角色的頁面
```

### 授權流程
```
用戶訪問受保護路由
         ↓
ProtectedRoute 檢查用戶登入狀態
         ↓
檢查用戶角色是否有權限
         ↓
有權限 → 顯示頁面
無權限 → 重定向到登入頁
         ↓
API 請求時再次檢查
         ↓
有效 Token + 合適角色 → 返回數據
無效 Token → 401 Unauthorized
無合適角色 → 403 Forbidden
```

---

## 常見問題

### Q1: Token 過期後怎麼辦？
A: 用戶會獲得 401 Unauthorized 錯誤，需要重新登入。未來可以實現 Refresh Token 機制。

### Q2: 如何添加新角色？
A: 
1. 在 USERS 表中添加新角色值
2. 在 Frontend 的 `handleLogin` 中添加路由邏輯
3. 在 API 的 `roleMiddleware` 中配置權限

### Q3: 如何驗證當前用戶？
A: 
- Frontend: `const { user } = useAuth()`
- Backend: `req.user` (在 authMiddleware 後)

### Q4: Cookie 是否安全？
A: 是的，使用 HttpOnly 防止 XSS 攻擊，但密碼加密是下一步重要改進。

---

## 參考資源

- [JWT 官方文檔](https://jwt.io/)
- [Express.js 中間件指南](https://expressjs.com/en/guide/using-middleware.html)
- [React Context API](https://react.dev/reference/react/useContext)
- [OWASP 認證備忘單](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

