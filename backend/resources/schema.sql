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
    enroll_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (enrollment_id),
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (enroll_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL
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
    session_id BIGINT,
    user_id BIGINT,
    rank INT NOT NULL,
    created_by_id BIGINT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wait_id),
    FOREIGN KEY (session_id) REFERENCES EVENT_SESSIONS(session_id) ON DELETE SET NULL,
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
    amount DECIMAL(10,2),
    method VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_time TIMESTAMP,
    expire_time TIMESTAMP,
    receipt_number VARCHAR(100),
    issued_receipt BOOLEAN DEFAULT FALSE,
    issued_certificate BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (payment_id),
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT CHKMETHOD_PAYMENT CHECK (method IN ('CREDITCARD', 'FPS', 'PAYME', 'CASH')),
    CONSTRAINT CHKSTATUS_PAY CHECK (status IN ('PENDING', 'COMPLETED', 'EXPIRED'))
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
('50000', 'password', 'ADMIN', 'Admin User', '12345678', 'test@gmail.com', 'hewr2ur2kb2kf3f3', 'WhatsApp', NULL, 'Management', 'admin,super'),
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
('101', 10000, 'CLASS', '客戶關係管理入門', '客戶關係管理系統的基礎介紹課程', '2024-07-01 10:00:00', '2024-07-01 12:00:00', 60, 20, 'Room 101', 'OPEN', 200, 50000),
('102', NULL, 'SEMINAR', '進階銷售技巧講座', '深入探討高效銷售策略的講座', '2024-07-05 14:00:00', '2024-07-05 16:00:00', 100, 100, 'Zoom', 'SCHEDULED', 500, 50001),
('103', 8000, 'CLASS', 'Python 基礎課程', '從零開始學習 Python 程式設計', '2024-08-10 09:00:00', '2024-08-10 17:00:00', 30, 15, 'Room 201', 'OPEN', 300, 50002),
('104', 12000, 'CLASS', '數據分析實戰工作坊', '使用真實數據集進行實作練習', '2024-08-15 10:00:00', '2024-08-15 16:00:00', 25, 10, 'Room 301', 'OPEN', 250, 50000),
('105', NULL, 'SEMINAR', '數位行銷趨勢分享會', '最新數位行銷趨勢與案例分享', '2024-08-20 14:00:00', '2024-08-20 17:00:00', 100, 50, 'Main Hall', 'SCHEDULED', 500, 50001),
('106', 15000, 'CLASS', '人工智慧機器學習入門', '機器學習演算法與應用實作', '2024-09-01 09:00:00', '2024-09-01 18:00:00', 40, 25, 'Room 401', 'OPEN', 400, 50014),
('107', 6000, 'CLASS', 'Excel 進階技巧', '商業分析必備的 Excel 進階功能', '2024-09-05 13:00:00', '2024-09-05 17:00:00', 50, 30, 'Room 102', 'OPEN', 150, 50002),
('108', NULL, 'SEMINAR', '創業分享講座', '創業經驗與心得分享', '2024-09-10 19:00:00', '2024-09-10 21:00:00', 80, 80, 'Conference Room A', 'SCHEDULED', 200, 50020),
('109', 9000, 'CLASS', '使用者介面設計訓練營', '現代設計原則與工具實作', '2024-09-15 10:00:00', '2024-09-15 16:00:00', 35, 20, 'Room 202', 'OPEN', 280, 50000),
('110', 11000, 'CLASS', '網頁全端開發課程', '完整的前後端網頁開發技術', '2024-09-20 09:00:00', '2024-09-20 18:00:00', 30, 12, 'Room 302', 'OPEN', 350, 50014),
('111', NULL, 'SEMINAR', '投資理財講座', '個人理財與投資策略分享', '2024-09-25 18:30:00', '2024-09-25 20:30:00', 120, 100, 'Main Hall', 'SCHEDULED', 300, 50001),
('112', 7500, 'CLASS', '簡報製作技巧課程', '打造吸睛簡報的實用技巧', '2024-10-01 14:00:00', '2024-10-01 17:00:00', 40, 25, 'Room 103', 'OPEN', 180, 50002),
('113', 13000, 'CLASS', '手機應用程式開發', '開發 iOS 與 Android 應用程式', '2024-10-05 09:00:00', '2024-10-05 18:00:00', 25, 15, 'Room 501', 'OPEN', 380, 50014),
('114', NULL, 'SEMINAR', '職場溝通藝術', '有效的職場溝通技巧講座', '2024-10-10 19:00:00', '2024-10-10 21:00:00', 90, 70, 'Conference Room B', 'SCHEDULED', 250, 50020),
('115', 10000, 'CLASS', '資料庫管理課程', '資料庫設計與查詢優化', '2024-10-15 10:00:00', '2024-10-15 17:00:00', 30, 18, 'Room 203', 'OPEN', 300, 50000),
('116', 8500, 'CLASS', '社群媒體行銷課程', '掌握社群媒體廣告投放技巧', '2024-10-20 13:00:00', '2024-10-20 18:00:00', 45, 30, 'Room 104', 'OPEN', 220, 50001),
('117', NULL, 'SEMINAR', '人工智慧時代的機遇', '探討 AI 帶來的機會與挑戰', '2024-10-25 14:00:00', '2024-10-25 16:00:00', 150, 150, 'Auditorium', 'SCHEDULED', 600, 50014),
('118', 12500, 'CLASS', '區塊鏈技術課程', '認識區塊鏈與加密貨幣', '2024-11-01 09:00:00', '2024-11-01 17:00:00', 35, 20, 'Room 303', 'OPEN', 350, 50000),
('119', 7000, 'CLASS', '攝影基礎課程', '基礎攝影技巧與構圖', '2024-11-05 10:00:00', '2024-11-05 16:00:00', 20, 10, 'Studio A', 'OPEN', 200, 50002),
('120', 9500, 'CLASS', '影片剪輯課程', '專業影片剪輯技巧', '2024-11-10 13:00:00', '2024-11-10 18:00:00', 25, 15, 'Studio B', 'OPEN', 280, 50000),
('121', NULL, 'SEMINAR', '領導力培訓講座', '領導力發展與團隊管理', '2024-11-15 18:00:00', '2024-11-15 20:00:00', 100, 85, 'Main Hall', 'SCHEDULED', 400, 50020);

