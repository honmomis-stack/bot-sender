-- Enum for user roles
CREATE TYPE user_role AS ENUM ('teacher', 'student', 'parent');

-- 1. Create Users Table
CREATE TABLE users (
  telegram_chat_id BIGINT PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'parent',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Students Table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  secret_pin TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Parent-Student Links Table
CREATE TABLE parent_student_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_telegram_id BIGINT REFERENCES users(telegram_chat_id) ON DELETE CASCADE,
  student_code TEXT REFERENCES students(student_code) ON DELETE CASCADE,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(parent_telegram_id, student_code)
);

-- 4. Create Notifications Table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_code TEXT REFERENCES students(student_code) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Setup
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create Policies (Using Service Role bypassing for backend, but good to have baseline)
CREATE POLICY "Public users are viewable by everyone."
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile."
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public students are viewable by everyone."
  ON students FOR SELECT
  USING (true);

CREATE POLICY "Public parent_student_links are viewable by everyone."
  ON parent_student_links FOR SELECT
  USING (true);

CREATE POLICY "Public notifications are viewable by everyone."
  ON notifications FOR SELECT
  USING (true);

-- Indexes for performance
CREATE INDEX idx_parent_student_links_parent_id ON parent_student_links(parent_telegram_id);
CREATE INDEX idx_notifications_student_code ON notifications(student_code);
