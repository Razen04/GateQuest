import {
    BellRinging,
    BookOpenIcon,
    Clock,
    Cpu,
    DeviceMobileIcon,
    GitBranch,
    MoonStars,
    MoonStarsIcon,
    PaletteIcon,
    Sliders,
    SpeakerHigh,
    SunIcon,
    Timer,
    WarningCircle,
} from '@phosphor-icons/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
import { useWebPush } from '@/features/dashboard/hooks/useWebPush';
import AskAI from '@/features/settings/components/AskAI';
import ToggleSwitch from '@/shared/components/ToggleSwitch';
import { last_updated, version } from '../../../../package.json';

const ACCENTS = [
    { id: 'default', label: 'Blue (Default)', swatch: 'oklch(0.62 0.22 255)' },
    { id: 'ocean', label: 'Ocean', swatch: 'oklch(0.62 0.22 190)' },
    { id: 'forest', label: 'Forest', swatch: 'oklch(0.62 0.22 140)' },
    { id: 'amber', label: 'Amber', swatch: 'oklch(0.7 0.18 70)' },
    { id: 'rose', label: 'Rose', swatch: 'oklch(0.62 0.22 340)' },
    { id: 'violet', label: 'Violet', swatch: 'oklch(0.6 0.22 275)' },
] as const;

