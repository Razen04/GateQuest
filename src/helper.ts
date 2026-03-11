// This file contains various utility functions used throughout the application,such as interacting with localStorage, styling, and syncing data with Supabase.
import React from 'react';
import { toast } from 'sonner';
import { supabase } from './utils/supabaseClient.js';
import type { AppUser } from './types/AppUser.js';
import {
    Calculator,
    Code,
    Database,
    Globe,
    TreeStructure,
    Bicycle,
    Brain,
    TerminalWindow,
    Books,
    FlameIcon,
    LightbulbIcon,
} from '@phosphor-icons/react';
import { EmptyIcon } from '@phosphor-icons/react';
import { PiIcon } from '@phosphor-icons/react';
import { BinaryIcon } from '@phosphor-icons/react';
import { CpuIcon } from '@phosphor-icons/react';
import { GraphIcon } from '@phosphor-icons/react';
import { GitBranchIcon } from '@phosphor-icons/react';
import { FileCodeIcon } from '@phosphor-icons/react';
import { LinuxLogoIcon } from '@phosphor-icons/react';
import { AppWindowIcon } from '@phosphor-icons/react';
import { BrowsersIcon } from '@phosphor-icons/react';
import type { Question } from './types/storage.js';
import { HeadCircuitIcon } from '@phosphor-icons/react';
import { PulseIcon } from '@phosphor-icons/react';
import { WaveSineIcon } from '@phosphor-icons/react';
import { SlidersIcon } from '@phosphor-icons/react';
import { BroadcastIcon } from '@phosphor-icons/react';
import { MagnetIcon } from '@phosphor-icons/react';
import { WaveformIcon } from '@phosphor-icons/react';
import { PowerIcon } from '@phosphor-icons/react';
import { PlugChargingIcon } from '@phosphor-icons/react';
import { GaugeIcon } from '@phosphor-icons/react';
import { CircuitryIcon } from '@phosphor-icons/react';
import { EngineIcon } from '@phosphor-icons/react';

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

// Icon mapper for the subjects
export const SubjectIconMap: Record<string, React.ElementType> = {
    pi: PiIcon,
    empty: EmptyIcon,
    binary: BinaryIcon,
    cpu: CpuIcon,
    graph: GraphIcon,
    gitbranch: GitBranchIcon,
    filecode: FileCodeIcon,
    calculator: Calculator,
    linuxlogo: LinuxLogoIcon,
    code: Code,
    database: Database,
    globe: Globe,
    'tree-structure': TreeStructure,
    bicycle: Bicycle,
    brain: Brain,
    terminal: TerminalWindow,
    flame: FlameIcon,
    zap: LightbulbIcon,
    appwindow: AppWindowIcon,
    browsers: BrowsersIcon,
    headcircuit: HeadCircuitIcon,
    pulse: PulseIcon,
    wavesine: WaveSineIcon,
    sliders: SlidersIcon,
    broadcast: BroadcastIcon,
    magnet: MagnetIcon,
    engine: EngineIcon,
    circuitry: CircuitryIcon,
    gauge: GaugeIcon,
    plugcharging: PlugChargingIcon,
    power: PowerIcon,
    waveform: WaveformIcon,
    // Add a default icon for new subjects
    default: Books,
};

// Maps a color name to corresponding Tailwind CSS classes for background and text color.
const colors = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',

    // New colors
    lime: 'bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
    rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
    zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900/30 dark:text-zinc-400',
    neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900/30 dark:text-neutral-400',
    stone: 'bg-stone-100 text-stone-600 dark:bg-stone-900/30 dark:text-stone-400',
    trueGray: 'bg-trueGray-100 text-trueGray-600 dark:bg-trueGray-900/30 dark:text-trueGray-400',
    coolGray: 'bg-coolGray-100 text-coolGray-600 dark:bg-coolGray-900/30 dark:text-coolGray-400',
    blueGray: 'bg-blueGray-100 text-blueGray-600 dark:bg-blueGray-900/30 dark:text-blueGray-400',
    turquoise: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    brown: 'bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    black: 'bg-black/10 text-black dark:bg-white/10 dark:text-white',

    // Fallback color
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
} as const;

type ColorKey = keyof typeof colors;
type ColorClass = (typeof colors)[ColorKey];
export const getBackgroundColor = (color: string | null): ColorClass => {
    return colors[color as ColorKey];
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
    subject_id: string;
    branch_id: string;
    was_correct: boolean | null;
    time_taken: number;
    attempt_number: number;
    user_version_number: number | undefined;
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
