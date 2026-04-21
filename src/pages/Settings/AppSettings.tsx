import { Faders } from '@phosphor-icons/react';
import useSettings from '../../hooks/useSettings.ts';
import ToggleSwitch from '@/components/ui/ToggleSwitch.tsx';
import { version, last_updated } from '../../../package.json';
import { PROVIDERS } from '@/data/ai_providers.ts';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import type { AIProvider } from '@/types/Settings.ts';
import { Label } from '@/components/ui/label.tsx';
import AskAI from '@/components/Settings/AppSettings/AskAI.tsx';

const AppSettings = () => {
    const { settings, handleSettingToggle } = useSettings();
    const APP_VERSION = version;
    const APP_LAST_UPDATED_AT = last_updated;

    return (
        <div className="pb-20 px-4">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Faders className="mr-2" /> App Settings
            </h2>

            <div className="space-y-4">
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
