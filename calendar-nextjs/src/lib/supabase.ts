import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client for browser-side operations (uses anon key with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export type Task = {
    id: string;
    user_id: string;
    title: string;
    date: string;
    status: 'Pending' | 'Completed';
    created_at: string;
    updated_at: string;
};

export type Habit = {
    id: string;
    user_id: string;
    name: string;
    history: boolean[];
    created_at: string;
    updated_at: string;
};

export type Goal = {
    id: string;
    user_id: string;
    text: string;
    position: number;
    created_at: string;
};

export type WidgetLayout = {
    id: string;
    user_id: string;
    layout: string[];
    updated_at: string;
};

export type User = {
    id: string;
    email: string;
    name: string;
    google_id: string;
    subscription_status: 'none' | 'trialing' | 'active';
    created_at: string;
};
