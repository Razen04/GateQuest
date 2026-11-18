import { describe, expect, it } from 'vitest';
import type { Question } from '@/shared/types/storage';
import { getPaletteSections } from '../questionPalette';

const make = (id: string, section?: string): Question =>
    ({
        id,
        metadata: section ? { section } : {},
    }) as unknown as Question;

describe('getPaletteSections', () => {
    it('splits into General Aptitude and Technical when both exist', () => {
        const sections = getPaletteSections([
            make('1', 'GA'),
            make('2', 'TECH'),
            make('3', 'GA'),
            make('4', 'TECH'),
        ]);

        expect(sections).toEqual([
            { label: 'General Aptitude', indices: [0, 2] },
            { label: 'Technical', indices: [1, 3] },
        ]);
    });

    it('keeps the flat grid when only one section exists', () => {
        const sections = getPaletteSections([
            make('1', 'TECH'),
            make('2', 'TECH'),
        ]);

        expect(sections).toEqual([{ label: null, indices: [0, 1] }]);
    });

    it('keeps the flat grid when no section metadata exists', () => {
        const questions = [make('1'), make('2', 'MATH')];

        expect(getPaletteSections(questions)).toEqual([
            { label: null, indices: [0, 1] },
        ]);
    });

    it('puts unclassified questions in Technical for a mixed mock', () => {
        const sections = getPaletteSections([
            make('1', 'GA'),
            make('2'),
            make('3', 'TECH'),
            make('4', 'MATH'),
        ]);

        expect(sections).toEqual([
            { label: 'General Aptitude', indices: [0] },
            { label: 'Technical', indices: [1, 2, 3] },
        ]);
    });

    it('matches section codes case-insensitively', () => {
        const sections = getPaletteSections([
            make('1', 'ga'),
            make('2', 'tech'),
        ]);

        expect(sections).toEqual([
            { label: 'General Aptitude', indices: [0] },
            { label: 'Technical', indices: [1] },
        ]);
    });
});
