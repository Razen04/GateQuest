import type { Icon } from 'phosphor-react';

export type Subject = {
    id: number;
    name: string;
    apiName: string;
    icon: Icon;
    questions: number;
    difficulty: string;
    category: string;
    color: string;
};
