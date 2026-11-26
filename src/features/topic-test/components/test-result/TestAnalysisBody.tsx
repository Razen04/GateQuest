import type { FullAttempt } from '../../types/testTypes';
import {
    DifficultyAnalysis,
    PacingAnalysis,
    TimeSinksAndTypeAccuracy,
    TopicBreakdown,
    useTestAnalysis,
} from './analysisSections';

interface TestAnalysisBodyProps {
    attempts: FullAttempt[];
    testId: string;
}

/**
 * The full analysis body used by the topic-test result page. The individual
 * sections are also exported from `analysisSections` so the mock result page
 * can place them in separate tabs.
 */
export default function TestAnalysisBody({
    attempts,
    testId,
}: TestAnalysisBodyProps) {
    const analysis = useTestAnalysis(attempts);

    if (attempts.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No attempts recorded yet.
            </p>
        );
    }

    return (
        <div className="space-y-12">
            <DifficultyAnalysis analysis={analysis} testId={testId} />
            <TopicBreakdown analysis={analysis} testId={testId} />
            <PacingAnalysis analysis={analysis} />
            <TimeSinksAndTypeAccuracy analysis={analysis} />
        </div>
    );
}
