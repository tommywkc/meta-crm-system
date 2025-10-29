CREATE TABLE IF NOT EXISTS USERS (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    qr_token VARCHAR(255),
    source VARCHAR(100),
    owner_sales BIGINT,
    team VARCHAR(100),
    tags VARCHAR(100),
    note_special VARCHAR(255),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT CHKROLE CHECK (role IN ('ADMIN', 'SALES', 'LEADER', 'MEMBER'))
);

CREATE TABLE IF NOT EXISTS EVENTS (
    event_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    description TEXT,
    datetime_start TIMESTAMP,
    datetime_end TIMESTAMP,
    capacity INT DEFAULT 60, 
    location VARCHAR(100),
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    room_cost INT,
    speaker_id BIGINT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    FOREIGN KEY (speaker_id) REFERENCES USERS(user_id)
    CONSTRAINT CHKTYPE CHECK (type IN ('CLASS', 'SEMINAR')),
    CONSTRAINT CHKSTATUS CHECK (status IN ('SCHEDULED', 'CANCELLED', 'OPEN'))
);

CREATE TABLE IF NOT EXISTS EVENT_ENROLLMENTS (
    enrollment_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    event_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    enroll_by_id BIGINT NOT NULL,
    enroll_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (enrollment_id),
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    FOREIGN KEY (enroll_by_id) REFERENCES USERS(user_id)
);

CREATE TABLE IF NOT EXISTS EVENT_SESSIONS (
    session_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    event_id BIGINT NOT NULL,
    session_name VARCHAR(50) NOT NULL,
    description TEXT,
    datetime_start TIMESTAMP,
    datetime_end TIMESTAMP,
    created_by_id BIGINT NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id),
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id),
    FOREIGN KEY (speaker_id) REFERENCES USERS(user_id)
);

CREATE TABLE IF NOT EXISTS SESSION_REGISTRATIONS (
    registration_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    channel VARCHAR(100) DEFAULT 'MEMBER',
    registration_by_id BIGINT NOT NULL,
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    note_special VARCHAR(255),
    attendance_id BIGINT,
    PRIMARY KEY (registration_id),
    FOREIGN KEY (session_id) REFERENCES EVENT_SESSIONS(session_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    FOREIGN KEY (registration_by_id) REFERENCES USERS(user_id),
    FOREIGN KEY (attendance_id) REFERENCES EVENT_ATTENDANCE(attendance_id),
    CONSTRAINT CHKCHANNEL CHECK (channel IN ('WHATSAPP', 'SALES', 'LEADER', 'MEMBER')),
    CONSTRAINT CHKSTATUS CHECK (status IN ('REGISTERED', 'WAITLIST', 'SPECICAL', 'CANCELLED', 'CHANGED')),
);

CREATE TABLE IF NOT EXISTS WAITLIST (
    wait_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rank INT NOT NULL,
    created_by_id BIGINT NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wait_id),
    FOREIGN KEY (session_id) REFERENCES EVENT_SESSIONS(session_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    FOREIGN KEY (created_by_id) REFERENCES USERS(user_id)
);

CREATE TABLE IF NOT EXISTS EVENT_ATTENDANCE (
    attendance_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    registration_id BIGINT,
    attend_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    remarks VARCHAR(255),
    PRIMARY KEY (attendance_id),
    FOREIGN KEY (session_id) REFERENCES EVENT_SESSIONS(session_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    FOREIGN KEY (registration_id) REFERENCES SESSION_REGISTRATIONS(registration_id),
    CONSTRAINT CHKSTATUS CHECK (status IN ('G', 'Y', 'R'))
);

CREATE TABLE IF NOT EXISTS PAYMENTS (
    payment_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    event_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_time TIMESTAMP,
    expire_time TIMESTAMP,
    receipt_number VARCHAR(100),
    issued_receipt BOOLEAN DEFAULT FALSE,
    issued_certificate BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (payment_id),
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    CONSTRAINT CHKMETHOD CHECK (method IN ('CREDITCARD', 'FPS', 'PAYME', 'CASH')),
    CONSTRAINT CHKSTATUS CHECK (status IN ('PENDING', 'COMPLETED', 'EXPIRED'))
);

CREATE TABLE IF NOT EXISTS UPLOADS (
    upload_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    filename VARCHAR(255) NOT NULL,
    content BLOB,
    content_type VARCHAR(100),
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (upload_id),
);

CREATE TABLE IF NOT EXISTS ASSIGNMENTS (
    assignment_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    session_id BIGINT NOT NULL,
    assigned_by_id BIGINT NOT NULL,
    assigned_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP,
    PRIMARY KEY (assignment_id),
    FOREIGN KEY (session_id) REFERENCES EVENT_SESSIONS(session_id),
    FOREIGN KEY (assigned_by_id) REFERENCES USERS(user_id)
);

CREATE TABLE IF NOT EXISTS ASSIGNMENT_SUBMISSIONS (
    submission_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    assignment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    upload_id BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    graded_by_id BIGINT,
    feedback TEXT,
    PRIMARY KEY (submission_id),
    FOREIGN KEY (assignment_id) REFERENCES ASSIGNMENTS(assignment_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    FOREIGN KEY (upload_id) REFERENCES UPLOADS(upload_id),
    FOREIGN KEY (graded_by_id) REFERENCES USERS(user_id)
);

CREATE TABLE IF NOT EXISTS REQUESTS (
    request_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    registration_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    action TEXT NOT NULL,
    request_by_id BIGINT NOT NULL,
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    determine_by_id BIGINT,
    determine_time TIMESTAMP,
    remarks VARCHAR(255),
    under_3bday BOOLEAN,
    priority_tier INT,
    PRIMARY KEY (request_id),
    FOREIGN KEY (registration_id) REFERENCES SESSION_REGISTRATIONS(registration_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    FOREIGN KEY (request_by_id) REFERENCES USERS(user_id),
    FOREIGN KEY (determine_by_id) REFERENCES USERS(user_id),
    CONSTRAINT CHKSTATUS CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE TABLE IF NOT EXISTS SERVICES (
    service_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id BIGINT,
    FOREIGN KEY (created_by_id) REFERENCES USERS(user_id),
    PRIMARY KEY (service_id)
);

CREATE TABLE IF NOT EXISTS SUBSCRIPTIONS (
    subscription_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    datetime_start TIMESTAMP,
    datetime_end TIMESTAMP,
    account VARCHAR(100),
    password VARCHAR(100),
    status VARCHAR(20),
    PRIMARY KEY (subscription_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    FOREIGN KEY (service_id) REFERENCES SERVICES(service_id),
    CONSTRAINT CHKSTATUS CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED'))
);

CREATE TABLE IF NOT EXISTS NOTICES (
    notice_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(50),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id BIGINT NOT NULL,
    PRIMARY KEY (notice_id),
    FOREIGN KEY (created_by_id) REFERENCES USERS(user_id)
);

CREATE TABLE IF NOT EXISTS NOTIFICATIONS (
    notification_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    description TEXT NOT NULL,
    template TEXT NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id BIGINT,
    PRIMARY KEY (notification_id),
    FOREIGN KEY (created_by_id) REFERENCES USERS(user_id)
);

CREATE TABLE IF NOT EXISTS HOLIDAYS (
    holiday_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
    holiday_name VARCHAR(100) NOT NULL,
    holiday_date DATE NOT NULL,
    description TEXT,
    PRIMARY KEY (holiday_id)
);