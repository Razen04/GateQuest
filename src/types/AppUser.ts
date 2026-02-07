import type { Database, Json } from './supabase.js';

type User = Database['public']['Tables']['users']['Row'];
type GuestUser = {
    avatar?: string | null;
    bookmark_questions?: Json | null;
    college?: string | null;
    email?: string | null;
    id?: string;
    version_number?: number;
    joined_at?: string;
    name?: string | null;
    settings?: Json | null;
    show_name?: boolean | null;
    targetYear?: number | null;
    total_xp?: number | null;
};

export type AppUser = User | GuestUser;
