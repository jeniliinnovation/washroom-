SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables in reverse order of foreign key dependencies
DROP TABLE IF EXISTS device_tokens;
DROP TABLE IF EXISTS report_exports;
DROP TABLE IF EXISTS ai_analysis_results;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS areas;
DROP TABLE IF EXISTS wards;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS states;
DROP TABLE IF EXISTS qr_codes;
DROP TABLE IF EXISTS notification_templates;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS washroom_reviews;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS staff_locations;
DROP TABLE IF EXISTS staff_attendance;
DROP TABLE IF EXISTS staff_leaves;
DROP TABLE IF EXISTS cleaning_tasks;
DROP TABLE IF EXISTS priorities;
DROP TABLE IF EXISTS complaint_categories;
DROP TABLE IF EXISTS complaint_media;
DROP TABLE IF EXISTS complaint_assignments;
DROP TABLE IF EXISTS complaint_logs;
DROP TABLE IF EXISTS complaint_status_history;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS washroom_facilities;
DROP TABLE IF EXISTS facilities;
DROP TABLE IF EXISTS washroom_images;
DROP TABLE IF EXISTS washrooms;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Master: Roles
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Master: Permissions
CREATE TABLE permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  module VARCHAR(255) NOT NULL,
  description TEXT
);

-- 3. Master: User Roles Mapping
CREATE TABLE user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL
);

-- 4. Users Table (Citizens, Staff, Supervisors, Admins, Super Admins)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL CHECK(role IN ('CITIZEN', 'STAFF', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN')),
  ward_name VARCHAR(255),
  assigned_area VARCHAR(255),
  civic_points INTEGER DEFAULT 50,
  status VARCHAR(50) DEFAULT 'Active' CHECK(status IN ('Active', 'Suspended', 'Deactivated')),
  profile_image_url TEXT,
  refresh_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Master: States & Cities & Wards & Areas
CREATE TABLE states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(50)
);

CREATE TABLE cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_id INTEGER,
  name VARCHAR(255) NOT NULL,
  pincode VARCHAR(20)
);

CREATE TABLE wards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city_id INTEGER,
  name VARCHAR(255) NOT NULL,
  ward_number VARCHAR(50)
);

CREATE TABLE areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ward_id INTEGER,
  name VARCHAR(255) NOT NULL,
  landmark VARCHAR(255)
);

-- 6. Public Washrooms
CREATE TABLE washrooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  ward VARCHAR(255) NOT NULL,
  area VARCHAR(255),
  city VARCHAR(255) DEFAULT 'New Delhi',
  state VARCHAR(255) DEFAULT 'Delhi',
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  qr_code_id VARCHAR(255) UNIQUE NOT NULL,
  cleanliness_score INTEGER DEFAULT 85,
  status VARCHAR(50) DEFAULT 'Active' CHECK(status IN ('Active', 'Maintenance', 'Closed')),
  facilities_json TEXT,
  opening_hours VARCHAR(100) DEFAULT '24/7',
  total_ratings INTEGER DEFAULT 0,
  avg_rating REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Washroom Images Gallery
CREATE TABLE washroom_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  washroom_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  caption VARCHAR(255),
  uploaded_by_user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Master: Facilities & Mapping
CREATE TABLE facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  icon VARCHAR(100),
  description TEXT
);

CREATE TABLE washroom_facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  washroom_id INTEGER NOT NULL,
  facility_id INTEGER NOT NULL
);

-- 9. Master: Complaint Categories & Priorities
CREATE TABLE complaint_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  sla_hours INTEGER DEFAULT 24,
  description TEXT
);

CREATE TABLE priorities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  level INTEGER DEFAULT 1
);

-- 10. Complaints Table
CREATE TABLE complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_code VARCHAR(255) UNIQUE NOT NULL,
  citizen_id INTEGER,
  washroom_id INTEGER NOT NULL,
  category VARCHAR(255) NOT NULL,
  priority VARCHAR(50) DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')),
  description TEXT,
  status VARCHAR(100) DEFAULT 'New Complaint' CHECK(status IN ('New Complaint', 'Under Review', 'Assigned', 'In Progress', 'Cleaning Completed', 'Verification Pending', 'Resolved', 'Citizen Feedback', 'Closed', 'Rejected', 'Cancelled')),
  before_images_json TEXT,
  after_images_json TEXT,
  voice_note_url TEXT,
  gps_lat REAL,
  gps_lng REAL,
  is_anonymous INTEGER DEFAULT 0,
  assigned_staff_id INTEGER,
  supervisor_id INTEGER,
  expected_resolution_time DATETIME,
  ai_cleanliness_score INTEGER,
  ai_detected_issues_json TEXT,
  rejection_reason TEXT,
  citizen_rating INTEGER,
  citizen_feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);

