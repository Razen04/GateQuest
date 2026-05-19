import useSettings from '@/features/settings/hooks/useSettings';
import ToggleSwitch from '@/shared/components/ToggleSwitch';
import { version, last_updated } from '../../../../package.json';
import AskAI from '@/features/settings/components/AskAI';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useWebPush } from '@/features/dashboard/hooks/useWebPush';

const AppSettings = () => {
    const { settings, handleSettingToggle } = useSettings();
    const { status, enableNotifications, disableNotifications } = useWebPush();
    const APP_VERSION = version;
    const APP_LAST_UPDATED_AT = last_updated;

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
        <div className="pb-20 px-4">
            <div className="space-y-1">
                <ToggleSwitch
                    isOn={settings.sound}
                    onToggle={() => handleSettingToggle('sound')}
                    label="Sound Effects"
                />
                <ToggleSwitch
                    label="Auto Timer"
                    onToggle={() => handleSettingToggle('autoTimer')}
                    isOn={settings.autoTimer}
                />

                <ToggleSwitch
                    label="Dark Mode"
                    onToggle={() => handleSettingToggle('darkMode')}
                    isOn={settings.darkMode}
                />

                <ToggleSwitch
                    label="Push Notifications"
                    onToggle={handleNotificationToggle}
                    isOn={settings.notifications}
                />

                <div className="py-3 border-t border-border-primary dark:border-border-primary-dark mt-3 pt-4">
                    <AskAI />
                </div>

                <div className="py-3 border-t border-border-primary dark:border-border-primary-dark mt-3 pt-3">
                    <h3 className="text-lg font-medium mb-2">App Information</h3>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span>Version</span>
                            <span>{APP_VERSION}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Last Updated</span>
                            <span>{APP_LAST_UPDATED_AT}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppSettings;
