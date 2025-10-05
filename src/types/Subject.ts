import React from 'react';

export type Subject = {
    id: number;
    name: string;
    apiName: string;
    icon: React.ElementType;
    questions: number;
    difficulty: string;
    category: string;
    color: string;
};
