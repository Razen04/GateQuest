export interface PyqPaper {
    id: string;
    label: string;
    exam: string;
    branch: string;
    year: number;
    shift: number | null;
    questionCount: number;
    marks: number;
    durationMinutes: number;
    isComplete: boolean;
    notes: string | null;
}
