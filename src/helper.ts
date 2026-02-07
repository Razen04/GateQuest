// This file contains various utility functions used throughout the application,such as interacting with localStorage, styling, and syncing data with Supabase.

import { toast } from 'sonner';
import { supabase } from './utils/supabaseClient.js';
import type { Question } from './types/question.js';
import type { AppUser } from './types/AppUser.js';

// Safely retrieves and parses the user profile from localStorage.
// Returns null if the profile doesn't exist or if there's a parsing error.
export const getUserProfile = (): AppUser | null => {
    try {
        const stored = localStorage.getItem('gate_user_profile');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

// Maps a color name to corresponding Tailwind CSS classes for background and text color.
const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
    teal: 'bg-teal-100 text-teal-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    pink: 'bg-pink-100 text-pink-600',
    violet: 'bg-violet-100 text-violet-600',
} as const;

type ColorKey = keyof typeof colors;
type ColorClass = (typeof colors)[ColorKey];
export const getBackgroundColor = (color: string): ColorClass => {
    return colors[color as ColorKey] ?? 'bg-gray-100 text-gray-600';
};

// Updates the user profile in localStorage by merging new data with the existing profile.
export const updateUserProfile = (updates: AppUser): AppUser => {
    const stored = localStorage.getItem('gate_user_profile');
    const current = stored ? JSON.parse(stored) : [];
    const updated = { ...current, ...updates };
    localStorage.setItem('gate_user_profile', JSON.stringify(updated));
    return updated;
};

// A helper function to sort questions by year in descending order (newest first).
export const sortQuestionsByYear = (questionsToSort: Question[]) => {
    return [...questionsToSort].sort((a, b) => {
        const yearA = a.year;
        const yearB = b.year;
        return yearB - yearA;
    });
};

// Pushes the entire local user profile to the Supabase 'users' table.
// This is used to persist changes made locally (like settings) to the database.
export const syncUserToSupabase = async (isLogin: boolean) => {
    // A check to ensure there is a valid user to sync.
    if (!isLogin) return; // don’t even try until login is true
    const user = getUserProfile();
    if (!user?.id) {
        console.warn('User missing id');
        return;
    }

    const { error } = await supabase.from('users').update(user).eq('id', user.id);
    if (error) {
        console.error('Sync failed', error);
        toast.error('Profile update failed, try again later.');
        return;
    }

    // We only sync the identity fields (name/avatar) to keep the JWT small.
    // This stops the "Stale Session Overwrite" bug on page reload.
    const { error: authError } = await supabase.auth.updateUser({
        data: {
            full_name: user.name,
            avatar_url: user.avatar,
        },
    });

    if (authError) {
        // Warning only, because the DB sync succeeded which is the critical part
        console.warn('Session metadata sync failed:', authError.message);
    }

    toast.success('Profile updated successfully');
};

// Buffers user question attempts in localStorage before sending them to the database.
// This improves performance by batching writes.
type AttemptParams = {
    user_id: string;
    question_id: string;
    subject: string;
    was_correct: boolean | null;
    time_taken: number;
    attempt_number: number;
    user_version_number: number;
};

type recordAttemptLocallyProps = {
    params: AttemptParams;
    user: AppUser;
    refresh: () => void;
};

type AttemptBufferItem = AttemptParams & { attempted_at: string };

export const recordAttemptLocally = async ({
    params,
    user,
    refresh,
}: recordAttemptLocallyProps) => {
    // A check to ensure attempts are only recorded for logged-in users.
    if (!user || !user.id) {
        toast.error('No valid user profile found.');
        return;
    }

    // Guest users (id: 1) can practice, but their progress isn't saved.
    if (user.id === '1') {
        toast.message('Login to sync your profile.');
        return;
    }

    const LOCAL_KEY = `attempt_buffer_${user.id}`;
    const storedBuffer = localStorage.getItem(LOCAL_KEY);

    const buffer = storedBuffer ? (JSON.parse(storedBuffer) as AttemptBufferItem[]) : [];

    // Add the new attempt to the buffer.
    buffer.push({
        ...params,
        attempted_at: new Date().toISOString(),
    });

    localStorage.setItem(LOCAL_KEY, JSON.stringify(buffer));

    // When the buffer reaches a size of 3, sync it to the database.
    // Chainging this to 1 for now, let's observe how to API calls are made for a week
    if (buffer.length >= 1) {
        const error = await recordAttempt({ buffer, user, refresh });
        if (error) {
            toast.error('Failed to record attempt: ' + error.message);
            return;
        }
        localStorage.removeItem(LOCAL_KEY); // Clear the buffer after a successful sync.
    } else {
        toast.success('Attempt recorded successfully.');
    }
};

// Sends a batch of buffered attempts to the Supabase 'user_question_activity' table.
type recordAttemptProp = {
    buffer: AttemptBufferItem[];
    user: AppUser;
    refresh: () => void;
};

export const recordAttempt = async ({ buffer, user, refresh }: recordAttemptProp) => {
    if (!user || !user.id) {
        toast.error('No valid user profile found.');
        return;
    }

    // Guest users (id: 1) cannot have their attempts recorded.
    if (user.id === '1') {
        toast.message('Login to sync your profile.');
        return;
    }

    // Insert the entire buffer as new rows in the activity table.
    if (buffer.length !== 0) {
        const { error } = await supabase.rpc('insert_user_question_activity_batch', {
            batch: buffer,
        });

        if (error) {
            console.error('Batch insert error:', error);
            return error;
        }
    }
    // After syncing, immediately update the user's stats to reflect the new data.
    refresh();

    toast.success('Attempt synced successfully!');
};
