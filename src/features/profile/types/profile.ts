export interface ProfileData {
    profile: {
        name: string | null;
        username: string | null;
        avatar: string | null;
        targetYear: number | null;
        college: string | null;
        joined_at: string | null;
        about: string | null;
        total_xp: number;
        socials?: Record<string, string | null>;
    };
    global_stats: {
        total_unique_solved: number;
        total_attempts: number;
        overall_accuracy: number;
        question_types: { type: string; solved: number; accuracy: number }[];
    };
    streaks: {
        study_current: number;
        study_longest: number;
        learning_current: number;
        learning_longest: number;
    };
    heatmap: { date: string; count: number }[];
    exam_stats: Record<
        string,
        {
            overall_attempted: number;
            overall_accuracy: number;
            total_available: number;
            subjects: {
                subject_name: string;
                subject_slug: string;
                attempted: number;
                correct: number;
                accuracy: number;
                total_available: number;
            }[];
        }
    >;
    recent_history: {
        question_id: string;
        question_text: string;
        subject_name: string;
        exam_year: number;
        marks: number;
        question_type: string;
        was_correct: boolean | null;
        time_taken: number | null;
        attempted_at: string;
    }[];
}
