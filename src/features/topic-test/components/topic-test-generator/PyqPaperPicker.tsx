import { Clock, Play } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useGoalStore } from '@/app/stores/useGoalStore';
import papersCs from '@/shared/data/papers/cs-gate-pyq-papers.json';
import papersDa from '@/shared/data/papers/da-gate-pyq-papers.json';
import papersEe from '@/shared/data/papers/ee-gate-pyq-papers.json';
import papersMe from '@/shared/data/papers/me-gate-pyq-papers.json';
import type { PyqPaper } from '@/shared/types/pyq';
import { containerVariants, itemVariants } from '@/shared/utils/motionVariants';

const ALL_PAPERS: PyqPaper[] = [
    ...(papersCs as PyqPaper[]),
    ...(papersDa as PyqPaper[]),
    ...(papersEe as PyqPaper[]),
    ...(papersMe as PyqPaper[]),
];

interface Props {
    selectedPaper: PyqPaper | null;
    onSelect: (paper: PyqPaper) => void;
}

const PyqPaperPicker = ({ selectedPaper, onSelect }: Props) => {
    const userGoal = useGoalStore((s) => s.userGoal);

    const userBranch = userGoal?.branch_id?.toUpperCase() ?? null;

    const papers = ALL_PAPERS.filter((p) => p.branch === userBranch).sort(
        (a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return (b.shift ?? 0) - (a.shift ?? 0);
        }
    );

    if (!userBranch) {
        return (
            <div className="text-sm text-slate-500 py-8 text-center">
                Set a goal to see available PYQ papers.
            </div>
        );
    }

    if (papers.length === 0) {
        return (
            <div className="text-sm text-slate-500 py-8 text-center">
                No PYQ papers available for your branch yet.
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <label className="text-sm mb-4 font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                Select a Paper
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {papers.map((paper) => {
                    const isSelected = selectedPaper?.id === paper.id;
                    return (
                        <motion.button
                            key={paper.id}
                            variants={itemVariants}
                            onClick={() => onSelect(paper)}
                            className={`text-left p-4 border transition-colors ${
                                isSelected
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.05] hover:border-blue-500/50'
                            } backdrop-blur-xl`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-sm truncate">
                                        {paper.label}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                        <Clock size={12} weight="bold" />
                                        {paper.durationMinutes} min ·{' '}
                                        {paper.questionCount} Q · {paper.marks}{' '}
                                        marks
                                    </p>
                                    {paper.notes && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                            {paper.notes}
                                        </p>
                                    )}
                                </div>
                                {isSelected && (
                                    <Play
                                        size={16}
                                        weight="fill"
                                        className="text-blue-500 shrink-0 ml-2"
                                    />
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default PyqPaperPicker;
