DROP TABLE IF EXISTS EVENT_FINANCIALS CASCADE;
DROP TABLE IF EXISTS BANNERS;
DROP TABLE IF EXISTS STUDENT_WORKS;
DROP TABLE IF EXISTS SUSPENSION;
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
DROP TABLE IF EXISTS EVENT_SESSIONS CASCADE;
DROP TABLE IF EXISTS EVENT_FINANCIALS CASCADE;
DROP TABLE IF EXISTS EVENT_ENROLLMENTS CASCADE;
DROP TABLE IF EXISTS EVENTS CASCADE;
DROP TABLE IF EXISTS NOTIFICATIONS;
DROP TABLE IF EXISTS NOTICES;
DROP TABLE IF EXISTS HOLIDAYS;
DROP TABLE IF EXISTS FEEDBACKS;
DROP TABLE IF EXISTS KPI_TARGETS;
DROP TABLE IF EXISTS MONTHLY_PROMOTIONS;
DROP TABLE IF EXISTS PROMOTIONS;
DROP TABLE IF EXISTS MISC_EXPENSES;
DROP TABLE IF EXISTS LOGS;
DROP TABLE IF EXISTS USERS CASCADE;


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
    suspension BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id),
    FOREIGN KEY (owner_sales) REFERENCES USERS(user_id) ON DELETE SET NULL,
    FOREIGN KEY (referrer) REFERENCES USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT CHKROLE CHECK (role IN ('ADMIN', 'SALES', 'LEADER', 'MEMBER', 'N/A'))
);

