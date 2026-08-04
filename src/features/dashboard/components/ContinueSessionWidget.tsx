import {
    ArrowRightIcon,
    BookmarkIcon,
    BookOpenIcon,
    ChartBarIcon,
    ClockIcon,
    EyeIcon,
    HeartIcon,
    HighlighterIcon,
    SlidersIcon,
    TargetIcon,
    XIcon,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const ContinueSessionWidget = () => {
    const navigate = useNavigate();
    const [sessionUrl, setSessionUrl] = useState<string | null>(null);

    useEffect(() => {
        const lastSessionUrl = localStorage.getItem(
            'gatequest_last_active_session'
        );
        const lastTimestamp = localStorage.getItem(
            'gatequest_last_active_timestamp'
        );

        if (lastSessionUrl && lastTimestamp) {
            const threeDays = 3 * 24 * 60 * 60 * 1000;
            if (Date.now() - Number(lastTimestamp) < threeDays) {
                setSessionUrl(lastSessionUrl);
            }
        }
    }, []);

    if (!sessionUrl) return null;

    const [pathPart, searchPart] = sessionUrl.split('?');
    const segments = pathPart?.split('/').filter(Boolean) || [];
    const queryParams = new URLSearchParams(searchPart || '');
    const isBookmarkMode = queryParams.get('attempt') === 'bookmarked';

    let cardTitle = 'Continue Learning';
    let cardSubtitle = 'Pick up exactly where you paused.';
    let badgeText = 'Resume';
    let Icon = BookOpenIcon;
    let iconColorClass = 'text-zinc-600 dark:text-zinc-400';
    let iconBgClass = 'bg-zinc-100 dark:bg-zinc-800/50';
    let hoverBorderClass = 'hover:border-zinc-300 dark:hover:border-zinc-700';
    let badgeClass =
        'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';

    const formatSlug = (slug: string) => {
        if (!slug) return '';
        return slug
            .split('-')
            .map((word) => word.toUpperCase())
            .join(' ');
    };

    // Practice Route
    if (segments[0] === 'practice') {
        iconColorClass = 'text-blue-600 dark:text-blue-400';
        iconBgClass = 'bg-blue-50 dark:bg-blue-500/10';
        hoverBorderClass =
            'hover:border-blue-200 dark:hover:border-blue-900/50';
        badgeClass =
            'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50';

        if (isBookmarkMode && segments[1]) {
            cardTitle = `Bookmarked Pool: ${formatSlug(segments[1])}`;
            cardSubtitle =
                'Stuff you bookmarked because “I’ll revise this later” sounded believable.';
            badgeText = 'Bookmarks';
            Icon = BookmarkIcon;
        } else if (segments[1] && segments[2]) {
            cardTitle = `${formatSlug(segments[1])} • Active Session`;
            cardSubtitle =
                'You disappeared mid-session. The questions took it personally.';
            badgeText = 'Solving PYQ';
            Icon = TargetIcon;
        } else if (segments[1]) {
            cardTitle = `${formatSlug(segments[1])} Pool`;
            cardSubtitle =
                'Fresh questions waiting to test your confidence levels.';
            badgeText = 'Question List';
            Icon = BookOpenIcon;
        } else {
            cardTitle = 'Practice Arena';
            cardSubtitle =
                'Welcome back soldier, today we fight silly little MCQs again.';
            badgeText = 'Practice Hub';
            Icon = BookOpenIcon;
        }
    }

    // Revision Route
    else if (segments[0] === 'revision') {
        const revisionId = segments[1];
        const subject = segments[2];
        const questionId = segments[3];

        iconColorClass = 'text-amber-600 dark:text-amber-400';
        iconBgClass = 'bg-amber-50 dark:bg-amber-500/10';
        hoverBorderClass =
            'hover:border-amber-200 dark:hover:border-amber-900/50';
        badgeClass =
            'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50';

        if (revisionId && subject && questionId) {
            cardTitle = `Smart Revision: ${formatSlug(subject)}`;
            cardSubtitle = 'Revisiting one very specific academic betrayal.';
            badgeText = 'Revision Card';
            Icon = TargetIcon;
        } else if (revisionId) {
            cardTitle = 'Smart Revision List';
            cardSubtitle = 'A carefully curated museum of your past mistakes.';
            badgeText = 'Revision Queue';
            Icon = ListOfItemsIcon(HighlighterIcon);
        } else {
            cardTitle = 'Smart Revision Center';
            cardSubtitle =
                'Because your brain deletes information for fun apparently.';
            badgeText = 'Revision Hub';
            Icon = HighlighterIcon;
        }
    }

    // Topic Test Route
    else if (
        segments[0] === 'topic-test' ||
        segments[0] === 'topic-test-generate' ||
        segments[0] === 'topic-test-result' ||
        segments[0] === 'topic-test-review'
    ) {
        iconColorClass = 'text-rose-600 dark:text-rose-400';
        iconBgClass = 'bg-rose-50 dark:bg-rose-500/10';
        hoverBorderClass =
            'hover:border-rose-200 dark:hover:border-rose-900/50';
        badgeClass =
            'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/50';

        if (segments[0] === 'topic-test-generate') {
            cardTitle = 'Configure Mock Paper';
            cardSubtitle =
                'Customizing the exact exam that may emotionally damage you.';
            badgeText = 'Test Setup';
            Icon = SlidersIcon;
        } else if (segments[0] === 'topic-test-result') {
            cardTitle = 'Review Performance Analytics';
            cardSubtitle =
                'Some numbers went up. Hopefully the important ones.';
            badgeText = 'Score Card';
            Icon = ChartBarIcon;
        } else if (segments[0] === 'topic-test-review') {
            cardTitle = 'Analyzing Test Solutions';
            cardSubtitle =
                'Let’s calmly inspect where things became unfortunate.';
            badgeText = 'Solution Audit';
            Icon = EyeIcon;
        } else if (segments[2] === 'attempt') {
            cardTitle = 'Live Exam In Progress';
            cardSubtitle = "Your timer is paused. Sadly, your syllabus isn't.";
            badgeText = 'Live Test';
            Icon = ClockIcon;

            badgeClass =
                'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/50 animate-pulse font-bold';
        } else if (segments[1]) {
            cardTitle = 'Topic Test Lobby';
            cardSubtitle =
                'One last peaceful screen before the academic violence begins.';
            badgeText = 'Exam Gate';
            Icon = ClockIcon;
        } else {
            cardTitle = 'Topic Test Center';
            cardSubtitle =
                'Mocks, panic attacks, comeback arcs — everything lives here.';
            badgeText = 'Test Hub';
            Icon = ClockIcon;
        }
    }

    // Donate Route
    else if (segments[0] === 'donate') {
        cardTitle = 'Support GATEQuest';
        cardSubtitle =
            'Aye, thanks for even thinking about donating. Means a lot genuinely 🫶';
        badgeText = 'Contribution';
        Icon = HeartIcon;

        iconColorClass = 'text-emerald-600 dark:text-emerald-400';
        iconBgClass = 'bg-emerald-50 dark:bg-emerald-500/10';
        hoverBorderClass =
            'hover:border-emerald-200 dark:hover:border-emerald-900/50';

        badgeClass =
            'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50';
    }

    // Helper syntax mapper
    function ListOfItemsIcon(Comp: any) {
        return Comp;
    }

    const handleResume = () => navigate(sessionUrl);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        localStorage.removeItem('gatequest_last_active_session');
        localStorage.removeItem('gatequest_last_active_timestamp');
        setSessionUrl(null);
    };

    return (
        <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Continue Where You Left Off
            </h2>

            <div
                onClick={handleResume}
                className={`group relative mb-6 cursor-pointer overflow-hidden border border-white/20 bg-white/20 p-3.5 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 dark:border-white/10 dark:bg-white/[0.06] ${hoverBorderClass}`}
            >
                {/* Glass reflection */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent dark:from-white/5" />

                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center border border-white/10 backdrop-blur-md ${iconBgClass}`}
                        >
                            <Icon className={`h-5 w-5 ${iconColorClass}`} />
                        </div>

                        <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                                <span
                                    className={`border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${badgeClass}`}
                                >
                                    {badgeText}
                                </span>
                            </div>

                            <h3 className="truncate text-sm font-semibold leading-tight text-zinc-900 transition-colors dark:text-zinc-50">
                                {cardTitle}
                            </h3>

                            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                                {cardSubtitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <button className="flex items-center gap-1.5 border border-white/20 bg-white/30 px-3 py-1.5 text-sm font-medium text-zinc-900 shadow-sm backdrop-blur-md transition-all hover:bg-white/50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
                            Resume
                            <ArrowRightIcon className="h-3.5 w-3.5" />
                        </button>

                        <button
                            onClick={handleClear}
                            className="p-2 text-zinc-400 transition-all hover:bg-white/20 hover:text-zinc-700 dark:hover:text-zinc-300"
                            title="Dismiss session"
                            aria-label="Dismiss session"
                        >
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
