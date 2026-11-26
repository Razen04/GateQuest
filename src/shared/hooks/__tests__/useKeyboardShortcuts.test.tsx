import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useKeyboardShortcuts from '../useKeyboardShortcuts';

const press = (code: string) => {
    act(() => {
        document.dispatchEvent(
            new KeyboardEvent('keydown', { code, bubbles: true })
        );
    });
};

describe('useKeyboardShortcuts', () => {
    it('navigates with Q/W and arrows and opens explanations with Slash', () => {
        const onPrev = vi.fn();
        const onNext = vi.fn();
        const onExplain = vi.fn();
        renderHook(() => useKeyboardShortcuts({ onPrev, onNext, onExplain }));

        press('KeyW');
        press('ArrowRight');
        expect(onNext).toHaveBeenCalledTimes(2);

        press('KeyQ');
        press('ArrowLeft');
        expect(onPrev).toHaveBeenCalledTimes(2);

        press('Slash');
        expect(onExplain).toHaveBeenCalledOnce();
    });

    it('dispatches option selection by default', () => {
        const listener = vi.fn();
        window.addEventListener('selectOptionByIndex', listener);
        renderHook(() =>
            useKeyboardShortcuts({ onPrev: vi.fn(), onNext: vi.fn() })
        );

        press('KeyC');
        expect(listener).toHaveBeenCalledOnce();
        expect(listener.mock.calls[0]?.[0]).toMatchObject({ detail: 2 });
        window.removeEventListener('selectOptionByIndex', listener);
    });

    it('keeps navigation but disables option selection in review mode', () => {
        const listener = vi.fn();
        window.addEventListener('selectOptionByIndex', listener);
        const onPrev = vi.fn();
        const onNext = vi.fn();
        renderHook(() =>
            useKeyboardShortcuts({
                onPrev,
                onNext,
                enableOptionSelection: false,
            })
        );

        press('KeyC');
        expect(listener).not.toHaveBeenCalled();
        press('KeyW');
        expect(onNext).toHaveBeenCalledOnce();
        press('KeyQ');
        expect(onPrev).toHaveBeenCalledOnce();
        window.removeEventListener('selectOptionByIndex', listener);
    });

    it('ignores shortcuts while typing in an input', () => {
        const onNext = vi.fn();
        renderHook(() => useKeyboardShortcuts({ onPrev: vi.fn(), onNext }));
        const input = document.createElement('input');
        document.body.appendChild(input);

        act(() => {
            input.dispatchEvent(
                new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true })
            );
        });
        expect(onNext).not.toHaveBeenCalled();
        input.remove();
    });
});
