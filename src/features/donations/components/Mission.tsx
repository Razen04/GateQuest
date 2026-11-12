import { CheckCircleIcon } from '@phosphor-icons/react';
import { TIERS } from '../data/donationData';
import { SupportGoalProgress } from './SupportGoalProgress';

const Mission = () => {
    return (
        <div className="space-y-6">
            <SupportGoalProgress />

            <section className="border border-border bg-card/50 p-6 sm:p-8">
                <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-chart-1">
                    WHY SUPPORTERS GET PERKS?
                </p>
                <div className="space-y-4 text-sm leading-relaxed">
                    <p>
                        It is an honour for me to be of service for an amazing
                        learning platform and I will try my best to keep doing
                        this as long as possible.
                    </p>
                    <p>
                        Needless to say, there are going to be costs to run a
                        project like this apart from the time invested in the
                        development. I would like to thank the donators for
                        their support to keep the project alive and development
                        continuous. It is thanks to them I get my motivation to
                        keep working on this and also keep the platform alive.
                    </p>
                    <p>
                        The system will not affect your normal usage of the app.
                        This is just something I think I can do to show
                        gratitude to the people who believe in me and this
                        project. Everyone using this platform is a part of the
                        community created with it and it will always be that way
                        as long as that is possible.
                    </p>

                    <p>
                        I have thought of some perks for donators which I hope
                        are worth it enough to support me and the project.
                    </p>

                    <p className="text-muted-foreground">
                        Note: Currently the perks will be permanent, this may
                        change in future.
                    </p>

                    <p className="pt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
                        — Razen
                    </p>
                </div>
            </section>

            <section className="border border-border bg-card/50 p-6 sm:p-8">
                <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-chart-1">
                    THE TIERS
                </p>
                <p className="mb-5 text-xs text-muted-foreground">
                    Each tier includes everything from the previous one. Pick
                    whichever feels right for you or just ignore this.
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                    {TIERS.map((tier) => (
                        <div
                            key={tier.id}
                            className="flex flex-col border border-border bg-card/60 p-4"
                        >
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`h-2 w-2 rounded-full ${tier.dotClass}`}
                                        aria-hidden
                                    />
                                    <span className="font-grotesk text-sm font-bold text-foreground">
                                        {tier.name}
                                    </span>
                                </div>
                                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {tier.threshold}
                                </span>
                            </div>

                            <ul className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
                                {tier.perks.map((perk) => (
                                    <li
                                        key={perk}
                                        className="flex items-start gap-1.5"
                                    >
                                        <CheckCircleIcon
                                            size={11}
                                            className="mt-0.5 shrink-0 text-chart-2"
                                        />
                                        <span>{perk}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <p className="mt-5 border-t border-border pt-3 text-[11px] italic text-muted-foreground/70">
                    Every perk is a one-time unlock — your tier is permanent
                    once you reach it, even if you never donate again.
                </p>
            </section>

            <p className="text-center font-serif text-xs italic leading-relaxed text-muted-foreground">
                Do you really think you need perks for your prep but can't
                afford to donate? Just send me a sweet motivational message on
                Discord or Email. I most probably will give you Tier 1.
            </p>
        </div>
    );
};

export default Mission;
