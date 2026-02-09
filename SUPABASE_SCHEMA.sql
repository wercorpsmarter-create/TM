-- Supabase Database Migration
-- This file contains the SQL needed to set up your Supabase project.

-- IMPORTANT: Enable the UUID extension first
create extension if not exists "uuid-ossp";

-- 1. USERS Table
create table if not exists users (
  id uuid default uuid_generate_v4() primary key,
  google_id text unique,
  email text,
  name text,
  subscription_status text,
  layout jsonb default '["goals", "activity"]',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. TASKS Table
create table if not exists tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) not null,
  title text not null,
  date text, -- Storing as YYYY-MM-DD string for simplicity
  status text default 'Pending',
  metadata jsonb default '{}', -- Stores Google Calendar ID, links, etc.
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. HABITS Table
create table if not exists habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) not null,
  name text not null,
  history jsonb default '[]', -- JSON array of booleans
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. GOALS Table
create table if not exists goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) not null,
  text text not null,
  position integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. MONTHLY GOALS Table
create table if not exists monthly_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) not null,
  text text not null,
  position integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) is recommended but optional for MVP if using Service Key or Anon Key carefully.
-- alter table users enable row level security;
-- alter table tasks enable row level security;
-- ...
