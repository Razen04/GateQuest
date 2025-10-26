import type { Database, Json } from './supabase.js';

type User = Database['public']['Tables']['users']['Row'];
type GuestUser = {
    avatar?: string | null;
    bookmark_questions?: Json | null;
    college?: string | null;
    email?: string | null;
    id?: string;
    joined_at?: string;
    name?: string | null;
    settings?: Json | null;
    show_name?: boolean | null;
    target_year?: number | null;
    total_xp?: number | null;
};

export type AppUser = User | GuestUser;
