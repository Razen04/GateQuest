import { Clock, Play } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useGoalStore } from '@/app/stores/useGoalStore';
import papersCs from '@/shared/data/papers/cs-gate-pyq-papers.json';
import papersDa from '@/shared/data/papers/da-gate-pyq-papers.json';
import papersEc from '@/shared/data/papers/ec-gate-pyq-papers.json';
import papersEe from '@/shared/data/papers/ee-gate-pyq-papers.json';
import papersMe from '@/shared/data/papers/me-gate-pyq-papers.json';
import papersXl from '@/shared/data/papers/xl-gate-pyq-papers.json';
import type { PyqPaper } from '@/shared/types/pyq';
import { containerVariants, itemVariants } from '@/shared/utils/motionVariants';

const ALL_PAPERS: PyqPaper[] = [
    ...(papersCs as PyqPaper[]),
    ...(papersDa as PyqPaper[]),
    ...(papersEe as PyqPaper[]),
    ...(papersMe as PyqPaper[]),
    ...(papersEc as PyqPaper[]),
    ...(papersXl as PyqPaper[]),
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
            <div className="text-sm text-muted-foreground py-8 text-center">
                Set a goal to see available PYQ papers.
            </div>
        );
    }

    if (papers.length === 0) {
        return (
            <div className="text-sm text-muted-foreground py-8 text-center">
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
            <label className="text-sm mb-4 font-semibold uppercase tracking-wide text-foreground">
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
                                    ? 'border-chart-1 bg-chart-1/10'
                                    : 'border-border bg-card/40 hover:border-chart-1/50'
                            } backdrop-blur-xl`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-sm truncate text-foreground">
                                        {paper.label}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                        <Clock size={12} weight="bold" />
                                        {paper.durationMinutes} min ·{' '}
                                        {paper.questionCount} Q · {paper.marks}{' '}
                                        marks
                                    </p>
                                    {paper.notes && (
                                        <p className="text-xs text-chart-4 mt-1">
                                            {paper.notes}
                                        </p>
                                    )}
                                </div>
                                {isSelected && (
                                    <Play
                                        size={16}
                                        weight="fill"
                                        className="text-chart-1 shrink-0 ml-2"
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
