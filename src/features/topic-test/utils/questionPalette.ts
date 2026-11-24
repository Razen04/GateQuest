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

/** A session is sectioned only when both GA and TECH questions are present. */
export function isSectioned(questions: Question[]): boolean {
    return getPaletteSections(questions)[0]?.label !== null;
}

/** Section containing a question index, or null for a flat session. */
export function getQuestionSection(
    questions: Question[],
    index: number
): PaletteSection | null {
    const section = getPaletteSections(questions).find((s) =>
        s.indices.includes(index)
    );
    return section?.label ? section : null;
}

/**
 * Number shown to the student for a question index. Numbering is continuous
 * across the paper (GA 1–10, TECH 11–65) so the same number never appears
 * twice. The question array is kept in attempt_order order, so this matches
 * the DB's attempt_order. Navigation uses the global index too.
 */
export function getDisplayNumber(
    _questions: Question[],
    index: number
): number {
    return index + 1;
}

/** Total number of questions in the paper. */
export function getDisplayTotal(questions: Question[], _index: number): number {
    return questions.length;
}

/** Adjacent question within the same section, or null at a section edge. */
export function getAdjacentIndex(
    questions: Question[],
    index: number,
    delta: -1 | 1
): number | null {
    const section = getQuestionSection(questions, index);
    if (!section) {
        const next = index + delta;
        return next >= 0 && next < questions.length ? next : null;
    }
    const position = section.indices.indexOf(index);
    const nextPosition = position + delta;
    return nextPosition >= 0 && nextPosition < section.indices.length
        ? (section.indices[nextPosition] ?? null)
        : null;
}
