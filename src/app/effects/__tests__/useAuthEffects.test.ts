import { cleanup, renderHook } from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    type Mock,
    vi,
} from 'vitest';

const authMock = vi.hoisted(() => ({
    unsubscribe: vi.fn(),
    callback: null as ((event: string, session: unknown) => void) | null,
}));

const refreshMock = vi.hoisted(() => vi.fn());

vi.mock('@/shared/utils/supabaseClient', () => ({
    supabase: {
        auth: {
            onAuthStateChange: vi.fn(
                (cb: (event: string, session: unknown) => void) => {
                    authMock.callback = cb;
                    return {
                        data: {
                            subscription: { unsubscribe: authMock.unsubscribe },
                        },
                    };
                }
            ),
        },
        from: vi.fn(),
    },
}));

vi.mock('@/features/dashboard/hooks/useStudyPlan.js', () => ({
    default: () => ({ refresh: refreshMock }),
}));

vi.mock('@/shared/utils/helper', () => ({
    getUserProfile: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: { error: vi.fn(), success: vi.fn() },
}));

import { toast } from 'sonner';
import { useAuthStore } from '@/app/stores/useAuthStore';
import {
    getInitialSettings,
    useSettingsStore,
} from '@/app/stores/useSettingsStore';
import { getUserProfile } from '@/shared/utils/helper';
import { supabase } from '@/shared/utils/supabaseClient';
import { useAuthEffects } from '../useAuthEffects';

const makeSupaUser = (id: string) => ({
    id,
    email: `${id}@example.com`,
    user_metadata: { full_name: 'Test', avatar_url: null },
});

const makeSession = (id: string) => ({ user: makeSupaUser(id) });

const makeDbRow = (over: Record<string, unknown> = {}) => ({
    id: 'u1',
    email: 'razen@example.com',
    name: 'Razen',
    avatar: null,
    username: 'razen',
    show_name: true,
    total_xp: 0,
    college: null,
    targetYear: null,
    bookmark_questions: [],
    version_number: 1,
    settings: {},
    ...over,
});

type UsersQueryOpts = {
    existingRow?: unknown;
    selectError?: unknown;
    insertedRow?: unknown;
    pendingMaybeSingle?: Promise<{ data: unknown; error: unknown }>;
};

function mockUsersQuery(opts: UsersQueryOpts) {
    (supabase.from as Mock).mockImplementation(() => ({
        select: () => ({
            eq: () => ({
                maybeSingle: () =>
                    opts.pendingMaybeSingle ??
                    Promise.resolve({
                        data: opts.existingRow ?? null,
                        error: opts.selectError ?? null,
                    }),
            }),
        }),
        insert: () => ({
            select: () => ({
                single: () =>
                    Promise.resolve({
                        data: opts.insertedRow ?? null,
                        error: null,
                    }),
            }),
        }),
    }));
}

const flush = () => new Promise<void>((res) => setTimeout(res, 0));

beforeEach(() => {
    vi.clearAllMocks();
    authMock.callback = null;
    (getUserProfile as Mock).mockReturnValue(null);
    useAuthStore.setState(
        { user: null, loading: true, showLogin: false, needsUsername: false },
        false
    );
    localStorage.clear();
});

afterEach(() => {
    cleanup();
});

describe('subscription lifecycle', () => {
    it('subscribes to onAuthStateChange on mount', () => {
        renderHook(() => useAuthEffects());
        expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes on unmount', () => {
        const { unmount } = renderHook(() => useAuthEffects());
        unmount();
        expect(authMock.unsubscribe).toHaveBeenCalledTimes(1);
    });
});

describe('handleSession: no session', () => {
    it('clears user, needsUsername and loading, and removes the local profile', async () => {
        localStorage.setItem('gate_user_profile', JSON.stringify({ id: 'u1' }));
        useAuthStore.setState(
            { user: { id: 'u1' } as never, needsUsername: true, loading: true },
            false
        );

        renderHook(() => useAuthEffects());
        authMock.callback!('SIGNED_OUT', null);
        await flush();

        expect(useAuthStore.getState().user).not.toBeNull(); // Reset with Guest Profile
        expect(useAuthStore.getState().needsUsername).toBe(false);
        expect(useAuthStore.getState().loading).toBe(false);
        expect(localStorage.getItem('gate_user_profile')).not.toBeNull();
    });

    it('does not query the users table', async () => {
        renderHook(() => useAuthEffects());
        authMock.callback!('SIGNED_OUT', null);
        await flush();

        expect(supabase.from).not.toHaveBeenCalled();
    });
});

describe('handleSession: existing user', () => {
    it('fetches the profile and stores it', async () => {
        mockUsersQuery({ existingRow: makeDbRow({ id: 'u1' }) });
        (getUserProfile as Mock).mockReturnValue({
            settings: { is_beta: false },
        });

        renderHook(() => useAuthEffects());
        authMock.callback!('SIGNED_IN', makeSession('u1'));
        await flush();

        expect(supabase.from).toHaveBeenCalledWith('users');
        expect(useAuthStore.getState().user).toMatchObject({
            id: 'u1',
            username: 'razen',
        });
        expect(useAuthStore.getState().loading).toBe(false);
    });

    it('skips the DB query when the same user is already loaded', async () => {
        mockUsersQuery({ existingRow: makeDbRow({ id: 'u1' }) });
        (getUserProfile as Mock).mockReturnValue({
            settings: { is_beta: false },
        });

        renderHook(() => useAuthEffects());

        authMock.callback!('SIGNED_IN', makeSession('u1'));
        await flush();
        expect(supabase.from).toHaveBeenCalledTimes(1);

        authMock.callback!('TOKEN_REFRESHED', makeSession('u1'));
        await flush();

        expect(supabase.from).toHaveBeenCalledTimes(1); // still 1
    });

    it('writes the built profile to localStorage', async () => {
        mockUsersQuery({ existingRow: makeDbRow({ id: 'u1' }) });
        (getUserProfile as Mock).mockReturnValue({
            settings: { is_beta: false },
        });

        renderHook(() => useAuthEffects());
        authMock.callback!('SIGNED_IN', makeSession('u1'));
        await flush();

        const stored = localStorage.getItem('gate_user_profile');
        expect(stored).not.toBeNull();
        expect(JSON.parse(stored!)).toMatchObject({
            id: 'u1',
            username: 'razen',
        });
    });

    it('calls refresh after loading the profile', async () => {
        mockUsersQuery({ existingRow: makeDbRow({ id: 'u1' }) });
        (getUserProfile as Mock).mockReturnValue({
            settings: { is_beta: false },
        });

        renderHook(() => useAuthEffects());
        authMock.callback!('SIGNED_IN', makeSession('u1'));
        await flush();

        expect(refreshMock).toHaveBeenCalledTimes(1);
    });
});

