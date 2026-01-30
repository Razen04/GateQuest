import * as React from 'react';
import { UserCircle } from '@phosphor-icons/react';
import type { DonationData } from '../../types/Donation.ts';
import { formatDistanceToNow } from 'date-fns';

type DonorListProps = {
    donations: DonationData[];
};

// TODO: Fix Timezone Issue
const DonorList: React.FC<DonorListProps> = ({ donations }: DonorListProps) => {
    return (
        <div>
            <div>
                <ul className="space-y-4">
                    {donations.map((donation) => (
                        <li
                            key={donation.donation_id}
                            className="flex items-start gap-4 p-4 bg-gradient-to-tr from-blue-50 to-white dark:from-zinc-700/70 dark:to-zinc-800 border border-blue-100 dark:border-zinc-700 hover:scale-[1.02] hover:shadow-lg transition-transform duration-200"
                        >
                            <div className="w-12 h-12 flex items-center justify-center text-white font-bold text-lg shadow-md rounded-full">
                                {donation.anonymous || !donation.user_avatar ? (
                                    <UserCircle size={32} color="blue" />
                                ) : (
                                    <img src={donation.user_avatar} />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">
                                        {donation.anonymous || !donation.user_name
                                            ? 'Anonymous'
                                            : donation.user_name}

                                        <span className="text-gray-500 ml-2 text-xs">
                                            {formatDistanceToNow(new Date(donation.created_at))} ago
                                        </span>
                                    </span>

                                    <span className="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300 font-semibold text-sm px-2 py-1">
                                        ₹{donation.actual_amount}
                                    </span>
                                </div>

                                {donation.message && (
                                    <p className="mt-1 text-gray-600 dark:text-gray-300 text-pretty">
                                        {donation.message}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DonorList;
