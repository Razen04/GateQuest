import {
    BellRinging,
    Clock,
    Cpu,
    GitBranch,
    SpeakerHigh,
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
import AccentPicker from '../components/AccentPicker';
import ThemeModePicker from '../components/ThemeModePicker';

const AppSettings = () => {
    const settings = useSettingsStore((s) => s.settings);
    const toggleSettings = useSettingsStore((s) => s.toggleSetting);
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

    return (
        <div className="space-y-8 px-2 pb-20 pt-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <h2 className="font-['Space_Grotesk',sans-serif] text-2xl font-black tracking-tight text-foreground">
                    Application Preferences
                </h2>
            </div>

            <div className="space-y-3">
                <p className="font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    USER EXPERIENCE & INTERACTION
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

                    <ThemeModePicker isLoading={isLoading} />

                    <AccentPicker isLoading={isLoading} />

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
