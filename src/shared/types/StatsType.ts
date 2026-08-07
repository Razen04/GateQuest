import type { SubjectStat } from './Stats';

export interface DashboardResponse {
    heatmap: { date: string; count: number }[];
    profile: {
        college: string;
        total_xp: number;
        joined_at: string;
        targetYear: number;
        current_version: number;
    };
    streaks: {
        study_current: number;
        study_longest: number;
        learning_current: number;
        learning_longest: number;
    };
    exam_stats: Record<
        string,
        {
            overall_accuracy: number;
            overall_attempted: number;
            total_available: number;
            subjects: SubjectStat[];
        }
    >;
    global_stats: {
        question_types: { type: string; solved: number; accuracy: number }[];
        total_attempts: number;
        overall_accuracy: number;
        total_unique_solved: number;
    };
    recent_history: Array<unknown>;
    dashboard_stats: {
        days_left: number;
        exam_date: string;
        is_target_met_today: boolean;
        daily_question_target: number;
        today_progress_percent: number;
        today_unique_attempt_count: number;
    };
}
