import type { ResolvedMock } from '@/shared/types/mock';

/** Compact UTC timestamp for calendar URLs: 20261125T033000Z */
const toUtcStamp = (ms: number): string =>
    new Date(ms)
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');

const escapeIcs = (value: string): string =>
    value
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');

const mockLink = (mock: ResolvedMock): string =>
    `${window.location.origin}/mock-tests/${mock.mockId}`;

const mockDescription = (mock: ResolvedMock): string =>
    [
        mock.blurb || mock.announcement || '',
        `${mock.questionCount} questions · ${mock.totalMarks} marks`,
        mockLink(mock),
    ]
        .filter(Boolean)
        .join('\n\n');

/** Google Calendar's templated "add event" URL. */
export function googleCalendarUrl(mock: ResolvedMock): string {
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: mock.label,
        dates: `${toUtcStamp(mock.startsAt)}/${toUtcStamp(mock.endsAt)}`,
        details: mockDescription(mock),
        location: mockLink(mock),
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * RFC 5545 iCalendar payload. Downloading this hands the event to whatever
 * calendar app the OS has registered as the default for .ics files.
 */
export function buildIcs(mock: ResolvedMock): string {
    const now = toUtcStamp(Date.now());
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//GATEQuest//Mock Test//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${mock.mockId}@gatequest`,
        `DTSTAMP:${now}`,
        `DTSTART:${toUtcStamp(mock.startsAt)}`,
        `DTEND:${toUtcStamp(mock.endsAt)}`,
        `SUMMARY:${escapeIcs(mock.label)}`,
        `DESCRIPTION:${escapeIcs(mockDescription(mock))}`,
        `URL:${mockLink(mock)}`,
        'END:VEVENT',
        'END:VCALENDAR',
    ];
    return `${lines.join('\r\n')}\r\n`;
}

/** Download the .ics so the device opens its default calendar app. */
export function downloadIcs(mock: ResolvedMock): void {
    const blob = new Blob([buildIcs(mock)], {
        type: 'text/calendar;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${mock.mockId}.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}
