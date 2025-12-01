DROP TABLE IF EXISTS SUBSCRIPTIONS;
DROP TABLE IF EXISTS SERVICES;
DROP TABLE IF EXISTS REQUESTS;
DROP TABLE IF EXISTS ASSIGNMENT_SUBMISSIONS;
DROP TABLE IF EXISTS ASSIGNMENTS;
DROP TABLE IF EXISTS UPLOADS;
DROP TABLE IF EXISTS PAYMENTS;
DROP TABLE IF EXISTS EVENT_ATTENDANCE;
DROP TABLE IF EXISTS WAITLIST;
DROP TABLE IF EXISTS SESSION_REGISTRATIONS;
DROP TABLE IF EXISTS EVENT_SESSIONS;
DROP TABLE IF EXISTS EVENT_ENROLLMENTS;
DROP TABLE IF EXISTS EVENTS;
DROP TABLE IF EXISTS NOTIFICATIONS;
DROP TABLE IF EXISTS NOTICES;
DROP TABLE IF EXISTS HOLIDAYS;
DROP TABLE IF EXISTS USERS;
DROP SEQUENCE IF EXISTS user_id_seq;
DROP SEQUENCE IF EXISTS event_id_seq;


CREATE TABLE IF NOT EXISTS USERS (
    user_id BIGINT NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    qr_token VARCHAR(255) UNIQUE,
    source VARCHAR(100) DEFAULT 'WhatsApp',
    owner_sales BIGINT,
    team VARCHAR(100),
    tags VARCHAR(100),
    note_special VARCHAR(255),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT CHKROLE CHECK (role IN ('ADMIN', 'SALES', 'LEADER', 'MEMBER', 'N/A'))
);


