import useSettings from '@/features/settings/hooks/useSettings';
import ToggleSwitch from '@/shared/components/ToggleSwitch';
import { version, last_updated } from '../../../../package.json';
import AskAI from '@/features/settings/components/AskAI';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useWebPush } from '@/features/dashboard/hooks/useWebPush';

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
                'Notifications are blocked by your browser settings. Please click the Lock icon 🔒 in your URL address bar to change permissions.',
            );
            return;
        }

        if (settings.notifications) disableNotifications();
        else enableNotifications();
    };

    return (
        <div className="pb-16 px-3 sm:px-4">
            <div className="space-y-0.5">
                <ToggleSwitch
                    isOn={settings.sound}
                    onToggle={() => handleSettingToggle('sound')}
                    label="Sound Effects"
                    disabled={isLoading}
                />

                <ToggleSwitch
                    label="Auto Timer"
                    onToggle={() => handleSettingToggle('autoTimer')}
                    isOn={settings.autoTimer}
                    disabled={isLoading}
                />

                <ToggleSwitch
                    label="Dark Mode"
                    onToggle={() => handleSettingToggle('darkMode')}
                    isOn={settings.darkMode}
                    disabled={isLoading}
                />

                <ToggleSwitch
                    label="Push Notifications"
                    onToggle={handleNotificationToggle}
                    isOn={settings.notifications}
                    disabled={isLoading}
                />

                <ToggleSwitch
                    label="Enable Beta Updates (Dangerous)"
                    onToggle={() => handleSettingToggle('is_beta')}
                    isOn={settings.is_beta}
                    disabled={isLoading}
                />

                <div className="border-t border-border-primary dark:border-border-primary-dark mt-3 pt-3">
                    <AskAI />
                </div>

                <div className="border-t border-border-primary dark:border-border-primary-dark mt-3 pt-3">
                    <h3 className="text-base font-semibold mb-2">App Information</h3>

                    <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Version</span>
                            <span>{APP_VERSION}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Last Updated</span>
                            <span>{APP_LAST_UPDATED_AT}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppSettings;
