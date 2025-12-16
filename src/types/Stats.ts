export interface SubjectStat {
    subject: string;
    accuracy: number;
    progress: number;
    attemptedQuestionIds: Set<string>;
    revisionAttemptedQuestionIds: Set<string>;
    attempted: number;
    totalAvailable: number;
}

export interface Streaks {
    current: number;
    longest: number;
}

export interface Heatmap {
    date: string;
    count: number;
}

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
    question: Set<string>;
    streaks: Streaks;
    heatmapData: Heatmap[];
    studyPlan: StudyPlan;
}
