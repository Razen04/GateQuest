import { ArrowRight, WarningCircle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import type { TestSession } from '@/shared/types/storage';

/**
 * Where "Resume" should send the user for a given active test.
 * Mock sessions go to the mock attempt page (which auto-transitions
 * created → ongoing). Topic-test sessions go to the lobby if created
 * (which handles the transition) or the attempt page if already ongoing.
 */
export function getActiveTestResumePath(test: TestSession): string {
    const paperId = test.paper_id ?? '';
    const isMock =
        paperId.startsWith('mock-') && !paperId.includes('-practice-');
    if (isMock) return `/mock-tests/attempt/${test.id}`;
    if (test.status === 'created') return `/topic-test/${test.id}`;
    return `/topic-test/${test.id}/attempt`;
}

export function getActiveTestLabel(test: TestSession): string {
    return test.topics?.[0] ?? 'your ongoing test';
}

interface Props {
    activeTest: TestSession;
}

export default function ActiveTestBlocker({ activeTest }: Props) {
    const navigate = useNavigate();
    const resumePath = getActiveTestResumePath(activeTest);
    const label = getActiveTestLabel(activeTest);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
        >
            <div className="border border-chart-4/30 bg-chart-4/5 p-8 text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 bg-chart-4/10 text-chart-4 mb-4">
                    <WarningCircle size={28} weight="fill" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                    You have an ongoing test
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                    Finish <strong className="text-foreground">{label}</strong>{' '}
                    before starting a new one. You can resume it now, or preview
                    upcoming mocks.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                    <Button
                        onClick={() => navigate(resumePath)}
                        className="rounded-none bg-chart-1 text-white hover:bg-chart-1/90"
                    >
                        Resume Test
                        <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() =>
                            navigate('/topic-test-generate?tab=mocks&preview=1')
                        }
                        className="rounded-none"
                    >
                        Preview Mocks
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                        className="rounded-none"
                    >
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