describe('handleSession: new user', () => {
    it('inserts a row when no profile exists and uses the inserted data', async () => {
        const inserted = makeDbRow({
            id: 'u2',
            username: 'boob',
            name: 'Boob',
        });
        mockUsersQuery({ existingRow: null, insertedRow: inserted });
        (getUserProfile as Mock).mockReturnValue({
            settings: { is_beta: false },
        });

        renderHook(() => useAuthEffects());
        authMock.callback!('SIGNED_IN', makeSession('u2'));
        await flush();

        expect(useAuthStore.getState().user).toMatchObject({
            id: 'u2',
            username: 'boob',
            name: 'Boob',
        });
    });
});

describe('handleSession: needsUsername', () => {
    it.each([
        {
            label: 'non-superuser with no username',
            supaId: 'u1',
            dbUsername: null,
            expected: true,
        },
        {
            label: 'superuser (id "1")',
            supaId: '1',
            dbUsername: null,
            expected: false,
        },
        {
            label: 'non-superuser with a username',
            supaId: 'u1',
            dbUsername: 'titan',
            expected: false,
        },
    ])(
        'sets needsUsername to $expected for $label',
        async ({ supaId, dbUsername, expected }) => {
            mockUsersQuery({
                existingRow: makeDbRow({
                    id: supaId,
                    username: dbUsername,
                    settings: { is_beta: true },
                }),
            });
            (getUserProfile as Mock).mockReturnValue({
                settings: { is_beta: true },
            });

            renderHook(() => useAuthEffects());
            authMock.callback!('SIGNED_IN', makeSession(supaId));
            await flush();

            expect(useAuthStore.getState().needsUsername).toBe(expected);
        }
    );
});

describe('handleSession: beta mode change', () => {
    it('re-queries the DB when the local beta state flips', async () => {
        mockUsersQuery({ existingRow: makeDbRow({ id: 'u1' }) });
        (getUserProfile as Mock).mockReturnValue({
            settings: { is_beta: false },
        });

        renderHook(() => useAuthEffects());

        authMock.callback!('SIGNED_IN', makeSession('u1'));
        await flush();
        expect(supabase.from).toHaveBeenCalledTimes(1);

        (getUserProfile as Mock).mockReturnValue({
            settings: { is_beta: true },
        });

        authMock.callback!('TOKEN_REFRESHED', makeSession('u1'));
        await flush();

        expect(supabase.from).toHaveBeenCalledTimes(2);
    });
});

describe('handleSession: errors', () => {
    it('toasts and clears loading when the DB query errors', async () => {
        mockUsersQuery({ selectError: { message: 'kaboom' } });
        (getUserProfile as Mock).mockReturnValue({
            settings: { is_beta: false },
        });

        renderHook(() => useAuthEffects());
        authMock.callback!('SIGNED_IN', makeSession('u1'));
        await flush();

        expect(toast.error).toHaveBeenCalledWith(
            'Session initialization error.'
        );
        expect(useAuthStore.getState().loading).toBe(false);
        expect(useAuthStore.getState().user).toBeNull();
    });
});

describe('unmount safety', () => {
    it('does not update the store when a pending DB query resolves after unmount', async () => {
        let resolveQuery!: (v: { data: unknown; error: unknown }) => void;
        const pending = new Promise<{ data: unknown; error: unknown }>(
            (res) => {
                resolveQuery = res;
            }
        );
        mockUsersQuery({ pendingMaybeSingle: pending });
        (getUserProfile as Mock).mockReturnValue({
            settings: { is_beta: false },
        });

        const { unmount } = renderHook(() => useAuthEffects());
        authMock.callback!('SIGNED_IN', makeSession('u1'));

        unmount();

        resolveQuery({ data: makeDbRow({ id: 'u1' }), error: null });
        await flush();

        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().loading).toBe(true); // still initial
    });

    it('hydrates the settings store with the fetched profile after login', async () => {
        mockUsersQuery({
            existingRow: makeDbRow({
                settings: { is_beta: true, sound: false },
            }),
        });

        // Force the settings store to a known "wrong" state
        useSettingsStore.setState(
            {
                settings: {
                    ...getInitialSettings(),
                    is_beta: false,
                    sound: true,
                },
            },
            false
        );

        renderHook(() => useAuthEffects());
        authMock.callback!('SIGNED_IN', makeSession('u1'));
        await flush();

        // THE ASSERTION THAT WOULD HAVE FAILED
        expect(useSettingsStore.getState().settings.is_beta).toBe(true);
        expect(useSettingsStore.getState().settings.sound).toBe(false);
    });
});
