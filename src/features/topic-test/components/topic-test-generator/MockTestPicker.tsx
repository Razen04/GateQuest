import { Clock } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MockState, ResolvedMock } from '@/shared/types/mock';
import { containerVariants, itemVariants } from '@/shared/utils/motionVariants';
import { useMockCatalog } from '../../hooks/useMockCatalog';
import { isMockBlocked } from '../../utils/mockState';
import MockAnnouncementDialog from '../mock/MockAnnouncementDialog';
import MockTestCard from './MockTestCard';

const ANNOUNCEMENT_DISMISSED_KEY = (mockId: string) =>
    `mock-announcement-dismissed-${mockId}`;

type Filter = 'all' | 'active' | 'completed';

const ACTIVE_STATES: MockState[] = [
    'login_required',
    'upcoming',
    'live',
    'resumable',
];

const COMPLETED_STATES: MockState[] = [
    'embargoed',
    'attempted',
    'donor_locked',
    'open',
];

const FILTER_LABELS: Record<Filter, string> = {
    all: 'All',
    active: 'Active',
    completed: 'Completed',
};

const MockTestPicker = () => {
    const navigate = useNavigate();
    const { mocks, loading, error } = useMockCatalog();
    const [filter, setFilter] = useState<Filter>('all');

    const [announcementDismissed, setAnnouncementDismissed] = useState(false);

    const announcementMock = useMemo(() => {
        if (announcementDismissed) return null;
        const candidates = mocks.filter(
            (m) =>
                !!m.announcement &&
                (m.state === 'live' || m.state === 'upcoming') &&
                !localStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY(m.mockId))
        );
        const preferred =
            candidates.find((m) => m.state === 'live') ?? candidates[0];
        return preferred ?? null;
    }, [mocks, announcementDismissed]);

    const counts = useMemo(
        () => ({
            all: mocks.length,
            active: mocks.filter((m) => ACTIVE_STATES.includes(m.state)).length,
            completed: mocks.filter((m) => COMPLETED_STATES.includes(m.state))
                .length,
        }),
        [mocks]
    );

    const filtered = useMemo(() => {
        if (filter === 'all') return mocks;
        const states = filter === 'active' ? ACTIVE_STATES : COMPLETED_STATES;
        return mocks.filter((m) => states.includes(m.state));
    }, [mocks, filter]);

    const handleSelect = (mock: ResolvedMock) => {
        if (isMockBlocked(mock)) return;
        switch (mock.state) {
            case 'login_required':
                navigate('/');
                return;
            case 'resumable':
                if (mock.sessionId) {
                    navigate(`/mock-tests/attempt/${mock.sessionId}`);
                }
                return;
            case 'embargoed':
            case 'attempted':
            case 'donor_locked':
                if (mock.sessionId) {
                    navigate(`/mock-tests/result/${mock.sessionId}`);
                }
                return;
            case 'live':
            case 'open':
                navigate(`/mock-tests/${mock.mockId}`);
                return;
            case 'upcoming':
                // Card is disabled for upcoming; unreachable.
                return;
        }
    };

    // ── Loading ────────────────────────────────────────────
    if (loading && mocks.length === 0) {
        return (
            <div>
                <label className="text-sm mb-4 font-semibold uppercase tracking-wide text-foreground block">
                    Select a Mock
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-56 border border-border bg-muted/20 animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    // ── Error ──────────────────────────────────────────────
    if (error) {
        return (
            <div className="text-sm text-destructive py-8 text-center border border-destructive/30 bg-destructive/5 p-4">
                Could not load mocks: {error}. Try refreshing the page or report
                it on Github or Discord.
            </div>
        );
    }

    // ── Empty ──────────────────────────────────────────────
    if (!loading && mocks.length === 0) {
        return (
            <div className="text-sm text-muted-foreground py-8 text-center border border-border bg-card/40 p-6">
                <Clock
                    size={32}
                    weight="duotone"
                    className="mx-auto mb-2 opacity-40"
                />
                No mock tests scheduled for your branch yet.
            </div>
        );
    }

    // ── Populated ──────────────────────────────────────────
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <label className="text-sm font-semibold uppercase tracking-wide text-foreground flex items-center gap-2">
                    <Clock size={16} className="text-chart-1" />
                    GateQuest Mock Series
                </label>

                <div className="flex bg-muted/40 border border-border p-1 w-fit">
                    {(['all', 'active', 'completed'] as Filter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                                filter === f
                                    ? 'bg-card shadow-sm text-chart-1'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {FILTER_LABELS[f]} ({counts[f]})
                        </button>
                    ))}
                </div>
            </div>

            <motion.p
                variants={itemVariants}
                className="text-xs text-muted-foreground my-6 text-center"
            >
                Attempts are free. Analysis, review, and leaderboard access
                unlock at tier 1+ (₹50 cumulative) or are free on beta mocks.
            </motion.p>

            {filtered.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center border border-border bg-card/40">
                    No {FILTER_LABELS[filter].toLowerCase()} mocks.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map((mock) => (
                        <MockTestCard
                            key={mock.mockId}
                            mock={mock}
                            onSelect={handleSelect}
                        />
                    ))}
                </div>
            )}

            <MockAnnouncementDialog
                mock={announcementMock}
                onDismiss={() => {
                    if (announcementMock) {
                        localStorage.setItem(
                            ANNOUNCEMENT_DISMISSED_KEY(announcementMock.mockId),
                            '1'
                        );
                    }
                    setAnnouncementDismissed(true);
                }}
            />
        </motion.div>
    );
};

export default MockTestPicker;
