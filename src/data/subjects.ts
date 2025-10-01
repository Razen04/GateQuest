import {
    LinuxLogo,
    Brain,
    Database,
    Globe,
    Cpu,
    Graph,
    Terminal,
    GitBranch,
    Binary,
    Function,
    FileCode,
} from '@phosphor-icons/react';
import type { Subject } from '../types/Subject.ts';

// Subjects Data
const subjects: Subject[] = [
    // 1. Discrete Maths
    {
        id: 10,
        name: 'Discrete Maths',
        apiName: 'Discrete Maths',
        icon: Function,
        questions: 270,
        difficulty: 'Medium',
        category: 'math',
        color: 'violet',
    },
    {
        id: 110,
        name: 'Discrete Maths',
        apiName: 'Discrete Maths',
        icon: Function,
        questions: 270,
        difficulty: 'Medium',
        category: 'bookmarked',
        color: 'violet',
    },

    // 2. Digital Logic
    {
        id: 11,
        name: 'Digital Logic',
        apiName: 'Digital Logic',
        icon: Binary,
        questions: 207,
        difficulty: 'Medium',
        category: 'all',
        color: 'pink',
    },
    {
        id: 111,
        name: 'Digital Logic',
        apiName: 'Digital Logic',
        icon: Binary,
        questions: 207,
        difficulty: 'Medium',
        category: 'bookmarked',
        color: 'pink',
    },

    // 3. Computer Organization & Architecture
    {
        id: 1,
        name: 'Computer Organization & Architecture',
        apiName: 'CO & Architecture',
        icon: Cpu,
        questions: 180,
        difficulty: 'Hard',
        category: 'core',
        color: 'indigo',
    },
    {
        id: 101,
        name: 'Computer Organization & Architecture',
        apiName: 'CO & Architecture',
        icon: Cpu,
        questions: 180,
        difficulty: 'Hard',
        category: 'bookmarked',
        color: 'indigo',
    },

    // 4. Data Structures
    {
        id: 5,
        name: 'Data Structures',
        apiName: 'Data Structures',
        icon: Graph,
        questions: 250,
        difficulty: 'Medium',
        category: 'core',
        color: 'orange',
    },
    {
        id: 105,
        name: 'Data Structures',
        apiName: 'Data Structures',
        icon: Graph,
        questions: 250,
        difficulty: 'Medium',
        category: 'bookmarked',
        color: 'orange',
    },

    // 5. Algorithms
    {
        id: 9,
        name: 'Algorithms',
        apiName: 'Algorithms',
        icon: GitBranch,
        questions: 229,
        difficulty: 'Hard',
        category: 'core',
        color: 'teal',
    },
    {
        id: 109,
        name: 'Algorithms',
        apiName: 'Algorithms',
        icon: GitBranch,
        questions: 229,
        difficulty: 'Hard',
        category: 'bookmarked',
        color: 'teal',
    },

    // 6. Theory of Computation
    {
        id: 3,
        name: 'Theory of Computation',
        apiName: 'Theory of Computation',
        icon: Terminal,
        questions: 200,
        difficulty: 'Hard',
        category: 'core',
        color: 'red',
    },
    {
        id: 103,
        name: 'Theory of Computation',
        apiName: 'Theory of Computation',
        icon: Terminal,
        questions: 200,
        difficulty: 'Hard',
        category: 'bookmarked',
        color: 'red',
    },

    // 7. Compiler Design
    {
        id: 8,
        name: 'Compiler Design',
        apiName: 'Compiler Design',
        icon: FileCode,
        questions: 172,
        difficulty: 'Hard',
        category: 'core',
        color: 'yellow',
    },
    {
        id: 108,
        name: 'Compiler Design',
        apiName: 'Compiler Design',
        icon: FileCode,
        questions: 172,
        difficulty: 'Hard',
        category: 'bookmarked',
        color: 'yellow',
    },

    // 8. Operating System
    {
        id: 4,
        name: 'Operating System',
        apiName: 'Operating System',
        icon: LinuxLogo,
        questions: 235,
        difficulty: 'Medium',
        category: 'core',
        color: 'blue',
    },
    {
        id: 104,
        name: 'Operating System',
        apiName: 'Operating System',
        icon: LinuxLogo,
        questions: 235,
        difficulty: 'Medium',
        category: 'bookmarked',
        color: 'blue',
    },

    // 9. Database Management Systems
    {
        id: 7,
        name: 'Database Management Systems',
        apiName: 'Databases',
        icon: Database,
        questions: 172,
        difficulty: 'Medium',
        category: 'core',
        color: 'purple',
    },
    {
        id: 107,
        name: 'Database Management Systems',
        apiName: 'Databases',
        icon: Database,
        questions: 172,
        difficulty: 'Medium',
        category: 'bookmarked',
        color: 'purple',
    },

    // 10. Computer Networks
    {
        id: 6,
        name: 'Computer Networks',
        apiName: 'Computer Networks',
        icon: Globe,
        questions: 144,
        difficulty: 'Medium',
        category: 'core',
        color: 'green',
    },
    {
        id: 106,
        name: 'Computer Networks',
        apiName: 'Computer Networks',
        icon: Globe,
        questions: 144,
        difficulty: 'Medium',
        category: 'bookmarked',
        color: 'green',
    },

    // 11. Aptitude
    {
        id: 2,
        name: 'Aptitude',
        apiName: 'Aptitude',
        icon: Brain,
        questions: 236,
        difficulty: 'Easy',
        category: 'aptitude',
        color: 'red',
    },
    {
        id: 102,
        name: 'Aptitude',
        apiName: 'Aptitude',
        icon: Brain,
        questions: 236,
        difficulty: 'Easy',
        category: 'bookmarked',
        color: 'red',
    },
];

export default subjects;
