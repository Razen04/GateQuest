import * as React from 'react';
import { motion } from 'framer-motion';
import { containerVariants } from '../../utils/motionVariants.ts';
import { Info, CheckCircle, ShieldCheck, ArrowsClockwise, Fire } from '@phosphor-icons/react';

type BoxCardProps = {
    icon: React.ReactNode;
    title: string;
    badge: string;
    desc: string;
    bgColor: string;
    borderColor: string;
};

const BoxCard = ({ icon, title, badge, desc, bgColor, borderColor }: BoxCardProps) => (
    <div className={`p-5 border ${bgColor} ${borderColor} transition-all`}>
        <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-white dark:bg-zinc-800 shadow-sm">{icon}</div>
            <span className="px-2 py-1 bg-white/50 dark:bg-black/20 text-xs font-bold text-gray-600 dark:text-gray-300">
                {badge}
            </span>
        </div>
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
);

const InfoTab = () => {
    return (
        <div>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
            >
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                    <Info size={20} />
                    <h2 className="text-sm font-semibold uppercase tracking-wider">
                        How the Algorithm Works
                    </h2>
                </div>

                {/* The 3 Boxes Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                    <BoxCard
                        icon={<Fire size={24} weight="fill" className="text-red-500" />}
                        title="Box 1: Critical"
                        badge="Weekly"
                        desc="New mistakes and repeated failures. You see these every week until solved."
                        bgColor="bg-red-50 dark:bg-red-900/10"
                        borderColor="border-red-100 dark:border-red-900/20"
                    />
                    <BoxCard
                        icon={
                            <ArrowsClockwise size={24} weight="bold" className="text-amber-500" />
                        }
                        title="Box 2: Hard"
                        badge="Every 2 Weeks"
                        desc="Questions you got right once. We wait 14 days to test if you really know it."
                        bgColor="bg-amber-50 dark:bg-amber-900/10"
                        borderColor="border-amber-100 dark:border-amber-900/20"
                    />
                    <BoxCard
                        icon={<CheckCircle size={24} weight="fill" className="text-green-500" />}
                        title="Box 3: Mastered"
                        badge="Monthly"
                        desc="The final test. Solve it here to 'Graduate' the question from your queue forever."
                        bgColor="bg-green-50 dark:bg-green-900/10"
                        borderColor="border-green-100 dark:border-green-900/20"
                    />
                </div>

                {/* Safety Rules Footer */}
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-6">
                    <h3 className="text-blue-800 dark:text-blue-300 font-bold flex items-center gap-2 mb-4">
                        <ShieldCheck size={20} weight="fill" /> The "No Burnout" Mechanism
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6 text-sm text-blue-900/70 dark:text-blue-200/70">
                        <p>
                            <strong>Max 30 Questions:</strong> There is a strict cap to the number
                            of questions you should do in a week for revision, rest of the time
                            should be dedicated to solving new questions.
                        </p>
                        <p>
                            <strong>Fresh Start Policy:</strong> Missed a week? We don't pile it up.
                            We archive old sets and generate a fresh one based on your current
                            needs.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default InfoTab;