-- 11. Complaint Status History & Complaint Logs (Audit Timeline)
CREATE TABLE complaint_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL,
  previous_status VARCHAR(100),
  new_status VARCHAR(100) NOT NULL,
  changed_by_user_id INTEGER,
  notes TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaint_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL,
  previous_status VARCHAR(100),
  new_status VARCHAR(100) NOT NULL,
  changed_by_user_id INTEGER,
  notes TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Complaint Assignments Log
CREATE TABLE complaint_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL,
  assigned_staff_id INTEGER NOT NULL,
  assigned_by_user_id INTEGER,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- 13. Complaint Media
CREATE TABLE complaint_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL,
  media_type VARCHAR(50) CHECK(media_type IN ('PHOTO', 'VIDEO', 'AUDIO')),
  media_url TEXT NOT NULL,
  stage VARCHAR(50) DEFAULT 'BEFORE' CHECK(stage IN ('BEFORE', 'AFTER')),
  uploaded_by_user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. Cleaning Tasks Module
CREATE TABLE cleaning_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_code VARCHAR(255) UNIQUE NOT NULL,
  washroom_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  supervisor_id INTEGER,
  complaint_id INTEGER,
  task_type VARCHAR(100) DEFAULT 'Scheduled Cleaning',
  status VARCHAR(50) DEFAULT 'Pending' CHECK(status IN ('Pending', 'In Progress', 'Paused', 'Completed', 'Cancelled')),
  scheduled_start DATETIME,
  started_at DATETIME,
  completed_at DATETIME,
  before_photo_url TEXT,
  after_photo_url TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. Staff Attendance & Locations & Leaves
CREATE TABLE staff_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL,
  date VARCHAR(50) NOT NULL,
  check_in VARCHAR(50),
  check_out VARCHAR(50),
  gps_checkin_lat REAL,
  gps_checkin_lng REAL,
  status VARCHAR(50) DEFAULT 'Present' CHECK(status IN ('Present', 'Absent', 'On Leave', 'Half Day')),
  tasks_completed INTEGER DEFAULT 0
);

CREATE TABLE staff_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy_meters REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staff_leaves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL,
  start_date VARCHAR(50) NOT NULL,
  end_date VARCHAR(50) NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
  supervisor_id INTEGER,
  supervisor_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. Reviews & Ratings
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  washroom_id INTEGER NOT NULL,
  citizen_id INTEGER,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE washroom_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  washroom_id INTEGER NOT NULL,
  citizen_id INTEGER,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  washroom_id INTEGER NOT NULL,
  cleanliness_rating INTEGER CHECK(cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  smell_rating INTEGER CHECK(smell_rating >= 1 AND smell_rating <= 5),
  water_availability_rating INTEGER CHECK(water_availability_rating >= 1 AND water_availability_rating <= 5),
  citizen_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. Notifications & Templates
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(100) DEFAULT 'INFO',
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(255) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_template TEXT NOT NULL,
  channel VARCHAR(50) DEFAULT 'ALL' CHECK(channel IN ('EMAIL', 'SMS', 'PUSH', 'ALL'))
);

-- 18. QR Codes Catalog
CREATE TABLE qr_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_id VARCHAR(255) UNIQUE NOT NULL,
  washroom_id INTEGER NOT NULL,
  qr_image_url TEXT,
  scans_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 19. AI Analysis Results Log
CREATE TABLE ai_analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER,
  washroom_id INTEGER,
  image_url TEXT NOT NULL,
  cleanliness_score INTEGER,
  damage_detected INTEGER DEFAULT 0,
  detected_tags_json TEXT,
  raw_response_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 20. Report Exports & Audit Logs & Settings & Device Tokens
CREATE TABLE report_exports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_type VARCHAR(100) NOT NULL,
  file_format VARCHAR(50) CHECK(file_format IN ('PDF', 'EXCEL', 'CSV')),
  file_url TEXT NOT NULL,
  generated_by_user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action VARCHAR(255) NOT NULL,
  target_type VARCHAR(100),
  target_id VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(100),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  email VARCHAR(255),
  ip_address VARCHAR(100),
  success INTEGER DEFAULT 1,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_message TEXT,
  stack_trace TEXT,
  endpoint VARCHAR(255),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  setting_key VARCHAR(255) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'GENERAL',
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE device_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  platform VARCHAR(50) DEFAULT 'WEB',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
