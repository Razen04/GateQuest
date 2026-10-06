export interface SubjectStat {
    subject_name: string;
    subject_slug: string;
    icon_name: string;
    theme_color: string;
    attempted: number;
    correct: number;
    accuracy: number;
    total_available: number;
    progress: number;
    attemptedQuestionIds?: Set<string>;
    revisionAttemptedQuestionIds?: Set<string>;
}

export interface Streaks {
    study_current: number;
    study_longest: number;
    learning_current: number;
    learning_longest: number;
}

export interface HeatmapEntry {
    date: string;
    count: number;
}

export type Heatmap = HeatmapEntry[];

export interface StudyPlan {
    totalQuestions: number;
    uniqueAttemptCount: number;
    remainingQuestions: number;
    daysLeft: number;
    dailyQuestionTarget: number;
    todayUniqueAttemptCount: number;
    progressPercent: number;
    todayProgressPercent: number;
    isTargetMetToday: boolean;
}

export interface Stats {
    progress: number;
    accuracy: number;
    subjectStats: SubjectStat[];
    subjectStatsMap: Record<string, SubjectStat[]>;
    question: Set<string>;
    streaks: Streaks;
    heatmapData: Heatmap | null;
    studyPlan: StudyPlan;
}
