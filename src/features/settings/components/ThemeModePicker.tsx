import { LockSimpleIcon, MoonStarsIcon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
import { getDonorTier, isModeLocked } from '@/shared/types/donor';
import { THEME_MODES } from '../data/appSettingsData';

const ThemeModePicker = ({ isLoading }: { isLoading: boolean }) => {
    const settings = useSettingsStore((s) => s.settings);
    const setSetting = useSettingsStore((s) => s.setSetting);

    const user = useAuthStore((s) => s.user);
    const tier = getDonorTier(user?.notification_tags);

    return (
        <div className="border border-border bg-muted/50 p-4 transition-all hover:border-muted-foreground/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: icon + labels */}
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-card text-muted-foreground">
                        <MoonStarsIcon size={20} />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                        <h4 className="font-grotesk text-sm font-bold text-foreground">
                            Theme Mode
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Choose how the interface renders. AMOLED uses pure
                            black to reduce power on OLED displays.
                        </p>
                    </div>
                </div>

                {/* Right: pickers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:shrink-0">
                    {THEME_MODES.map((t) => {
                        const active = settings.mode === t.id;
                        const locked = isModeLocked(t.id, tier);
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                    if (locked) return;
                                    setSetting('mode', t.id);
                                }}
                                disabled={isLoading}
                                aria-label={
                                    locked
                                        ? `${t.label} mode — supporter perk`
                                        : `Use ${t.label} mode`
                                }
                                aria-disabled={locked}
                                className={`group relative flex flex-col items-center gap-2 border p-3 transition-colors ${
                                    locked
                                        ? 'cursor-not-allowed border-border bg-muted/40'
                                        : active
                                          ? 'border-chart-1 bg-chart-1/10'
                                          : 'border-border bg-card/50 hover:border-muted-foreground/40 hover:bg-accent/30'
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                <div
                                    className={`flex h-8 w-full items-center justify-center border ${t.preview} ${
                                        locked ? 'opacity-40' : ''
                                    }`}
                                >
                                    <t.icon
                                        size={16}
                                        className={
                                            locked
                                                ? 'text-muted-foreground/60'
                                                : active
                                                  ? 'text-chart-1'
                                                  : 'text-muted-foreground'
                                        }
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <span
                                        className={`text-[10px] font-bold uppercase tracking-wider ${
                                            locked
                                                ? 'text-muted-foreground/60'
                                                : active
                                                  ? 'text-chart-1'
                                                  : 'text-muted-foreground'
                                        }`}
                                    >
                                        {t.label}
                                    </span>
                                    {locked && (
                                        <LockSimpleIcon
                                            size={10}
                                            weight="bold"
                                            className="text-chart-4"
                                        />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {tier < 1 && (
                <Link
                    to="/donate"
                    className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-chart-1"
                >
                    <LockSimpleIcon
                        size={11}
                        weight="bold"
                        className="text-chart-4"
                    />
                    <span>AMOLED is a supporter perk.</span>
                </Link>
            )}
        </div>
    );
};

export default ThemeModePicker;
