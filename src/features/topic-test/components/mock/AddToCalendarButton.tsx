import {
    CalendarPlusIcon,
    DownloadSimpleIcon,
    GoogleLogoIcon,
} from '@phosphor-icons/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import type { ResolvedMock } from '@/shared/types/mock';
import { downloadIcs, googleCalendarUrl } from '../../utils/calendar';

type AddToCalendarButtonProps = {
    mock: ResolvedMock;
    /** Small inline trigger for the mock cards. */
    compact?: boolean;
};

export default function AddToCalendarButton({
    mock,
    compact = false,
}: AddToCalendarButtonProps) {
    // Only before the window opens — never for live/completed attempts.
    if (mock.state !== 'upcoming') return null;

    const handleGoogle = () => {
        window.open(googleCalendarUrl(mock), '_blank', 'noopener,noreferrer');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                className={
                    compact
                        ? 'inline-flex items-center rounded-none gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-chart-1 transition-colors'
                        : 'inline-flex items-center gap-2 border rounded-none border-border bg-card/60 px-3.5 py-2 text-sm font-semibold text-foreground hover:border-chart-1/50 transition-colors'
                }
                aria-label="Add to your calendar"
            >
                <CalendarPlusIcon size={compact ? 13 : 18} />
                Add to your calendar
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none">
                <DropdownMenuItem
                    onSelect={handleGoogle}
                    className="rounded-none"
                >
                    <GoogleLogoIcon size={16} />
                    Google Calendar
                </DropdownMenuItem>
                <DropdownMenuItem
                    onSelect={() => downloadIcs(mock)}
                    className="rounded-none"
                >
                    <DownloadSimpleIcon size={16} />
                    Other calendar apps (.ics)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
