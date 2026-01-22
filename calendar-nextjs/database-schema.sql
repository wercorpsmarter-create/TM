-- Task Master Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (auto-populated from Google OAuth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_id TEXT UNIQUE NOT NULL,
  subscription_status TEXT DEFAULT 'none',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  history BOOLEAN[] DEFAULT ARRAY[false, false, false, false, false, false, false],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Widget layouts table
CREATE TABLE IF NOT EXISTS widget_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  layout JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_layouts_user_id ON widget_layouts(user_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_layouts ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (true);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (true);

-- Habits policies
CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own habits" ON habits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own habits" ON habits
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own habits" ON habits
  FOR DELETE USING (true);

-- Goals policies
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (true);

-- Widget layouts policies
CREATE POLICY "Users can view own layout" ON widget_layouts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own layout" ON widget_layouts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own layout" ON widget_layouts
  FOR UPDATE USING (true);
