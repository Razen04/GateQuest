import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFullscreenGuard } from '../useFullscreenGuard';

// Mock fullscreen API in jsdom
let mockFullscreenElement: Element | null = null;

beforeEach(() => {
    mockFullscreenElement = document.documentElement;

    Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => mockFullscreenElement,
    });

    Object.defineProperty(document.documentElement, 'requestFullscreen', {
        configurable: true,
        writable: true,
        value: vi.fn().mockImplementation(() => {
            mockFullscreenElement = document.documentElement;
            document.dispatchEvent(new Event('fullscreenchange'));
            return Promise.resolve();
        }),
    });

    sessionStorage.clear();
});

afterEach(() => {
    sessionStorage.clear();
    mockFullscreenElement = null;
});

function simulateExit() {
    mockFullscreenElement = null;
    document.dispatchEvent(new Event('fullscreenchange'));
}

function simulateEnter() {
    mockFullscreenElement = document.documentElement;
    document.dispatchEvent(new Event('fullscreenchange'));
}

describe('useFullscreenGuard', () => {
    it('starts with zero strikes', () => {
        const { result } = renderHook(() =>
            useFullscreenGuard({
                enabled: true,
                onStrikeOut: vi.fn(),
                storageKey: 'test-1',
            })
        );
        expect(result.current.strikes).toBe(0);
    });

    it('increments on fullscreen exit', () => {
        const { result } = renderHook(() =>
            useFullscreenGuard({
                enabled: true,
                onStrikeOut: vi.fn(),
                storageKey: 'test-2',
            })
        );
        act(() => simulateExit());
        expect(result.current.strikes).toBe(1);
    });

    it('does not increment when entering fullscreen', () => {
        const { result } = renderHook(() =>
            useFullscreenGuard({
                enabled: true,
                onStrikeOut: vi.fn(),
                storageKey: 'test-3',
            })
        );
        mockFullscreenElement = null; // start outside
        act(() => simulateEnter());
        expect(result.current.strikes).toBe(0);
    });

    it('fires onStrikeOut on the third exit', () => {
        const onStrikeOut = vi.fn();
        const { result } = renderHook(() =>
            useFullscreenGuard({
                enabled: true,
                onStrikeOut,
                storageKey: 'test-4',
            })
        );

        act(() => simulateExit());
        expect(onStrikeOut).not.toHaveBeenCalled();
        act(() => simulateEnter());
        act(() => simulateExit());
        expect(onStrikeOut).not.toHaveBeenCalled();
        act(() => simulateEnter());
        act(() => simulateExit());

        expect(result.current.strikes).toBe(3);
        expect(onStrikeOut).toHaveBeenCalledTimes(1);
    });

    it('persists strikes across remounts', () => {
        const { unmount } = renderHook(() =>
            useFullscreenGuard({
                enabled: true,
                onStrikeOut: vi.fn(),
                storageKey: 'test-5',
            })
        );
        act(() => simulateExit());
        act(() => simulateEnter());
        act(() => simulateExit());
        unmount();

        const { result } = renderHook(() =>
            useFullscreenGuard({
                enabled: true,
                onStrikeOut: vi.fn(),
                storageKey: 'test-5',
            })
        );
        expect(result.current.strikes).toBe(2);
    });

    it('does nothing when enabled is false', () => {
        const { result } = renderHook(() =>
            useFullscreenGuard({
                enabled: false,
                onStrikeOut: vi.fn(),
                storageKey: 'test-6',
            })
        );
        act(() => simulateExit());
        expect(result.current.strikes).toBe(0);
    });

    it('reset clears strikes and storage', () => {
        const { result } = renderHook(() =>
            useFullscreenGuard({
                enabled: true,
                onStrikeOut: vi.fn(),
                storageKey: 'test-7',
            })
        );
        act(() => simulateExit());
        expect(result.current.strikes).toBe(1);

        act(() => result.current.reset());
        expect(result.current.strikes).toBe(0);
        expect(sessionStorage.getItem('test-7')).toBeNull();
    });
});
