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

vi.mock('sonner', () => ({
    toast: { error: vi.fn(), success: vi.fn() },
}));

import { toast } from 'sonner';
import { useAuthStore } from '@/app/stores/useAuthStore';
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
    useAuthStore.setState(
        { user: null, loading: true, showLogin: false },
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
    it('sets a guest user', async () => {
        renderHook(() => useAuthEffects());
        authMock.callback!('SIGNED_OUT', null);
        await flush();

        const user = useAuthStore.getState().user;
        expect(user).not.toBeNull();
        expect(user?.id).toBe('1');
        expect(useAuthStore.getState().loading).toBe(false);
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

        renderHook(() => useAuthEffects());

        authMock.callback!('SIGNED_IN', makeSession('u1'));
        await flush();
        expect(supabase.from).toHaveBeenCalledTimes(1);

        authMock.callback!('TOKEN_REFRESHED', makeSession('u1'));
        await flush();

        expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    it('calls refresh after loading the profile', async () => {
        mockUsersQuery({ existingRow: makeDbRow({ id: 'u1' }) });

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

describe('handleSession: beta mode change', () => {
    it('re-queries the DB when the user settings in the auth store flip', async () => {
        mockUsersQuery({
            existingRow: makeDbRow({ id: 'u1', settings: { is_beta: false } }),
        });

        renderHook(() => useAuthEffects());

        authMock.callback!('SIGNED_IN', makeSession('u1'));
        await flush();
        expect(supabase.from).toHaveBeenCalledTimes(1);

        const current = useAuthStore.getState().user;
        if (current) {
            useAuthStore.setState({
                user: {
                    ...current,
                    settings: { ...current.settings, is_beta: true },
                } as never,
            });
        }

        authMock.callback!('TOKEN_REFRESHED', makeSession('u1'));
        await flush();

        expect(supabase.from).toHaveBeenCalledTimes(2);
    });
});

describe('handleSession: errors', () => {
    it('toasts and clears loading when the DB query errors', async () => {
        mockUsersQuery({ selectError: { message: 'kaboom' } });

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

        const { unmount } = renderHook(() => useAuthEffects());
        authMock.callback!('SIGNED_IN', makeSession('u1'));

        unmount();

        resolveQuery({ data: makeDbRow({ id: 'u1' }), error: null });
        await flush();

        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().loading).toBe(true);
    });
});