const AppSettings = () => {
    const settings = useSettingsStore((s) => s.settings);
    const toggleSettings = useSettingsStore((s) => s.toggleSetting);
    const setSetting = useSettingsStore((s) => s.setSetting);
    const isUpdatingSettings = useSettingsStore((s) => s.isUpdatingSettings);

    const { status, enableNotifications, disableNotifications, isProcessing } =
        useWebPush();
    const APP_VERSION = version;
    const APP_LAST_UPDATED_AT = last_updated;

    const isLoading = isUpdatingSettings || isProcessing;

    useEffect(() => {
        if (
            'Notification' in window &&
            Notification.permission === 'denied' &&
            settings.notifications
        ) {
            toggleSettings('notifications');
        }
    }, [settings.notifications]);

    const handleNotificationToggle = () => {
        if (isProcessing) return;

        if (status === 'unsupported') {
            toast.error(
                'Web Push notifications are not supported on this browser.'
            );
            return;
        }

        if (status === 'denied') {
            toast.info(
                'Notifications are blocked by browser settings. Click the lock icon in your browser URL bar to grant permission.'
            );
            return;
        }

        if (settings.notifications) disableNotifications();
        else enableNotifications();
    };

    const THEME_MODES = [
        {
            id: 'light' as const,
            label: 'Light',
            preview: 'bg-white border-border',
            icon: SunIcon,
        },
        {
            id: 'sepia' as const,
            label: 'Sepia',
            preview: 'bg-[#1a140d] border-[#3a2e1e]',
            icon: BookOpenIcon,
        },
        {
            id: 'dark' as const,
            label: 'Dark',
            preview: 'bg-zinc-900 border-zinc-700',
            icon: MoonStarsIcon,
        },
        {
            id: 'amoled' as const,
            label: 'AMOLED',
            preview: 'bg-black border-zinc-800',
            icon: DeviceMobileIcon,
        },
    ];

    return (
        <div className="space-y-8 px-2 pb-20 pt-4">
            {/* Header Title */}
            <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="space-y-1">
                    <p className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.25em] text-chart-1">
                        CONTROL // CENTER
                    </p>
                    <h2 className="font-['Space_Grotesk',sans-serif] text-2xl font-black tracking-tight text-foreground">
                        Application Preferences
                    </h2>
                </div>
                <div className="flex items-center gap-2 border border-border bg-muted/50 px-3 py-1.5">
                    <Sliders size={16} className="text-chart-1" />
                    <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-muted-foreground">
                        CONFIG MATRIX
                    </span>
                </div>
            </div>

            {/* Core Preferences Matrix */}
            <div className="space-y-3">
                <p className="font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    // USER EXPERIENCE & INTERACTION
                </p>

                <div className="grid grid-cols-1 gap-3">
                    <ToggleSwitch
                        icon={<SpeakerHigh size={20} />}
                        title="Sound Effects"
                        description="Audio cues for study timers, quiz submission, and milestone achievements"
                        isOn={settings.sound}
                        onToggle={() => toggleSettings('sound')}
                        disabled={isLoading}
                    />

                    <ToggleSwitch
                        icon={<Timer size={20} />}
                        title="Auto-Start Session Timer"
                        description="Automatically launch practice timers when starting new question"
                        isOn={settings.autoTimer}
                        onToggle={() => toggleSettings('autoTimer')}
                        disabled={isLoading}
                    />

                    <div className="border border-border bg-muted/50 p-4 transition-all hover:border-muted-foreground/30">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-card text-muted-foreground">
                                    <MoonStars size={20} />
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                    <h4 className="font-grotesk text-sm font-bold text-foreground">
                                        Theme Mode
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Choose how the interface renders. AMOLED
                                        uses pure black to reduce power on OLED
                                        displays.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap sm:shrink-0">
                                {THEME_MODES.map((t) => {
                                    const active = settings.mode === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() =>
                                                setSetting('mode', t.id)
                                            }
                                            disabled={isLoading}
                                            className={`flex items-center gap-2 border px-2.5 py-1.5 transition-colors ${
                                                active
                                                    ? 'border-chart-1 bg-chart-1/10'
                                                    : 'border-border bg-card/50 hover:border-muted-foreground/40 hover:bg-accent/30'
                                            } disabled:cursor-not-allowed disabled:opacity-50`}
                                        >
                                            <div
                                                className={`h-4 w-4 shrink-0 border ${t.preview}`}
                                            />
                                            <span
                                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                                    active
                                                        ? 'text-chart-1'
                                                        : 'text-muted-foreground'
                                                }`}
                                            >
                                                {t.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Accent color picker — same surface language as the mode picker */}
                    <div className="border border-border bg-muted/50 p-4 transition-all hover:border-muted-foreground/30">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-card text-muted-foreground">
                                    <PaletteIcon size={20} />
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                    <h4 className="font-grotesk text-sm font-bold text-foreground">
                                        Accent Color
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Changes the highlight color across
                                        buttons, links, and selections.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap sm:shrink-0">
                                {ACCENTS.map((a) => {
                                    const active = settings.accent === a.id;
                                    return (
                                        <button
                                            key={a.id}
                                            type="button"
                                            onClick={() =>
                                                setSetting('accent', a.id)
                                            }
                                            disabled={isLoading}
                                            title={a.label}
                                            aria-label={`${a.label} accent`}
                                            aria-pressed={active}
                                            className={`h-8 w-8 border-2 transition-all ${
                                                active
                                                    ? 'border-foreground scale-110'
                                                    : 'border-border hover:scale-105 hover:border-muted-foreground'
                                            } disabled:cursor-not-allowed disabled:opacity-50`}
                                            style={{
                                                backgroundColor: a.swatch,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <ToggleSwitch
                        icon={<BellRinging size={20} />}
                        title="Web Push Notifications"
                        description="Receive streak reminders, goal alerts, and exam schedule updates"
                        isOn={settings.notifications}
                        onToggle={handleNotificationToggle}
                        disabled={isLoading}
                    />

                    <ToggleSwitch
                        icon={<WarningCircle size={20} />}
                        title="Enable Beta Channel"
                        description="Get early access to unreleased features. May include unstable build behavior"
                        isOn={settings.is_beta}
                        onToggle={() => toggleSettings('is_beta')}
                        disabled={isLoading}
                        isDanger
                    />
                </div>
            </div>

            {/* AI Assistant Module */}
            <div className="relative overflow-hidden border border-border bg-gradient-to-b from-card to-card/60 p-5 shadow-sm">
                <AskAI />
            </div>

            {/* App Telemetry Footer */}
            <div className="border border-border bg-muted/50 p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Cpu size={18} className="text-muted-foreground" />
                        <h3 className="text-sm font-bold text-foreground">
                            Build Telemetry & Info
                        </h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 font-['JetBrains_Mono',monospace] sm:grid-cols-2">
                    <div className="flex items-center justify-between border border-border bg-card p-3.5">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <GitBranch size={16} />
                            <span className="text-xs">Version</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">
                            v{APP_VERSION}
                        </span>
                    </div>

                    <div className="flex items-center justify-between border border-border bg-card p-3.5">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock size={16} />
                            <span className="text-xs">Last Updated</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">
                            {APP_LAST_UPDATED_AT}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppSettings;
