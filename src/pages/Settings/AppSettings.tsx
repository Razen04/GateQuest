import ToggleSwitch from '../../components/ToggleSwitch.tsx';
import { Faders } from 'phosphor-react';
import useSettings from '../../hooks/useSettings.ts';

const AppSettings = () => {
    const { settings, handleSettingToggle } = useSettings();

    return (
        <div className="pb-20">
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

                <div className="py-3 border-t border-border-primary dark:border-border-primary-dark mt-3 pt-3">
                    <h3 className="text-lg font-medium mb-2">App Information</h3>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span>Version</span>
                            <span>0.7.5</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Last Updated</span>
                            <span>September 21, 2025</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppSettings;
