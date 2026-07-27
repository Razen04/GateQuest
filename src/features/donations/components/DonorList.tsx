import * as React from 'react';
import { UserCircle } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import type { DonationData } from '../types/donationType';

type DonorListProps = {
    donations: DonationData[];
};

const DonorList: React.FC<DonorListProps> = ({ donations }) => {
    return (
        <ul className="space-y-3">
            {donations.map((donation) => (
                <li
                    key={donation.donation_id}
                    className="relative overflow-hidden flex items-start gap-3 rounded-2xl p-3 border border-white/20 bg-white/10 backdrop-blur-xl backdrop-saturate-150 dark:bg-white/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-white/20 dark:hover:bg-white/[0.1] hover:-translate-y-0.5"
                >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent dark:from-white/5" />

                    <div className="relative flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full overflow-hidden border border-white/20 bg-white/10 dark:bg-white/[0.08]">
                        {donation.anonymous || !donation.user_avatar ? (
                            <UserCircle size={32} className="text-blue-500" />
                        ) : (
                            <img
                                src={donation.user_avatar}
                                alt="Donor avatar"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>

                    <div className="relative flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm truncate">
                                        {donation.anonymous || !donation.user_name
                                            ? 'Anonymous'
                                            : donation.user_name}
                                    </span>

                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(
                                            new Date(
                                                donation.created_at.endsWith('Z')
                                                    ? donation.created_at
                                                    : donation.created_at + 'Z',
                                            ),
                                        )}{' '}
                                        ago
                                    </span>
                                </div>
                            </div>

                            <span className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold border border-emerald-400/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                ₹{donation.actual_amount}
                            </span>
                        </div>

                        {donation.message && (
                            <p className="mt-1 text-sm text-muted-foreground text-pretty">
                                {donation.message}
                            </p>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default DonorList;
