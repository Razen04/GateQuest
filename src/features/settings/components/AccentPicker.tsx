import { LockSimpleIcon, PaletteIcon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
import { getDonorTier, isAccentLocked } from '@/shared/types/donor';
import { ACCENTS } from '../data/appSettingsData';

const AccentPicker = ({ isLoading }: { isLoading: boolean }) => {
    const settings = useSettingsStore((s) => s.settings);
    const setSetting = useSettingsStore((s) => s.setSetting);

    const user = useAuthStore((s) => s.user);
    const tier = getDonorTier(user?.notification_tags);

    return (
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
                            Changes the highlight color across buttons, links,
                            and selections.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
                    {ACCENTS.map((a) => {
                        const active = settings.accent === a.id;
                        const locked = isAccentLocked(a.id, tier);
                        return (
                            <button
                                key={a.id}
                                type="button"
                                onClick={() => {
                                    if (locked) return;
                                    setSetting('accent', a.id);
                                }}
                                disabled={isLoading}
                                title={
                                    locked
                                        ? `${a.label} — supporter perk`
                                        : a.label
                                }
                                aria-label={
                                    locked
                                        ? `${a.label} accent — supporter perk`
                                        : `${a.label} accent`
                                }
                                aria-pressed={active}
                                aria-disabled={locked}
                                className={`relative h-9 w-9 rounded-full border-2 transition-all ${
                                    locked
                                        ? 'cursor-not-allowed border-border'
                                        : active
                                          ? 'border-foreground scale-110'
                                          : 'border-border hover:scale-105 hover:border-muted-foreground'
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                                style={{
                                    backgroundColor: a.swatch,
                                }}
                            >
                                {locked && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 backdrop-blur-[2px]">
                                        <LockSimpleIcon
                                            size={12}
                                            weight="bold"
                                            className="text-chart-4"
                                        />
                                    </div>
                                )}
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
                    <span>Custom accents are supporter perks.</span>
                </Link>
            )}
        </div>
    );
};

export default AccentPicker;
