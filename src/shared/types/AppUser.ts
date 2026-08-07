import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import type { Database, Json } from './supabase.js';

type DbUser = Database['public']['Tables']['users']['Row'];

export type AuthenticatedAppUser = SupabaseAuthUser & DbUser;

export type GuestUser = {
    id: '1';
    name?: string | null;
    avatar?: string | null;
    bookmark_questions?: Json | null;
    college?: string | null;
    email?: string | null;
    version_number?: number;
    joined_at?: string;
    settings?: Json | null;
    show_name?: boolean | null;
    targetYear?: number | null;
    total_xp?: number | null;
    deleted_at: string | null;
    username?: string | null;
    is_public?: boolean | null;
    about?: string | null;
};

export type AppUser = AuthenticatedAppUser | GuestUser;
