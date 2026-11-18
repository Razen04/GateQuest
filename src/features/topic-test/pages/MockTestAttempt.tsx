import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import ModernLoader from '@/shared/components/ModernLoader';
import { Button } from '@/shared/components/ui/button';
import { useFullscreenGuard } from '@/shared/hooks/useFullscreenGuard';
import { fetchTestById } from '../api/topicTest';
import ActiveTest from '../components/active-test/ActiveTest';
import { FullscreenPrompt } from '../components/mock/FullscreenPrompt';
import { StrikeBadge } from '../components/mock/StrikeBadge';
import {
    PreStartStrikeOut,
    StrikeOutOverlay,
} from '../components/mock/StrikeOutOverlays';
import { MockTestSessionProvider } from '../context/MockTestSessionProvider';
import useTest from '../hooks/test-engine/useTest';

const MAX_STRIKES = 3;
const PICKER_PATH = '/topic-test-generate?tab=mocks';

type BootState =
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | {
          kind: 'ready';
          status: 'created' | 'ongoing' | 'completed';
      };

export default function MockTestAttempt() {
    const { testId } = useParams<{ testId: string }>();
    const user = useAuthStore((s) => s.user);
    const isLogin = !!user && user.id !== '1';

    const [supported] = useState(
        () =>
            typeof document !== 'undefined' &&
            typeof document.documentElement.requestFullscreen === 'function'
    );
    const [enteredFullscreen, setEnteredFullscreen] = useState(
        () => typeof document !== 'undefined' && !!document.fullscreenElement
    );
    const [sessionStarted, setSessionStarted] = useState(false);
    const [strikeOut, setStrikeOut] = useState(false);
    const [boot, setBoot] = useState<BootState>({ kind: 'loading' });

    // The lobby already showed the instructions and the user pressed
    // Start. The attempt begins as soon as this screen is reachable,
    // i.e. once the fullscreen requirement is satisfied. Track that so
    // a strike-out after this point submits the attempt instead of
    // being treated as a pre-start cancellation.
    useEffect(() => {
        if (boot.kind !== 'ready') return;
        if (supported && !enteredFullscreen) return;
        setSessionStarted(true);
    }, [boot.kind, supported, enteredFullscreen]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const onChange = () =>
            setEnteredFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    // ─── Boot: fetch session status ─────────────────────────
    useEffect(() => {
        if (!testId) return;
        let cancelled = false;
        (async () => {
            const { data, error } = await fetchTestById(testId);
            if (cancelled) return;
            if (error || !data) {
                setBoot({ kind: 'error', message: 'Session not found.' });
                return;
            }
            const status = (data as { status?: string }).status;
            if (
                status === 'created' ||
                status === 'ongoing' ||
                status === 'completed'
            ) {
                setBoot({ kind: 'ready', status });
            } else {
                setBoot({
                    kind: 'error',
                    message: `Unrecognized session status: ${status ?? 'unknown'}`,
                });
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [testId]);

    const guard = useFullscreenGuard({
        enabled: !strikeOut && supported,
        storageKey: `fs-guard-${testId ?? 'unknown'}`,
        onStrikeOut: () => setStrikeOut(true),
    });

    if (!testId) return <Navigate to="/" replace />;
    if (!isLogin) return <Navigate to="/" replace />;

    if (boot.kind === 'loading') return <ModernLoader />;
    if (boot.kind === 'error') {
        return (
            <div className="p-8 text-center">
                <p className="text-sm text-destructive mb-4">{boot.message}</p>
                <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="rounded-none"
                >
                    Retry
                </Button>
            </div>
        );
    }

    // ─── Strike out ─────────────────────────────────────────
    if (strikeOut) {
        // Before-start strike-out: don't submit, session never started.
        if (boot.status === 'created' && !sessionStarted) {
            return (
                <PreStartStrikeOut
                    pickerPath={PICKER_PATH}
                    maxStrikes={MAX_STRIKES}
                />
            );
        }
        // Mid-test strike-out: submit as usual.
        return (
            <>
                <MockTestSessionProvider testId={testId}>
                    <AttemptInner strikeOut={true} />
                </MockTestSessionProvider>
                <StrikeOutOverlay testId={testId} maxStrikes={MAX_STRIKES} />
            </>
        );
    }

    // ─── Fullscreen prompt ──────────────────────────────────
    if (supported && !enteredFullscreen) {
        return (
            <>
                <FullscreenPrompt
                    strikes={guard.strikes}
                    maxStrikes={MAX_STRIKES}
                    onEnter={async () => {
                        try {
                            await document.documentElement.requestFullscreen();
                        } catch {
                            /* user denied */
                        }
                    }}
                />
                {guard.isSupported && (
                    <StrikeBadge strikes={guard.strikes} max={MAX_STRIKES} />
                )}
            </>
        );
    }

    // ─── Completed: provider will redirect to result ────────
    if (boot.status === 'completed') {
        return (
            <MockTestSessionProvider testId={testId}>
                <AttemptInner strikeOut={false} />
            </MockTestSessionProvider>
        );
    }

    // ─── Ongoing: resume — skip gate ────────────────────────
    if (boot.status === 'ongoing') {
        return (
            <>
                <MockTestSessionProvider testId={testId}>
                    <AttemptInner strikeOut={false} />
                </MockTestSessionProvider>
                {guard.isSupported && enteredFullscreen && (
                    <StrikeBadge strikes={guard.strikes} max={MAX_STRIKES} />
                )}
            </>
        );
    }

    // ─── Fresh: start immediately ───────────────────────────
    // Instructions + Start live in the lobby; the gate used to repeat
    // them here, which showed the same rules twice in a row.
    return (
        <>
            <MockTestSessionProvider testId={testId}>
                <AttemptInner strikeOut={false} />
            </MockTestSessionProvider>
            {guard.isSupported && enteredFullscreen && (
                <StrikeBadge strikes={guard.strikes} max={MAX_STRIKES} />
            )}
        </>
    );
}

function AttemptInner({ strikeOut }: { strikeOut: boolean }) {
    const { handleSubmit } = useTest();
    const submittedRef = useRef(false);

    useEffect(() => {
        if (strikeOut && !submittedRef.current) {
            submittedRef.current = true;
            void handleSubmit();
        }
    }, [strikeOut, handleSubmit]);

    if (strikeOut) return null;
    return <ActiveTest />;
}
