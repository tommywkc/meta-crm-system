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
DROP TABLE IF EXISTS FEEDBACKS;
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
    referrer BIGINT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    FOREIGN KEY (owner_sales) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (referrer) REFERENCES USERS(user_id) ON DELETE SET NULL,
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
    remaining_seats INT,
    datetime_start TIMESTAMP,
    datetime_end TIMESTAMP,
    round INT,
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
    channel VARCHAR(100) DEFAULT 'WEB',
    registration_by_id BIGINT,
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    note_special VARCHAR(255),
    PRIMARY KEY (registration_id),
    FOREIGN KEY (session_id) REFERENCES EVENT_SESSIONS(session_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (registration_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT CHKCHANNEL_REG CHECK (channel IN ('WHATSAPP', 'LEADER', 'SALES', 'WEB')),
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
    registration_id BIGINT,
    attend_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    remarks VARCHAR(255),
    PRIMARY KEY (attendance_id),
    FOREIGN KEY (registration_id) REFERENCES SESSION_REGISTRATIONS(registration_id) ON DELETE SET NULL,
    CONSTRAINT CHKSTATUS_ATT CHECK (status IN ('G', 'Y', 'R'))
);

CREATE TABLE IF NOT EXISTS PAYMENTS (
    payment_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    event_id BIGINT,
    user_id BIGINT,
    enrollment_id BIGINT,
    amount DECIMAL(12,2),
    paid_amount DECIMAL(12,2) DEFAULT 0,
    method VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_time TIMESTAMP,
    casher_id BIGINT DEFAULT '10000',
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
    CONSTRAINT CHKSTATUS_PAY CHECK (status IN ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'REFUNDED', 'OUTSTANDING'))
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
    event_id BIGINT,
    assigned_by_id BIGINT,
    assigned_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255),
    description TEXT,
    deadline TIMESTAMP,
    PRIMARY KEY (assignment_id),
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ASSIGNMENT_SUBMISSIONS (
    submission_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    assignment_id BIGINT,
    user_id BIGINT,
    submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    upload_id BIGINT,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    score NUMERIC,
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
    request_type VARCHAR(100),
    registration_id BIGINT,
    user_id BIGINT,
    old_session_id BIGINT,
    new_session_id BIGINT,
    request_by_id BIGINT,
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    marking_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    determine_by_id BIGINT,
    determine_time TIMESTAMP,
    remarks VARCHAR(255),
    under_3bday BOOLEAN,
    time_conflict BOOLEAN,
    conflict_id BIGINT,
    priority_tier INT,
    PRIMARY KEY (request_id),
    FOREIGN KEY (registration_id) REFERENCES SESSION_REGISTRATIONS(registration_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (request_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (determine_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT CHKTYPE_REQ CHECK (request_type IN ('LEAVE','RESCHEDULE','MAKEUP','RETAKE')),
    CONSTRAINT CHKSTATUS_REQ CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
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
    user_id BIGINT,
    description TEXT NOT NULL,
    template TEXT NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id BIGINT,
    PRIMARY KEY (notification_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL
);

CREATE TABLE HOLIDAYS (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  holiday_date DATE UNIQUE,
  name_tc VARCHAR(100),
  uid VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS FEEDBACKS (
    feedback_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    testing_role VARCHAR(50),
    rating TEXT,
    text TEXT,
    submitted_by_id BIGINT,
    submit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (feedback_id),
    FOREIGN KEY (submitted_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT CHKROLE_FEED CHECK (testing_role IN ('ADMIN', 'SALES', 'LEADER', 'MEMBER', 'N/A'))
);

INSERT INTO USERS (user_id, password, role, name, mobile, email, qr_token, source, owner_sales, team, tags) VALUES
('50000', 'password', 'ADMIN', 'Admin User', '12345678', 'test@gmail.com', 'hewr2ur2kb2kf3f3', 'WhatsApp', NULL, 'Management', 'admin,super'),
('10000', 'password', 'ADMIN', 'System', '0', '', 'System', '', NULL, '', 'System'),
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
('101', 10000, 'CLASS', '客戶關係管理入門', '客戶關係管理系統的基礎介紹課程', '2024-07-01 10:00:00', '2026-07-01 12:00:00', 60, 20, 'Room 101', 'OPEN', 200, 50009),
('102', NULL, 'SEMINAR', '進階銷售技巧講座', '深入探討高效銷售策略的講座', '2026-07-05 14:00:00', '2026-07-05 16:00:00', 100, 100, 'Zoom', 'OPEN', 500, 50009),
('103', 8000, 'CLASS', 'Python 基礎課程', '從零開始學習 Python 程式設計', '2026-08-10 09:00:00', '2026-08-10 17:00:00', 30, 15, 'Room 201', 'SCHEDULED', 300, 50009),
('104', NULL, 'SEMINAR', '數位行銷趨勢分享會2024', '最新數位行銷趨勢與案例分享', '2024-08-20 14:00:00', '2024-08-20 17:00:00', 100, 50, 'Main Hall', 'CANCELLED', 500, 50009),
('105', NULL, 'SEMINAR', '數位行銷趨勢分享會2026', '最新數位行銷趨勢與案例分享', '2026-08-20 14:00:00', '2026-08-20 17:00:00', 100, 50, 'Main Hall', 'OPEN', 500, 50009);


INSERT INTO EVENT_SESSIONS (event_id, session_name, description, capacity, datetime_start, datetime_end, created_by_id, remaining_seats, round) VALUES
(101, 'Test1', 'CRM 基礎概念與重要性111', 30, '2024-07-01 10:00:00', '2027-07-01 12:00:00', 50000, 30, 1),
(101, 'Test2', 'CRM 基礎概念與重要性111', 30, '2026-02-01 10:00:00', '2027-02-01 12:00:00', 50000, 30, 2),
(101, '基礎理論', 'CRM 基礎概念與重要性', 30, '2026-07-01 10:00:00', '2026-07-01 12:00:00', 50000, 30, 1),
(101, '基礎理論', 'CRM 基礎概念與重要性', 30, '2026-08-01 10:00:00', '2026-08-01 12:00:00', 50000, 30, 2),
(101, '實作演練', 'CRM 系統操作實作', 30, '2026-07-08 10:00:00', '2026-07-08 12:00:00', 50000, 30, 1),
(101, '實作演練', 'CRM 系統操作實作', 30, '2026-08-08 10:00:00', '2026-08-08 12:00:00', 50000, 30, 2),
(102, 'Test1', '高效銷售策略分享', 100, '2026-02-02 14:00:00', '2026-02-02 16:00:00', 50001, 100, 1),
(102, '主題演講', '高效銷售策略分享', 100, '2026-07-05 14:00:00', '2026-07-05 16:00:00', 50001, 100, 1);




-- Insert sample payment records
INSERT INTO PAYMENTS (event_id, user_id, enrollment_id, amount, method, status, create_time, paid_time, expire_time, receipt_number, issued_receipt, issued_certificate, remarks) VALUES
-- Completed payments
(101, 50008, NULL, 5000.00, 'FPS', 'COMPLETED', '2025-11-15 10:30:00', '2025-11-16 14:20:00', '2025-11-18 23:59:59', 'RCP-2025-001', TRUE, FALSE, '已完成付款'),
(102, 50008, NULL, 3000.00, 'CREDITCARD', 'COMPLETED', '2025-11-20 09:15:00', '2025-11-20 09:20:00', '2025-11-23 23:59:59', 'RCP-2025-002', TRUE, TRUE, '信用卡付款已確認'),
(103, 50008, NULL, 4500.00, 'PAYME', 'PENDING', '2025-11-25 16:45:00', '2025-11-26 10:00:00', '2025-11-28 23:59:59', 'RCP-2025-003', TRUE, FALSE, 'PayMe 轉帳完成'),
(104, 50008, NULL, 2500.00, 'CASH', 'CANCELLED', '2025-11-28 11:00:00', '2025-11-28 11:00:00', '2025-12-01 23:59:59', 'RCP-2025-004', TRUE, FALSE, '現金付款');



INSERT INTO EVENT_ENROLLMENTS (event_id, user_id, enroll_by_id, status, enroll_time) VALUES
    -- Completed -> CONFIRMED
    (101, 50008, 50000, 'CONFIRMED', '2025-11-15 10:30:00'),
    (102, 50008, 50000, 'CONFIRMED', '2025-11-15 10:30:00'),
    (103, 50008, 50000, 'PENDING', '2025-11-25 16:45:00'),
    (104, 50008, 50000, 'CANCELLED', '2025-11-28 11:00:00');


INSERT INTO SESSION_REGISTRATIONS (session_id, user_id, registration_by_id) VALUES
    (1, 50008, 50008),
    (3, 50008, 50008),
    (6, 50008, 50008),
    (7, 50008, 50008);

