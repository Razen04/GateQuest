import { useEffect } from 'react';

/**
 * Global keyboard shortcuts for the practice card.
 * - A: previous
 * - D: next
 * - Enter: show answer
 * - E: open explanation
 * Skips when typing in inputs/textarea and when meta/ctrl/alt pressed.
 */
export default function useKeyboardShortcuts(
  {
    onPrev,
    onNext,
    onShowAnswer,
    onExplain,
  },
  deps = []
) {
  useEffect(() => {
    const handleKeyStroke = (e) => {
      const tag = e.target?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }

      switch (e.code) {
        case 'KeyA':
          e.preventDefault();
          onPrev?.();
          break;
        case 'KeyD':
          e.preventDefault();
          onNext?.();
          break;
        case 'Enter':
          e.preventDefault();
          onShowAnswer?.();
          break;
        case 'KeyE':
          e.preventDefault();
          onExplain?.();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyStroke);
    return () => document.removeEventListener('keydown', handleKeyStroke);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}