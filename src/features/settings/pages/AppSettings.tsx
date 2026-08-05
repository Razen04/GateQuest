import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    SpeakerHigh,
    Timer,
    MoonStars,
    BellRinging,
    WarningCircle,
    Cpu,
    GitBranch,
    Clock,
    Sliders,
    Sparkle,
} from '@phosphor-icons/react';

import useSettings from '@/features/settings/hooks/useSettings';
import ToggleSwitch from '@/shared/components/ToggleSwitch';
import AskAI from '@/features/settings/components/AskAI';
import { useWebPush } from '@/features/dashboard/hooks/useWebPush';
import { version, last_updated } from '../../../../package.json';

const AppSettings = () => {
    const { settings, handleSettingToggle, isUpdatingSettings } = useSettings();
    const { status, enableNotifications, disableNotifications, isProcessing } = useWebPush();
    const APP_VERSION = version;
    const APP_LAST_UPDATED_AT = last_updated;

    const isLoading = isUpdatingSettings || isProcessing;

    useEffect(() => {
        if (
            'Notification' in window &&
            Notification.permission === 'denied' &&
            settings.notifications
        ) {
            handleSettingToggle('notifications', false);
        }
    }, [settings.notifications, handleSettingToggle]);

    const handleNotificationToggle = () => {
        if (isProcessing) return;

        if (status === 'unsupported') {
            toast.error('Web Push notifications are not supported on this browser.');
            return;
        }

        if (status === 'denied') {
            toast.info(
                'Notifications are blocked by browser settings. Click the lock icon in your browser URL bar to grant permission.',
            );
            return;
        }

        if (settings.notifications) disableNotifications();
        else enableNotifications();
    };

    return (
        <div className="space-y-8 px-2 pb-20 pt-4">
            {/* Header Title */}
            <div className="flex items-center justify-between border-b border-slate-900/10 pb-4 dark:border-white/10">
                <div className="space-y-1">
                    <p className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.25em] text-[#2A5CFF]">
                        CONTROL // CENTER
                    </p>
                    <h2 className="font-['Space_Grotesk',sans-serif] text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        Application Preferences
                    </h2>
                </div>
                <div className="flex items-center gap-2 border border-slate-900/10 bg-slate-50/50 px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.02]">
                    <Sliders size={16} className="text-[#2A5CFF]" />
                    <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-600 dark:text-slate-300">
                        CONFIG MATRIX
                    </span>
                </div>
            </div>

            {/* Core Preferences Matrix */}
            <div className="space-y-3">
                <p className="font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    // USER EXPERIENCE & INTERACTION
                </p>

                <div className="grid grid-cols-1 gap-3">
                    <ToggleSwitch
                        icon={<SpeakerHigh size={20} />}
                        title="Sound Effects"
                        description="Audio cues for study timers, quiz submission, and milestone achievements"
                        isOn={settings.sound}
                        onToggle={() => handleSettingToggle('sound')}
                        disabled={isLoading}
                    />

                    <ToggleSwitch
                        icon={<Timer size={20} />}
                        title="Auto-Start Session Timer"
                        description="Automatically launch practice timers when starting new question"
                        isOn={settings.autoTimer}
                        onToggle={() => handleSettingToggle('autoTimer')}
                        disabled={isLoading}
                    />

                    <ToggleSwitch
                        icon={<MoonStars size={20} />}
                        title="High-Contrast Dark Theme"
                        description="Optimize UI contrast for nighttime study and reduced eye strain"
                        isOn={settings.darkMode}
                        onToggle={() => handleSettingToggle('darkMode')}
                        disabled={isLoading}
                    />

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
                        onToggle={() => handleSettingToggle('is_beta')}
                        disabled={isLoading}
                        isDanger
                    />
                </div>
            </div>

            {/* AI Assistant Module */}
            <div className="relative overflow-hidden border border-slate-900/10 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm dark:border-white/10 dark:from-white/[0.03] dark:to-white/[0.01]">
                <div className="mb-3 flex items-center gap-2">
                    <Sparkle size={18} className="text-[#2A5CFF]" weight="fill" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        AI Integration (Cause Everyone is doing this shit, it is kinda helpful
                        though)
                    </span>
                </div>
                <AskAI />
            </div>

            {/* App Telemetry Footer */}
            <div className="border border-slate-900/10 bg-slate-50/50 p-6 dark:border-white/10 dark:bg-white/[0.02]">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Cpu size={18} className="text-slate-400" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            Build Telemetry & Info
                        </h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 font-['JetBrains_Mono',monospace] sm:grid-cols-2">
                    <div className="flex items-center justify-between border border-slate-900/5 bg-white p-3.5 dark:border-white/5 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <GitBranch size={16} />
                            <span className="text-xs">Version</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                            v{APP_VERSION}
                        </span>
                    </div>

                    <div className="flex items-center justify-between border border-slate-900/5 bg-white p-3.5 dark:border-white/5 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Clock size={16} />
                            <span className="text-xs">Last Updated</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {APP_LAST_UPDATED_AT}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppSettings;
