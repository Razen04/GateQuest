import {
    BookmarkIcon,
    TargetIcon,
    SlidersIcon,
    EyeIcon,
    HeartIcon,
    XIcon,
    ArrowRightIcon,
    ClockIcon,
    ChartBarIcon,
    BookOpenIcon,
    HighlighterIcon,
} from '@phosphor-icons/react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const ContinueSessionWidget = () => {
    const navigate = useNavigate();
    const [sessionUrl, setSessionUrl] = useState<string | null>(null);

    useEffect(() => {
        const lastSessionUrl = localStorage.getItem('gatequest_last_active_session');
        const lastTimestamp = localStorage.getItem('gatequest_last_active_timestamp');

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
    const isBookmarkMode =
        queryParams.get('bookmark') === 'true' || queryParams.get('bookmarked') === 'true';

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
        hoverBorderClass = 'hover:border-blue-200 dark:hover:border-blue-900/50';
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
            cardSubtitle = 'You disappeared mid-session. The questions took it personally.';
            badgeText = 'Solving PYQ';
            Icon = TargetIcon;
        } else if (segments[1]) {
            cardTitle = `${formatSlug(segments[1])} Pool`;
            cardSubtitle = 'Fresh questions waiting to test your confidence levels.';
            badgeText = 'Question List';
            Icon = BookOpenIcon;
        } else {
            cardTitle = 'Practice Arena';
            cardSubtitle = 'Welcome back soldier, today we fight silly little MCQs again.';
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
        hoverBorderClass = 'hover:border-amber-200 dark:hover:border-amber-900/50';
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
            cardSubtitle = 'Because your brain deletes information for fun apparently.';
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
        hoverBorderClass = 'hover:border-rose-200 dark:hover:border-rose-900/50';
        badgeClass =
            'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/50';

        if (segments[0] === 'topic-test-generate') {
            cardTitle = 'Configure Mock Paper';
            cardSubtitle = 'Customizing the exact exam that may emotionally damage you.';
            badgeText = 'Test Setup';
            Icon = SlidersIcon;
        } else if (segments[0] === 'topic-test-result') {
            cardTitle = 'Review Performance Analytics';
            cardSubtitle = 'Some numbers went up. Hopefully the important ones.';
            badgeText = 'Score Card';
            Icon = ChartBarIcon;
        } else if (segments[0] === 'topic-test-review') {
            cardTitle = 'Analyzing Test Solutions';
            cardSubtitle = 'Let’s calmly inspect where things became unfortunate.';
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
            cardSubtitle = 'One last peaceful screen before the academic violence begins.';
            badgeText = 'Exam Gate';
            Icon = ClockIcon;
        } else {
            cardTitle = 'Topic Test Center';
            cardSubtitle = 'Mocks, panic attacks, comeback arcs — everything lives here.';
            badgeText = 'Test Hub';
            Icon = ClockIcon;
        }
    }

    // Donate Route
    else if (segments[0] === 'donate') {
        cardTitle = 'Support GATEQuest';
        cardSubtitle = 'Aye, thanks for even thinking about donating. Means a lot genuinely 🫶';
        badgeText = 'Contribution';
        Icon = HeartIcon;

        iconColorClass = 'text-emerald-600 dark:text-emerald-400';
        iconBgClass = 'bg-emerald-50 dark:bg-emerald-500/10';
        hoverBorderClass = 'hover:border-emerald-200 dark:hover:border-emerald-900/50';

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
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-1">
                Continue Where You Left Off
            </h2>

            <div
                onClick={handleResume}
                className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 sm:p-5 mb-6 cursor-pointer shadow-sm transition-all duration-200 group ${hoverBorderClass}`}
            >
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
                    <div className="flex items-center gap-4">
                        <div
                            className={`flex-shrink-0 p-2.5 rounded-lg border border-transparent transition-colors ${iconBgClass}`}
                        >
                            <Icon className={`w-5 h-5 ${iconColorClass}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span
                                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClass}`}
                                >
                                    {badgeText}
                                </span>
                            </div>
                            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-black dark:group-hover:text-white transition-colors">
                                {cardTitle}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                {cardSubtitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                        <button className="flex items-center gap-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3.5 py-1.5 rounded-lg font-medium text-sm shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                            Resume
                            <ArrowRightIcon className="w-3.5 h-3.5" />
                        </button>

                        <button
                            onClick={handleClear}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Dismiss session"
                            aria-label="Dismiss session"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
