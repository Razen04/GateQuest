import type { Question } from '@/shared/types/storage';

export type PaletteSection = {
    /** null means the palette has no sections and renders as one flat grid. */
    label: string | null;
    /** Indices into the original (session-ordered) questions array. */
    indices: number[];
};

const sectionOf = (question: Question): string | null => {
    const section = question.metadata?.section;
    return typeof section === 'string' ? section.toUpperCase() : null;
};

/**
 * Full-length GATE mocks split their paper into General Aptitude and
 * Technical. Show those two groups in the palette only when a session
 * actually contains both — a subject-wise test (or a PYQ paper without
 * sections) keeps the plain numbered grid.
 *
 * Questions without a recognised section belong to Technical in a
 * sectioned mock, mirroring the server's GA-first `else 1` ordering.
 */
export function getPaletteSections(questions: Question[]): PaletteSection[] {
    const hasGa = questions.some((question) => sectionOf(question) === 'GA');
    const hasTech = questions.some(
        (question) => sectionOf(question) === 'TECH'
    );

    if (!hasGa || !hasTech) {
        return [{ label: null, indices: questions.map((_, index) => index) }];
    }

    const ga: number[] = [];
    const tech: number[] = [];

    questions.forEach((question, index) => {
        if (sectionOf(question) === 'GA') {
            ga.push(index);
        } else {
            tech.push(index);
        }
    });

    return [
        { label: 'General Aptitude', indices: ga },
        { label: 'Technical', indices: tech },
    ];
}
