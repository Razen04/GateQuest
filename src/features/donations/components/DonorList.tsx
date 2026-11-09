import { UserCircle } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import * as React from 'react';
import { Avatar } from '@/shared/components/Avatar';
import { Banner } from '@/shared/components/Banner';
import { TieredAvatar } from '@/shared/components/TieredAvatar';
import { getDonorTier } from '@/shared/types/donor';
import type { DonationData } from '../types/donationType';

type DonorListProps = {
    donations: DonationData[];
};

const DonorList: React.FC<DonorListProps> = ({ donations }) => {
    console.log(donations);
    return (
        <ul className="space-y-3">
            {donations.map((donation) => {
                const showBanner =
                    !donation.anonymous && !!donation.user_banner;

                return (
                    <li
                        key={donation.donation_id}
                        className="group relative overflow-hidden border border-white/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        {/* Banner as background — only for named donors with a banner */}
                        {showBanner && (
                            <Banner
                                src={donation.user_banner}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        )}

                        {/* Overlay — stronger with banner, matches original card fill without */}
                        <div
                            className={`absolute inset-0 transition-colors duration-300 ${
                                showBanner
                                    ? 'bg-card/85 group-hover:bg-card/95'
                                    : 'bg-card/60 group-hover:bg-card/90'
                            }`}
                        />

                        {/* Existing glass sheen */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent dark:from-white/5" />

                        {/* Content */}
                        <div className="relative flex items-start gap-3 p-3">
                            <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-full bg-card/80">
                                {donation.anonymous ? (
                                    // Fully anonymous — no tier shown, matches "anonymous" intent
                                    <div className="relative flex items-center justify-center overflow-hidden rounded-full bg-card/80">
                                        <UserCircle
                                            size={32}
                                            className="text-chart-1"
                                        />
                                    </div>
                                ) : (
                                    <TieredAvatar
                                        src={donation.user_avatar}
                                        alt={donation.user_name || 'Donor'}
                                        tier={getDonorTier(
                                            donation.user_notification_tags
                                        )}
                                        animated={false}
                                        className="h-11 w-11 shrink-0"
                                        fallback={
                                            <UserCircle
                                                size={32}
                                                className="text-chart-1"
                                            />
                                        }
                                    />
                                )}
                            </div>

                            <div className="relative flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm truncate text-foreground">
                                                {donation.anonymous ||
                                                !donation.user_name
                                                    ? 'Anonymous'
                                                    : donation.user_name}
                                            </span>

                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(
                                                    new Date(
                                                        donation.created_at.endsWith(
                                                            'Z'
                                                        )
                                                            ? donation.created_at
                                                            : donation.created_at +
                                                                  'Z'
                                                    )
                                                )}{' '}
                                                ago
                                            </span>
                                        </div>
                                    </div>

                                    <span className="flex-shrink-0 px-2.5 py-1 text-xs font-semibold border border-chart-2/30 bg-chart-2/10 text-chart-2">
                                        ₹{donation.actual_amount}
                                    </span>
                                </div>

                                {donation.message && (
                                    <p className="mt-1 text-sm text-muted-foreground text-pretty">
                                        {donation.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default DonorList;