CREATE TABLE IF NOT EXISTS SUSPENSION (
    suspension_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    user_id BIGINT,
    reason VARCHAR(255),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    created_by BIGINT,
    PRIMARY KEY (suspension_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES USERS(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS STUDENT_WORKS (
    work_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    PRIMARY KEY (work_id),
    FOREIGN KEY (created_by) REFERENCES USERS(user_id) ON DELETE SET NULL
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
    promotion_cost DECIMAL(12,2) DEFAULT 0,
    misc_cost DECIMAL(12,2) DEFAULT 0,
    salary_cost DECIMAL(12,2) DEFAULT 0,
    freight_cost DECIMAL(12,2) DEFAULT 0,
    utilities_cost DECIMAL(12,2) DEFAULT 0,
    telecom_cost DECIMAL(12,2) DEFAULT 0,
    cog_cost DECIMAL(12,2) DEFAULT 0,
    speaker_id BIGINT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    FOREIGN KEY (speaker_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT CHKTYPE CHECK (type IN ('CLASS', 'SEMINAR')),
    CONSTRAINT CHKSTATUS_EVENTS CHECK (status IN ('SCHEDULED', 'CANCELLED', 'OPEN'))
);

CREATE TABLE IF NOT EXISTS EVENT_FINANCIALS (
    event_id BIGINT PRIMARY KEY,
    room_cost DECIMAL(12,2) DEFAULT 0,
    promotion_cost DECIMAL(12,2) DEFAULT 0,
    misc_cost DECIMAL(12,2) DEFAULT 0,
    salary_cost DECIMAL(12,2) DEFAULT 0,
    freight_cost DECIMAL(12,2) DEFAULT 0,
    telecom_cost DECIMAL(12,2) DEFAULT 0,
    cog_cost DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_financial_event FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_event_financials_updated_at ON EVENT_FINANCIALS(updated_at);

CREATE TABLE IF NOT EXISTS PROMOTIONS (
    id SERIAL PRIMARY KEY,
    event_id BIGINT,
    expense_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    receipt_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_promotions_event_id ON PROMOTIONS(event_id);
CREATE INDEX IF NOT EXISTS idx_promotions_expense_date ON PROMOTIONS(expense_date);

CREATE TABLE IF NOT EXISTS MISC_EXPENSES (
    id SERIAL PRIMARY KEY,
    event_id BIGINT,
    expense_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    receipt_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_misc_expenses_event_id ON MISC_EXPENSES(event_id);
CREATE INDEX IF NOT EXISTS idx_misc_expenses_expense_date ON MISC_EXPENSES(expense_date);

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
    CONSTRAINT CHKSTATUS_REG CHECK (status IN ('REGISTERED', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS WAITLIST (
    wait_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    session_id BIGINT,
    waitlist VARCHAR(10000) DEFAULT '[]',
    PRIMARY KEY (wait_id),
    FOREIGN KEY (session_id) REFERENCES EVENT_SESSIONS(session_id) ON DELETE SET NULL
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
    attendance_conflict BOOLEAN,
    conflict_id BIGINT,
    priority_tier INT,
    reject_reason VARCHAR(255),
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
    is_read BOOLEAN DEFAULT FALSE,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id BIGINT,
    PRIMARY KEY (notification_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL
);



CREATE TABLE IF NOT EXISTS HOLIDAYS (
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

CREATE TABLE IF NOT EXISTS BANNERS (
    banner_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    PRIMARY KEY (banner_id),
    FOREIGN KEY (created_by) REFERENCES USERS(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS LOGS (
    log_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    user_id BIGINT,
    action VARCHAR(255),
    details TEXT,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL
);


INSERT INTO USERS (user_id, password, role, name, mobile, email, qr_token, source, owner_sales, team, tags) VALUES
('50000', 'password', 'ADMIN', 'Admin User', '1', 'test@gmail.com', 'hewr2ur2kb2kf3f3', 'WhatsApp', NULL, 'Management', 'admin,super'),
('10000', 'password', 'ADMIN', 'System', '0', '', 'System', '', NULL, '', 'System'),
('50001', 'password', 'SALES', 'Sales User', '3', 'test2@gmail.com', 'djqw3ji32nl23', 'WhatsApp', NULL, 'Sales A', 'sales,active'),
('50002', 'password', 'LEADER', 'Leader User', '2', 'test3@gmail.com', '3h2oj2fekjbwfbjk ew', 'WhatsApp', NULL, 'Sales A', 'leader'),
('50003', 'password', 'MEMBER', 'Member User', '4', 'test4@gmail.com', 'ehoi2dho3fnoen', 'WhatsApp', 50001, 'Sales A', 'member'),
('50004', 'password', 'MEMBER', '林淑芬', '55555555', 'lin.shufen@email.com', 'qr_lin_shufen', '網頁', 50001, 'Sales B', 'premium'),
('50005', 'password', 'SALES', '黃業務', '56666666', 'huang.sales@email.com', 'qr_huang_sales', 'WhatsApp', NULL, 'Sales B', 'sales');

INSERT INTO EVENTS (event_id, price, type, event_name, description, datetime_start, datetime_end, capacity, remaining_seats, location, status, room_cost, speaker_id) VALUES
('101', 10000, 'CLASS', '客戶關係管理入門', '客戶關係管理系統的基礎介紹課程', '2024-07-01 10:00:00', '2029-08-01 12:00:00', 60, 60, 'Room 101', 'OPEN', 200, 50005),
('102', NULL, 'SEMINAR', '進階銷售技巧講座', '深入探討高效銷售策略的講座', '2026-07-05 14:00:00', '2026-07-05 16:00:00', 100, 100, 'Zoom', 'OPEN', 500, 50005);

INSERT INTO EVENT_SESSIONS (event_id, session_name, description, capacity, datetime_start, datetime_end, created_by_id, remaining_seats, round) VALUES
(101, 'Test1', 'CRM 基礎概念與重要性1', 30, '2024-07-01 10:00:00', '2027-07-01 12:00:00', 50000, 30, 1),
(101, 'Test2', 'CRM 基礎概念與重要性2', 30, '2026-02-11 10:00:00', '2026-02-11 12:00:00', 50000, 30, 2),
(101, 'Lab1', 'CRM 基礎概念與重要性', 30, '2026-04-20 10:00:00', '2026-07-01 12:00:00', 50000, 0, 1),
(101, 'Lab1', 'CRM 基礎概念與重要性', 30, '2026-08-01 10:00:00', '2026-08-01 12:00:00', 50000, 30, 2),
(101, 'Lab2', 'CRM 系統操作實作', 30, '2029-07-08 10:00:00', '2029-07-08 12:00:00', 50000, 30, 1),
(101, 'Lab2', 'CRM 系統操作實作', 30, '2026-08-08 10:00:00', '2026-08-08 12:00:00', 50000, 30, 2),
(101, 'Test3', 'CRM 基礎概念與重要性111', 30, '2026-03-14 10:00:00', '2026-03-14 12:00:00', 50000, 30, 2),
(101, 'Lab1', 'CRM 基礎概念與重要性', 30, '2028-08-01 10:00:00', '2028-08-01 12:00:00', 50000, 30, 3),
(101, 'Lab1', 'CRM 基礎概念與重要性', 30, '2029-08-01 10:00:00', '2029-08-01 12:00:00', 50000, 30, 4),
(102, 'Lab1', '高效銷售策略分享1', 100, '2026-02-02 14:00:00', '2026-02-02 16:00:00', 50001, 100, 1),
(102, 'Lab2', '高效銷售策略分享2', 100, '2026-07-05 14:00:00', '2026-07-05 16:00:00', 50001, 100, 1),
(102, 'Lab2', '高效銷售策略分享2', 100, '2026-04-17 12:00:00', '2028-02-02 16:00:00', 50001, 100, 2);