CREATE TABLE IF NOT EXISTS EVENTS (
    event_id BIGINT NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    description TEXT,
    datetime_start TIMESTAMP,
    datetime_end TIMESTAMP,
    price INT,
    capacity INT,
    remaining_seats INT,
    location VARCHAR(100),
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    room_cost INT,
    speaker_id BIGINT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    FOREIGN KEY (speaker_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT CHKTYPE CHECK (type IN ('CLASS', 'SEMINAR')),
    CONSTRAINT CHKSTATUS_EVENTS CHECK (status IN ('SCHEDULED', 'CANCELLED', 'OPEN'))
);

CREATE TABLE IF NOT EXISTS EVENT_ENROLLMENTS (
    enrollment_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    event_id BIGINT,
    user_id BIGINT,
    enroll_by_id BIGINT,
    status VARCHAR(50) DEFAULT 'PENDING',
    enroll_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (enrollment_id),
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (enroll_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT CHKSTATUS_ENR CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS EVENT_SESSIONS (
    session_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    event_id BIGINT,
    session_name VARCHAR(50) NOT NULL,
    description TEXT,
    capacity INT,
    datetime_start TIMESTAMP,
    datetime_end TIMESTAMP,
    created_by_id BIGINT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id),
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS SESSION_REGISTRATIONS (
    registration_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    session_id BIGINT,
    user_id BIGINT,
    channel VARCHAR(100) DEFAULT 'MEMBER',
    registration_by_id BIGINT,
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    note_special VARCHAR(255),
    PRIMARY KEY (registration_id),
    FOREIGN KEY (session_id) REFERENCES EVENT_SESSIONS(session_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (registration_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT CHKCHANNEL_REG CHECK (channel IN ('WHATSAPP', 'SALES', 'LEADER', 'MEMBER')),
    CONSTRAINT CHKSTATUS_REG CHECK (status IN ('REGISTERED', 'WAITLIST', 'SPECIAL', 'CANCELLED', 'CHANGED'))
);

CREATE TABLE IF NOT EXISTS WAITLIST (
    wait_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    event_id BIGINT,
    user_id BIGINT,
    rank INT NOT NULL,
    created_by_id BIGINT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wait_id),
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS EVENT_ATTENDANCE (
    attendance_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    session_id BIGINT,
    user_id BIGINT,
    registration_id BIGINT,
    attend_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    remarks VARCHAR(255),
    PRIMARY KEY (attendance_id),
    FOREIGN KEY (session_id) REFERENCES EVENT_SESSIONS(session_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (registration_id) REFERENCES SESSION_REGISTRATIONS(registration_id) ON DELETE SET NULL,
    CONSTRAINT CHKSTATUS_ATT CHECK (status IN ('G', 'Y', 'R'))
);

CREATE TABLE IF NOT EXISTS PAYMENTS (
    payment_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    event_id BIGINT,
    user_id BIGINT,
    enrollment_id BIGINT,
    amount DECIMAL(10,2),
    method VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_time TIMESTAMP,
    casher_id BIGINT DEFAULT '50000',
    expire_time TIMESTAMP,
    receipt_number VARCHAR(100),
    issued_receipt BOOLEAN DEFAULT FALSE,
    issued_certificate BOOLEAN DEFAULT FALSE,
    remarks VARCHAR(255),
    PRIMARY KEY (payment_id),
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (enrollment_id) REFERENCES EVENT_ENROLLMENTS(enrollment_id) ON DELETE SET NULL,
    CONSTRAINT CHKMETHOD_PAYMENT CHECK (method IN ('CREDITCARD', 'FPS', 'PAYME', 'CASH')),
    CONSTRAINT CHKSTATUS_PAY CHECK (status IN ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'REFUNDED'))
);

CREATE TABLE IF NOT EXISTS UPLOADS (
    upload_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    filename VARCHAR(255) NOT NULL,
    file_link VARCHAR(500),
    content_type VARCHAR(100),
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (upload_id)
);

CREATE TABLE IF NOT EXISTS ASSIGNMENTS (
    assignment_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    session_id BIGINT,
    assigned_by_id BIGINT,
    assigned_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP,
    PRIMARY KEY (assignment_id),
    FOREIGN KEY (session_id) REFERENCES EVENT_SESSIONS(session_id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ASSIGNMENT_SUBMISSIONS (
    submission_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    assignment_id BIGINT,
    user_id BIGINT,
    submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    upload_id BIGINT,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    graded_by_id BIGINT,
    feedback TEXT,
    PRIMARY KEY (submission_id),
    FOREIGN KEY (assignment_id) REFERENCES ASSIGNMENTS(assignment_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (upload_id) REFERENCES UPLOADS(upload_id) ON DELETE SET NULL,
    FOREIGN KEY (graded_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS REQUESTS (
    request_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    registration_id BIGINT,
    user_id BIGINT,
    action TEXT,
    request_by_id BIGINT,
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    determine_by_id BIGINT,
    determine_time TIMESTAMP,
    remarks VARCHAR(255),
    under_3bday BOOLEAN,
    priority_tier INT,
    PRIMARY KEY (request_id),
    FOREIGN KEY (registration_id) REFERENCES SESSION_REGISTRATIONS(registration_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (request_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (determine_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT CHKSTATUS_REQ CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE TABLE IF NOT EXISTS SERVICES (
    service_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id BIGINT,
    PRIMARY KEY (service_id),
    FOREIGN KEY (created_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS SUBSCRIPTIONS (
    subscription_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    user_id BIGINT,
    service_id BIGINT,
    datetime_start TIMESTAMP,
    datetime_end TIMESTAMP,
    account VARCHAR(100),
    password VARCHAR(100),
    status VARCHAR(20),
    PRIMARY KEY (subscription_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES SERVICES(service_id) ON DELETE SET NULL,
    CONSTRAINT CHKSTATUS_SUBS CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED'))
);

CREATE TABLE IF NOT EXISTS NOTICES (
    notice_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(50),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id BIGINT,
    PRIMARY KEY (notice_id),
    FOREIGN KEY (created_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS NOTIFICATIONS (
    notification_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    description TEXT NOT NULL,
    template TEXT NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id BIGINT,
    PRIMARY KEY (notification_id),
    FOREIGN KEY (created_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL
);

CREATE TABLE holidays (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  holiday_date DATE UNIQUE,
  name_tc VARCHAR(100),
  uid VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO USERS (user_id, password, role, name, mobile, email, qr_token, source, owner_sales, team, tags) VALUES
('50000', 'password', 'ADMIN', 'System', '12345678', 'test@gmail.com', 'hewr2ur2kb2kf3f3', 'WhatsApp', NULL, 'Management', 'admin,super'),
('50001', 'password', 'SALES', 'Sales User', '23456789', 'test2@gmail.com', 'djqw3ji32nl23', 'WhatsApp', NULL, 'Sales A', 'sales,active'),
('50002', 'password', 'LEADER', 'Leader User', '34567890', 'test3@gmail.com', '3h2oj2fekjbwfbjk ew', 'WhatsApp', NULL, 'Sales A', 'leader'),
('50003', 'password', 'MEMBER', 'Member User', '45678901', 'test4@gmail.com', 'ehoi2dho3fnoen', 'WhatsApp', 50001, 'Sales A', 'member'),
('50004', 'password', 'MEMBER', '陳大明', '51111111', 'chen.daming@email.com', 'qr_chen_daming', '網頁', 50001, 'Sales A', 'vip,active'),
('50005', 'password', 'MEMBER', '李小華', '52222222', 'li.xiaohua@email.com', 'qr_li_xiaohua', 'Facebook', 50001, 'Sales A', 'new'),
('50006', 'password', 'MEMBER', '王美玲', '53333333', 'wang.meiling@email.com', 'qr_wang_meiling', 'Instagram', 50001, 'Sales A', 'active'),
('50007', 'password', 'MEMBER', '張志強', '54444444', 'zhang.zhiqiang@email.com', 'qr_zhang_zhiqiang', 'WhatsApp', 50001, 'Sales B', 'member'),
('50008', 'password', 'MEMBER', '林淑芬', '55555555', 'lin.shufen@email.com', 'qr_lin_shufen', '網頁', 50001, 'Sales B', 'premium'),
('50009', 'password', 'SALES', '黃業務', '56666666', 'huang.sales@email.com', 'qr_huang_sales', 'WhatsApp', NULL, 'Sales B', 'sales'),
('50010', 'password', 'MEMBER', '劉建國', '57777777', 'liu.jianguo@email.com', 'qr_liu_jianguo', 'Google廣告', 50009, 'Sales B', 'new'),
('50011', 'password', 'MEMBER', '周雅婷', '58888888', 'zhou.yating@email.com', 'qr_zhou_yating', 'WhatsApp', 50009, 'Sales B', 'active'),
('50012', 'password', 'MEMBER', '吳文傑', '59999999', 'wu.wenjie@email.com', 'qr_wu_wenjie', '網頁', 50009, 'Sales C', 'member'),
('50013', 'password', 'MEMBER', '鄭佩君', '60000000', 'zheng.peijun@email.com', 'qr_zheng_peijun', 'Facebook', 50009, 'Sales C', 'vip'),
('50014', 'password', 'LEADER', '何主管', '61111111', 'he.leader@email.com', 'qr_he_leader', 'WhatsApp', NULL, 'Sales C', 'leader,senior'),
('50015', 'password', 'MEMBER', '蔡明宏', '62222222', 'cai.minghong@email.com', 'qr_cai_minghong', 'Instagram', 50014, 'Sales C', 'active'),
('50016', 'password', 'MEMBER', '許家豪', '63333333', 'xu.jiahao@email.com', 'qr_xu_jiahao', 'WhatsApp', 50014, 'Sales C', 'new'),
('50017', 'password', 'MEMBER', '楊麗華', '64444444', 'yang.lihua@email.com', 'qr_yang_lihua', '網頁', 50014, 'Sales A', 'premium,active'),
('50018', 'password', 'MEMBER', '馬志明', '65555555', 'ma.zhiming@email.com', 'qr_ma_zhiming', 'Google廣告', 50001, 'Sales A', 'member'),
('50019', 'password', 'MEMBER', '趙小玉', '66666666', 'zhao.xiaoyu@email.com', 'qr_zhao_xiaoyu', 'Facebook', 50001, 'Sales A', 'vip,premium'),
('50020', 'password', 'SALES', '孫經理', '67777777', 'sun.manager@email.com', 'qr_sun_manager', 'WhatsApp', NULL, 'Sales D', 'sales,senior'),
('50021', 'password', 'MEMBER', '高偉強', '68888888', 'gao.weiqiang@email.com', 'qr_gao_weiqiang', 'WhatsApp', 50020, 'Sales D', 'active'),
('50022', 'password', 'MEMBER', '胡秀英', '69999999', 'hu.xiuying@email.com', 'qr_hu_xiuying', 'Instagram', 50020, 'Sales D', 'new,trial'),
('50023', 'password', 'MEMBER', '梁思琪', '70000000', 'liang.siqi@email.com', 'qr_liang_siqi', '網頁', 50020, 'Sales D', 'premium'),
('50024', 'password', 'MEMBER', '羅志豪', '71111111', 'luo.zhihao@email.com', 'qr_luo_zhihao', 'Facebook', 50020, 'Sales D', 'member'),
('50025', 'password', 'MEMBER', '鍾雅文', '72222222', 'zhong.yawen@email.com', 'qr_zhong_yawen', 'Google廣告', 50009, 'Sales B', 'active'),
('50026', 'password', 'MEMBER', '宋建華', '73333333', 'song.jianhua@email.com', 'qr_song_jianhua', 'WhatsApp', 50009, 'Sales B', 'vip'),
('50027', 'password', 'MEMBER', '唐美玲', '74444444', 'tang.meiling@email.com', 'qr_tang_meiling', '網頁', 50001, 'Sales A', 'new'),
('50028', 'password', 'MEMBER', '韓志偉', '75555555', 'han.zhiwei@email.com', 'qr_han_zhiwei', 'Instagram', 50001, 'Sales A', 'active,premium'),
('50029', 'password', 'MEMBER', '馮淑芬', '76666666', 'feng.shufen@email.com', 'qr_feng_shufen', 'Facebook', 50014, 'Sales C', 'member'),
('50030', 'password', 'MEMBER', '葉文俊', '77777777', 'ye.wenjun@email.com', 'qr_ye_wenjun', 'Google廣告', 50014, 'Sales C', 'vip,active'),
('50031', 'password', 'MEMBER', '蕭淑慧', '78888888', 'xiao.shuhui@email.com', 'qr_xiao_shuhui', 'WhatsApp', 50020, 'Sales D', 'premium'),
('50032', 'password', 'MEMBER', '曾志強', '79999999', 'zeng.zhiqiang@email.com', 'qr_zeng_zhiqiang', '網頁', 50020, 'Sales D', 'active'),
('50033', 'password', 'MEMBER', '彭雅雯', '80000000', 'peng.yawen@email.com', 'qr_peng_yawen', 'Facebook', 50009, 'Sales B', 'new,trial');

INSERT INTO EVENTS (event_id, price, type, event_name, description, datetime_start, datetime_end, capacity, remaining_seats, location, status, room_cost, speaker_id) VALUES
('101', 10000, 'CLASS', '客戶關係管理入門', '客戶關係管理系統的基礎介紹課程', '2026-07-01 10:00:00', '2026-07-01 12:00:00', 60, 20, 'Room 101', 'OPEN', 200, 50000),
('102', NULL, 'SEMINAR', '進階銷售技巧講座', '深入探討高效銷售策略的講座', '2026-07-05 14:00:00', '2026-07-05 16:00:00', 100, 100, 'Zoom', 'SCHEDULED', 500, 50001),
('103', 8000, 'CLASS', 'Python 基礎課程', '從零開始學習 Python 程式設計', '2026-08-10 09:00:00', '2026-08-10 17:00:00', 30, 15, 'Room 201', 'OPEN', 300, 50002),
('104', 12000, 'CLASS', '數據分析實戰工作坊', '使用真實數據集進行實作練習', '2026-08-15 10:00:00', '2026-08-15 16:00:00', 25, 10, 'Room 301', 'OPEN', 250, 50000),
('105', NULL, 'SEMINAR', '數位行銷趨勢分享會', '最新數位行銷趨勢與案例分享', '2026-08-20 14:00:00', '2026-08-20 17:00:00', 100, 50, 'Main Hall', 'SCHEDULED', 500, 50001),
('106', NULL, 'SEMINAR', '人工智慧機器學習入門', '機器學習演算法與應用實作', '2026-09-01 09:00:00', '2026-09-01 18:00:00', 40, 25, 'Room 401', 'OPEN', 400, 50014),
('107', 6000, 'CLASS', 'Excel 進階技巧', '商業分析必備的 Excel 進階功能', '2026-09-05 13:00:00', '2026-09-05 17:00:00', 50, 30, 'Room 102', 'OPEN', 150, 50002),
('108', NULL, 'SEMINAR', '創業分享講座', '創業經驗與心得分享', '2026-09-10 19:00:00', '2026-09-10 21:00:00', 80, 80, 'Conference Room A', 'SCHEDULED', 200, 50020),
('109', 9000, 'CLASS', '使用者介面設計訓練營', '現代設計原則與工具實作', '2026-09-15 10:00:00', '2026-09-15 16:00:00', 35, 20, 'Room 202', 'OPEN', 280, 50000),
('110', 11000, 'CLASS', '網頁全端開發課程', '完整的前後端網頁開發技術', '2026-09-20 09:00:00', '2026-09-20 18:00:00', 30, 12, 'Room 302', 'OPEN', 350, 50014),
('111', NULL, 'SEMINAR', '投資理財講座', '個人理財與投資策略分享', '2026-09-25 18:30:00', '2026-09-25 20:30:00', 120, 100, 'Main Hall', 'SCHEDULED', 300, 50001),
('112', 7500, 'CLASS', '簡報製作技巧課程', '打造吸睛簡報的實用技巧', '2026-10-01 14:00:00', '2026-10-01 17:00:00', 40, 25, 'Room 103', 'OPEN', 180, 50002),
('113', 13000, 'CLASS', '手機應用程式開發', '開發 iOS 與 Android 應用程式', '2026-10-05 09:00:00', '2026-10-05 18:00:00', 25, 15, 'Room 501', 'OPEN', 380, 50014),
('114', NULL, 'SEMINAR', '職場溝通藝術', '有效的職場溝通技巧講座', '2026-10-10 19:00:00', '2026-10-10 21:00:00', 90, 70, 'Conference Room B', 'SCHEDULED', 250, 50020),
('115', 10000, 'CLASS', '資料庫管理課程', '資料庫設計與查詢優化', '2026-10-15 10:00:00', '2026-10-15 17:00:00', 30, 18, 'Room 203', 'OPEN', 300, 50000),
('116', 8500, 'CLASS', '社群媒體行銷課程', '掌握社群媒體廣告投放技巧', '2026-10-20 13:00:00', '2026-10-20 18:00:00', 45, 30, 'Room 104', 'OPEN', 220, 50001),
('117', NULL, 'SEMINAR', '人工智慧時代的機遇', '探討 AI 帶來的機會與挑戰', '2026-10-25 14:00:00', '2026-10-25 16:00:00', 150, 150, 'Auditorium', 'SCHEDULED', 600, 50014),
('118', 12500, 'CLASS', '區塊鏈技術課程', '認識區塊鏈與加密貨幣', '2026-11-01 09:00:00', '2026-11-01 17:00:00', 35, 20, 'Room 303', 'OPEN', 350, 50000),
('119', 7000, 'CLASS', '攝影基礎課程', '基礎攝影技巧與構圖', '2026-11-05 10:00:00', '2026-11-05 16:00:00', 20, 10, 'Studio A', 'OPEN', 200, 50002),
('120', 9500, 'CLASS', '影片剪輯課程', '專業影片剪輯技巧', '2026-11-10 13:00:00', '2026-11-10 18:00:00', 25, 15, 'Studio B', 'OPEN', 280, 50000),
('121', NULL, 'SEMINAR', '領導力培訓講座', '領導力發展與團隊管理', '2026-11-15 18:00:00', '2026-11-15 20:00:00', 100, 85, 'Main Hall', 'SCHEDULED', 400, 50020);

INSERT INTO EVENT_SESSIONS (event_id, session_name, description, capacity, datetime_start, datetime_end, created_by_id) VALUES
(101, '基礎理論', 'CRM 基礎概念與重要性', 30, '2026-07-01 10:00:00', '2026-07-01 12:00:00', 50000),
(101, '實作演練', 'CRM 系統操作實作', 30, '2026-07-08 10:00:00', '2026-07-08 12:00:00', 50000),
(102, '主題演講', '高效銷售策略分享', 100, '2026-07-05 14:00:00', '2026-07-05 16:00:00', 50001),
(103, '語法入門', 'Python 基礎語法與資料型態', 30, '2026-08-10 09:00:00', '2026-08-10 12:00:00', 50002),
(103, '流程控制', '條件判斷與迴圈', 30, '2026-08-10 13:00:00', '2026-08-10 15:00:00', 50002),
(103, '函數與模組', '函數定義與模組使用', 30, '2026-08-10 15:00:00', '2026-08-10 17:00:00', 50002),
(104, '數據清理', '數據預處理與清理技巧', 25, '2026-08-15 10:00:00', '2026-08-15 13:00:00', 50000),
(104, '視覺化分析', '數據視覺化與報表製作', 25, '2026-08-15 13:00:00', '2026-08-15 16:00:00', 50000),
(105, '趨勢分享', '2026 數位行銷趨勢與案例', 100, '2026-08-20 14:00:00', '2026-08-20 17:00:00', 50001),
(106, 'ML 基礎概念', '機器學習基本原理', 40, '2026-09-01 09:00:00', '2026-09-01 11:00:00', 50014),
(106, '監督式學習', '分類與回歸演算法', 40, '2026-09-01 11:00:00', '2026-09-01 13:00:00', 50014),
(106, '非監督式學習', '聚類與降維技術', 40, '2026-09-01 14:00:00', '2026-09-01 16:00:00', 50014),
(106, '深度學習入門', '神經網路基礎', 40, '2026-09-01 16:00:00', '2026-09-01 18:00:00', 50014),
(107, '進階函數', 'VLOOKUP、INDEX、MATCH 等函數', 50, '2026-09-05 13:00:00', '2026-09-05 15:00:00', 50002),
(107, '樞紐分析表', '樞紐分析與數據分析', 50, '2026-09-05 15:00:00', '2026-09-05 17:00:00', 50002),
(108, '創業經驗談', '從零到一的創業旅程', 80, '2026-09-10 19:00:00', '2026-09-10 21:00:00', 50020),
(109, '設計原則', 'UI/UX 設計基礎原則', 35, '2026-09-15 10:00:00', '2026-09-15 12:00:00', 50000),
(109, 'Figma 實作', 'Figma 設計工具實作', 35, '2026-09-15 13:00:00', '2026-09-15 15:00:00', 50000),
(109, '原型製作', '互動原型製作與測試', 35, '2026-09-15 15:00:00', '2026-09-15 16:00:00', 50000),
(110, '前端基礎', 'HTML、CSS、JavaScript', 30, '2026-09-20 09:00:00', '2026-09-20 11:30:00', 50014),
(110, 'React 框架', 'React 組件開發', 30, '2026-09-20 11:30:00', '2026-09-20 14:00:00', 50014),
(110, '後端開發', 'Node.js 與 Express', 30, '2026-09-20 14:30:00', '2026-09-20 16:30:00', 50014),
(110, '資料庫整合', 'PostgreSQL 整合實作', 30, '2026-09-20 16:30:00', '2026-09-20 18:00:00', 50014),
(111, '理財策略', '個人投資理財規劃', 120, '2026-09-25 18:30:00', '2026-09-25 20:30:00', 50001),
(112, '簡報設計', '簡報視覺設計原則', 40, '2026-10-01 14:00:00', '2026-10-01 15:30:00', 50002),
(112, '簡報演說', '有效的簡報技巧', 40, '2026-10-01 15:30:00', '2026-10-01 17:00:00', 50002),
(113, 'iOS 開發基礎', 'Swift 語言與 iOS 開發', 25, '2026-10-05 09:00:00', '2026-10-05 11:30:00', 50014),
(113, 'Android 開發', 'Kotlin 與 Android Studio', 25, '2026-10-05 11:30:00', '2026-10-05 14:00:00', 50014),
(113, 'UI 設計實作', '手機介面設計與實作', 25, '2026-10-05 14:30:00', '2026-10-05 16:00:00', 50014),
(113, 'App 發佈', 'App Store 與 Play Store 上架', 25, '2026-10-05 16:00:00', '2026-10-05 18:00:00', 50014),
(114, '溝通技巧', '職場有效溝通策略', 90, '2026-10-10 19:00:00', '2026-10-10 21:00:00', 50020),
(115, '資料庫設計', '關聯式資料庫設計原則', 30, '2026-10-15 10:00:00', '2026-10-15 12:30:00', 50000),
(115, 'SQL 進階', '複雜查詢與優化', 30, '2026-10-15 13:00:00', '2026-10-15 15:00:00', 50000),
(115, '效能調校', '資料庫效能優化技巧', 30, '2026-10-15 15:00:00', '2026-10-15 17:00:00', 50000),
(116, '社群策略', 'Facebook、Instagram 行銷策略', 45, '2026-10-20 13:00:00', '2026-10-20 15:30:00', 50001),
(116, '廣告投放', '社群廣告投放實務', 45, '2026-10-20 15:30:00', '2026-10-20 18:00:00', 50001),
(117, '主題演講', 'AI 機會與挑戰探討', 150, '2026-10-25 14:00:00', '2026-10-25 16:00:00', 50014),
(118, '區塊鏈原理', '區塊鏈技術基礎', 35, '2026-11-01 09:00:00', '2026-11-01 11:30:00', 50000),
(118, '智能合約', 'Smart Contract 開發', 35, '2026-11-01 12:00:00', '2026-11-01 14:30:00', 50000),
(118, '加密貨幣', '加密貨幣與 DeFi', 35, '2026-11-01 14:30:00', '2026-11-01 17:00:00', 50000),
(119, '攝影理論', '相機操作與基礎理論', 20, '2026-11-05 10:00:00', '2026-11-05 13:00:00', 50002),
(119, '實拍練習', '外拍實作與作品評析', 20, '2026-11-05 13:00:00', '2026-11-05 16:00:00', 50002),
(120, '剪輯軟體', 'Premiere Pro 基礎操作', 25, '2026-11-10 13:00:00', '2026-11-10 15:30:00', 50000),
(120, '進階特效', '特效與調色技巧', 25, '2026-11-10 15:30:00', '2026-11-10 18:00:00', 50000),
(121, '領導力發展', '領導力與團隊管理實務', 100, '2026-11-15 18:00:00', '2026-11-15 20:00:00', 50020),
(101, '基礎理論', 'CRM 基礎概念與重要性', 30, '2025-07-15 10:00:00', '2025-07-15 12:00:00', 50000),
(101, '基礎理論', 'CRM 基礎概念與重要性', 30, '2026-07-22 10:00:00', '2026-07-22 12:00:00', 50000),
(101, '基礎理論', 'CRM 基礎概念與重要性', 30, '2026-07-29 10:00:00', '2026-07-29 12:00:00', 50000),
(103, '語法入門', 'Python 基礎語法與資料型態', 30, '2026-08-11 09:00:00', '2026-08-11 12:00:00', 50002),
(103, '語法入門', 'Python 基礎語法與資料型態', 30, '2026-08-12 09:00:00', '2026-08-12 12:00:00', 50002),
(110, '前端基礎', 'HTML、CSS、JavaScript', 30, '2026-09-21 09:00:00', '2026-09-21 11:30:00', 50014),
(110, '前端基礎', 'HTML、CSS、JavaScript', 30, '2026-09-22 09:00:00', '2026-09-22 11:30:00', 50014);

-- Insert sample payment records
INSERT INTO PAYMENTS (event_id, user_id, enrollment_id, amount, method, status, create_time, paid_time, expire_time, receipt_number, issued_receipt, issued_certificate, remarks) VALUES
-- Completed payments
(101, 50008, NULL, 5000.00, 'FPS', 'COMPLETED', '2025-11-15 10:30:00', '2025-11-16 14:20:00', '2025-11-18 23:59:59', 'RCP-2025-001', TRUE, FALSE, '已完成付款'),
(102, 50008, NULL, 3000.00, 'CREDITCARD', 'COMPLETED', '2025-11-20 09:15:00', '2025-11-20 09:20:00', '2025-11-23 23:59:59', 'RCP-2025-002', TRUE, TRUE, '信用卡付款已確認'),
(103, 50008, NULL, 4500.00, 'PAYME', 'COMPLETED', '2025-11-25 16:45:00', '2025-11-26 10:00:00', '2025-11-28 23:59:59', 'RCP-2025-003', TRUE, FALSE, 'PayMe 轉帳完成'),
(105, 50012, NULL, 2500.00, 'CASH', 'COMPLETED', '2025-11-28 11:00:00', '2025-11-28 11:00:00', '2025-12-01 23:59:59', 'RCP-2025-004', TRUE, FALSE, '現金付款'),

-- Pending payments (within deadline)
(106, 50012, NULL, 3500.00, 'FPS', 'PENDING', '2025-11-30 14:00:00', NULL, '2025-12-03 23:59:59', NULL, FALSE, FALSE, '等待付款確認'),
(107, 50012, NULL, 4000.00, 'PAYME', 'PENDING', '2025-12-01 09:00:00', NULL, '2025-12-04 23:59:59', NULL, FALSE, FALSE, '已建立訂單'),
(108, 50015, NULL, 5500.00, 'CREDITCARD', 'PENDING', '2025-12-01 10:30:00', NULL, '2025-12-04 23:59:59', NULL, FALSE, FALSE, '待信用卡授權'),

-- Expired payments
(104, 50004, NULL, 3200.00, 'FPS', 'EXPIRED', '2025-11-10 08:00:00', NULL, '2025-11-13 23:59:59', NULL, FALSE, FALSE, '付款期限已過'),
(109, 50015, NULL, 2800.00, 'PAYME', 'EXPIRED', '2025-11-18 15:30:00', NULL, '2025-11-21 23:59:59', NULL, FALSE, FALSE, '未在期限內完成付款'),

-- More completed payments for different users
(110, 50018, NULL, 6000.00, 'FPS', 'COMPLETED', '2025-11-22 13:45:00', '2025-11-23 09:15:00', '2025-11-25 23:59:59', 'RCP-2025-005', TRUE, TRUE, 'FPS 付款完成'),
(111, 50019, NULL, 4200.00, 'CASH', 'COMPLETED', '2025-11-26 10:00:00', '2025-11-26 10:00:00', '2025-11-29 23:59:59', 'RCP-2025-006', TRUE, FALSE, '現場繳費'),
(112, 50018, NULL, 3800.00, 'CREDITCARD', 'COMPLETED', '2025-11-27 16:20:00', '2025-11-27 16:25:00', '2025-11-30 23:59:59', 'RCP-2025-007', TRUE, FALSE, '線上信用卡付款'),

-- Recent pending payments
(113, 50013, NULL, 5200.00, 'FPS', 'PENDING', '2025-11-29 11:30:00', NULL, '2025-12-02 23:59:59', NULL, FALSE, FALSE, '轉數快處理中'),
(114, 50022, NULL, 4800.00, 'PAYME', 'PENDING', '2025-11-30 15:00:00', NULL, '2025-12-03 23:59:59', NULL, FALSE, FALSE, '等待 PayMe 確認'),
(115, 50015, NULL, 3300.00, 'FPS', 'PENDING', '2025-12-01 08:15:00', NULL, '2025-12-04 23:59:59', NULL, FALSE, FALSE, '新建訂單');


INSERT INTO EVENT_ENROLLMENTS (event_id, user_id, enroll_by_id, status, enroll_time) VALUES
    -- Completed -> CONFIRMED
    (101, 50008, 50000, 'CONFIRMED', '2025-11-15 10:30:00'),
    (102, 50008, 50000, 'CONFIRMED', '2025-11-20 09:15:00'),
    (103, 50008, 50000, 'CONFIRMED', '2025-11-25 16:45:00'),
    (105, 50012, 50000, 'CONFIRMED', '2025-11-28 11:00:00'),
    (110, 50018, 50000, 'CONFIRMED', '2025-11-22 13:45:00'),
    (111, 50019, 50000, 'CONFIRMED', '2025-11-26 10:00:00'),
    (112, 50018, 50000, 'CONFIRMED', '2025-11-27 16:20:00'),

    -- Pending -> PENDING
    (106, 50012, 50000, 'PENDING', '2025-11-30 14:00:00'),
    (107, 50012, 50000, 'PENDING', '2025-12-01 09:00:00'),
    (108, 50015, 50000, 'PENDING', '2025-12-01 10:30:00'),
    (113, 50013, 50000, 'PENDING', '2025-11-29 11:30:00'),
    (114, 50022, 50000, 'PENDING', '2025-11-30 15:00:00'),
    (115, 50015, 50000, 'PENDING', '2025-12-01 08:15:00'),

    -- Expired/Other -> CANCELLED
    (104, 50004, 50000, 'CANCELLED', '2025-11-10 08:00:00'),
    (109, 50015, 50000, 'CANCELLED', '2025-11-18 15:30:00');
