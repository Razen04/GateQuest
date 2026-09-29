import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentUser } from '@/shared/api/auth';
import type { Settings } from '@/shared/types/Settings';
import { getUserProfile } from '@/shared/utils/helper';
import { supabase } from '@/shared/utils/supabaseClient';
import { useAuthStore } from '../useAuthStore';
import { getInitialSettings, useSettingsStore } from '../useSettingsStore';

vi.mock('@/shared/utils/helper', () => ({
    getUserProfile: vi.fn(() => null),
}));

vi.mock('@/shared/utils/supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

vi.mock('@/shared/api/auth', () => ({
    getCurrentUser: vi.fn(),
}));

const initialSettingsState = useSettingsStore.getState();

beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({
        settings: { ...initialSettingsState.settings },
        isUpdatingSettings: false,
    });
    useAuthStore.setState({ user: null } as any);
});

describe('setSetting', () => {
    it('upadates a single key and leave others untouches', () => {
        const before = useSettingsStore.getState().settings;

        useSettingsStore.getState().setSetting('sound', false);

        const after = useSettingsStore.getState().settings;
        expect(after.sound).toBe(false);
        expect(after.darkMode).toBe(before.darkMode);
        expect(after.aiProvider).toBe(before.aiProvider);
    });

    it('produces a new object reference', () => {
        const before = useSettingsStore.getState().settings;

        useSettingsStore.getState().setSetting('sound', true);

        const after = useSettingsStore.getState().settings;
        expect(after).not.toBe(before);
    });
});

describe('toggleSetting', () => {
    it('flips a boolean when no val is provided', () => {
        useSettingsStore.getState().setSetting('sound', true);

        useSettingsStore.getState().toggleSetting('sound');
        expect(useSettingsStore.getState().settings.sound).toBe(false);

        useSettingsStore.getState().toggleSetting('sound');
        expect(useSettingsStore.getState().settings.sound).toBe(true);
    });

    it('sets explicitly when val is provided', () => {
        useSettingsStore.getState().setSetting('sound', true);

        useSettingsStore.getState().toggleSetting('sound', false);
        expect(useSettingsStore.getState().settings.sound).toBe(false);

        // Calling again with the same value keeps it — no flip
        useSettingsStore.getState().toggleSetting('sound', false);
        expect(useSettingsStore.getState().settings.sound).toBe(false);
    });
});

describe('setSettings', () => {
    it('replaces settings entirely', () => {
        const next: Settings = {
            ...initialSettingsState.settings,
            aiProvider: 'claude',
            sound: false,
        };

        useSettingsStore.getState().setSettings(next);

        expect(useSettingsStore.getState().settings).toBe(next);
    });
});

describe('handleUserAnonymity', () => {
    it('updates supabase and mirrors the change to useAuthStore', async () => {
        // getCurrentUser returns a user
        (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: 'u1',
        });

        const eq = vi.fn().mockResolvedValue({ error: null });
        const update = vi.fn(() => ({ eq }));
        const from = vi.fn(() => ({ update }));
        (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(from);

        // Put a user in the auth store so the mirror-update branch runs
        useAuthStore.setState({
            user: { id: 'u1', is_public: false } as any,
        });

        await useSettingsStore.getState().handleUserAnonymity(true);

        // Assert the network call
        expect(from).toHaveBeenCalledWith('users');
        expect(update).toHaveBeenCalledWith({ is_public: true });
        expect(eq).toHaveBeenCalledWith('id', 'u1');

        // Assert the cross-store mirror
        expect(useAuthStore.getState().user?.is_public).toBe(true);
    });

    it('does nothing when there is no authenticated user', async () => {
        (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        await useSettingsStore.getState().handleUserAnonymity(true);

        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('throws when supabase returns an error', async () => {
        (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: 'u1',
        });

        const eq = vi.fn().mockResolvedValue({ error: new Error('kaboom') });
        const update = vi.fn(() => ({ eq }));
        (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ update });

        await expect(
            useSettingsStore.getState().handleUserAnonymity(true)
        ).rejects.toThrow('kaboom');
    });

    it('does not crash when the auth store has no user', async () => {
        (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: 'u1',
        });
        const eq = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
            update: () => ({ eq }),
        });
        useAuthStore.setState({ user: null });

        await expect(
            useSettingsStore.getState().handleUserAnonymity(true)
        ).resolves.toBeUndefined();
    });
});

describe('initial settings', () => {
    it('merges partial profiles with default settings', () => {
        vi.mocked(getUserProfile).mockReturnValue({
            settings: { sound: false },
        } as any);

        const settings = getInitialSettings();

        expect(settings.sound).toBe(false);
        expect(settings.darkMode).toBe(true);
    });

    it('uses profile settings when they exist', async () => {
        vi.resetModules();
        vi.doMock('@/shared/utils/helper', () => ({
            getUserProfile: () => ({
                settings: {
                    sound: false,
                    darkMode: false,
                    aiProvider: 'claude',
                },
            }),
        }));

        const { useSettingsStore: fresh } = await import('../useSettingsStore');
        const s = fresh.getState().settings;
        expect(s.sound).toBe(false);
        expect(s.darkMode).toBe(false);
        expect(s.aiProvider).toBe('claude');
    });
});
