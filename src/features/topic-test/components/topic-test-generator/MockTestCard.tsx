import { ArrowRight } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import type { MockState, ResolvedMock } from '@/shared/types/mock';
import { itemVariants } from '@/shared/utils/motionVariants';
import {
    fmtNum,
    formatCountdown,
    formatDateTime,
    formatDuration,
} from '../../utils/mockFormat';
import { isMockBlocked } from '../../utils/mockState';
import AddToCalendarButton from '../mock/AddToCalendarButton';

type CtaVariant = 'primary' | 'secondary' | 'warn' | 'muted';

interface CtaSpec {
    label: string;
    variant: CtaVariant;
    disabled?: boolean;
}

const CTA_VARIANT_CLASSES: Record<CtaVariant, string> = {
    primary: 'bg-chart-1 text-white',
    secondary: 'bg-card text-foreground border border-border',
    warn: 'bg-chart-4/10 text-chart-4 border border-chart-4/20',
    muted: 'bg-muted text-muted-foreground',
};

const STATE_CHIP: Record<MockState, { text: string; cls: string }> = {
    login_required: {
        text: 'Login Required',
        cls: 'bg-muted text-muted-foreground border border-border',
    },
    upcoming: {
        text: 'Upcoming',
        cls: 'bg-muted text-muted-foreground border border-border',
    },
    live: {
        text: 'Live',
        cls: 'bg-chart-2/10 text-chart-2 border border-chart-2/20',
    },
    resumable: {
        text: 'In Progress',
        cls: 'bg-chart-4/10 text-chart-4 border border-chart-4/20',
    },
    embargoed: {
        text: 'Results Locked',
        cls: 'bg-muted text-muted-foreground border border-border',
    },
    attempted: {
        text: 'Completed',
        cls: 'bg-chart-2/10 text-chart-2 border border-chart-2/20',
    },
    donor_locked: {
        text: 'Analysis Locked',
        cls: 'bg-chart-4/10 text-chart-4 border border-chart-4/20',
    },
    open: {
        text: 'Window Closed',
        cls: 'bg-muted text-muted-foreground border border-border',
    },
};

function ctaFor(mock: ResolvedMock): CtaSpec {
    if (isMockBlocked(mock)) {
        return {
            label: 'Finish ongoing test',
            variant: 'muted',
            disabled: true,
        };
    }
    switch (mock.state) {
        case 'login_required':
            return { label: 'Log in', variant: 'primary' };
        case 'upcoming':
            return { label: 'Not Yet Live', variant: 'muted', disabled: true };
        case 'live':
            return { label: 'Start Now', variant: 'primary' };
        case 'resumable':
            return { label: 'Resume', variant: 'primary' };
        case 'embargoed':
            return { label: 'Results Locked', variant: 'muted' };
        case 'attempted':
            return { label: 'View Result', variant: 'secondary' };
        case 'donor_locked':
            return { label: 'View Score', variant: 'warn' };
        case 'open':
            return { label: 'Practice Attempt', variant: 'secondary' };
    }
}

function timingText(mock: ResolvedMock): string {
    switch (mock.state) {
        case 'upcoming':
            return mock.secondsUntilStart != null
                ? `Starts in ${formatCountdown(mock.secondsUntilStart)}`
                : `Starts ${formatDateTime(new Date(mock.startsAt).toISOString())}`;
        case 'live':
        case 'resumable':
            return mock.secondsUntilEnd != null
                ? `Ends in ${formatCountdown(mock.secondsUntilEnd)}`
                : 'Window open';
        case 'embargoed':
            return mock.secondsUntilEnd != null
                ? `Results in ${formatCountdown(mock.secondsUntilEnd)}`
                : 'Results soon';
        case 'attempted':
            return mock.sessionScore != null
                ? `Score: ${fmtNum(mock.sessionScore)}/${mock.totalMarks}`
                : 'Completed';
        case 'donor_locked':
            return mock.sessionScore != null
                ? `Score: ${mock.sessionScore}/${mock.totalMarks} · Analysis locked`
                : 'Completed · Analysis locked';
        case 'open':
            return `Window closed ${formatDateTime(
                new Date(mock.endsAt).toISOString()
            )}`;
        case 'login_required':
            return 'Log in to attempt';
    }
}

interface MockTestCardProps {
    mock: ResolvedMock;
    onSelect: (mock: ResolvedMock) => void;
}

const MockTestCard = ({ mock, onSelect }: MockTestCardProps) => {
    const chip = STATE_CHIP[mock.state];
    const cta = ctaFor(mock);
    const disabled = cta.disabled === true;
    const showSeries = mock.seriesNumber != null && mock.seriesNumber < 9000;

    return (
        <motion.button
            variants={itemVariants}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onSelect(mock)}
            className={`text-left p-4 border transition-colors backdrop-blur-xl flex flex-col h-full ${
                disabled
                    ? 'border-border bg-card/20 cursor-not-allowed'
                    : 'border-border bg-card/40 hover:border-chart-1/50'
            }`}
        >
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {showSeries && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-chart-1/10 text-chart-1 border border-chart-1/20">
                        Series {mock.seriesNumber}
                    </span>
                )}
                {mock.isBeta ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-chart-2/10 text-chart-2 border border-chart-2/20">
                        Beta
                    </span>
                ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-chart-4/10 text-chart-4 border border-chart-4/20">
                        Tier {mock.postMinTier}+
                    </span>
                )}
                <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${chip.cls}`}
                >
                    {chip.text}
                </span>
            </div>

            {/* Title + blurb */}
            <h4 className="font-semibold text-sm text-foreground mb-1">
                {mock.label}
            </h4>
            {mock.blurb && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {mock.blurb}
                </p>
            )}

            {/* Meta grid */}
            <dl className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div>
                    <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">
                        Questions
                    </dt>
                    <dd className="font-semibold text-foreground">
                        {mock.questionCount}
                    </dd>
                </div>
                <div>
                    <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">
                        Marks
                    </dt>
                    <dd className="font-semibold text-foreground">
                        {mock.totalMarks}
                    </dd>
                </div>
                <div>
                    <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">
                        Duration
                    </dt>
                    <dd className="font-semibold text-foreground">
                        {formatDuration(mock.durationSeconds)}
                    </dd>
                </div>
            </dl>

            {/* Timing */}
            <p className="text-xs text-muted-foreground mb-3">
                {timingText(mock)}
            </p>
            {mock.state === 'upcoming' && (
                <div className="-mt-2 mb-3 flex items-center justify-between gap-2">
                    <p className="font-mono text-[11px] text-muted-foreground">
                        {formatDateTime(new Date(mock.startsAt).toISOString())}
                    </p>
                    <AddToCalendarButton mock={mock} compact />
                </div>
            )}

            {/* CTA — span, not button (parent is the button) */}
            <div className="mt-auto flex justify-end">
                <span
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${CTA_VARIANT_CLASSES[cta.variant]}`}
                >
                    {cta.label}
                    {!disabled && <ArrowRight size={12} weight="bold" />}
                </span>
            </div>

            {isMockBlocked(mock) && mock.activeTestLabel && (
                <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    Ongoing: {mock.activeTestLabel}
                </p>
            )}
        </motion.button>
    );
};

export default MockTestCard;
