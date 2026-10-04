import { Clock, Play } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import papersJson from '@/shared/data/cs-gate-pyq-papers.json';
import type { PyqPaper } from '@/shared/types/pyq';
import { containerVariants, itemVariants } from '@/shared/utils/motionVariants';

const PAPERS = papersJson as PyqPaper[];

interface Props {
    selectedPaper: PyqPaper | null;
    onSelect: (paper: PyqPaper) => void;
}

const PyqPaperPicker = ({ selectedPaper, onSelect }: Props) => {
    // Sort descending by year, then by shift
    const sorted = [...PAPERS].sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return (b.shift ?? 0) - (a.shift ?? 0);
    });

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <label className="text-sm mb-4 font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                Select a Paper
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {sorted.map((paper) => {
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
