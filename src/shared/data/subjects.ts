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
    Empty,
    FileCode,
    Pi,
} from '@phosphor-icons/react';
import type { Subject } from '../types/Subject.ts';

// Subjects Data
const subjects: Subject[] = [
    // 1. Engineering Mathematics
    {
        id: 1,
        name: 'Engineering Mathematics',
        apiName: 'Engineering Mathematics',
        icon: Pi,
        questions: 191,
        difficulty: 'Medium',
        category: 'math',
        color: 'violet',
    },
    {
        id: 101,
        name: 'Engineering Mathematics',
        apiName: 'Engineering Mathematics',
        icon: Pi,
        questions: 191,
        difficulty: 'Medium',
        category: 'bookmarked',
        color: 'violet',
    },

    // 2. Discrete Maths
    {
        id: 2,
        name: 'Discrete Maths',
        apiName: 'Discrete Maths',
        icon: Empty,
        questions: 276,
        difficulty: 'Hard',
        category: 'math',
        color: 'violet',
    },
    {
        id: 102,
        name: 'Discrete Maths',
        apiName: 'Discrete Maths',
        icon: Empty,
        questions: 276,
        difficulty: 'Hard',
        category: 'bookmarked',
        color: 'violet',
    },

    // 3. Digital Logic
    {
        id: 3,
        name: 'Digital Logic',
        apiName: 'Digital Logic',
        icon: Binary,
        questions: 226,
        difficulty: 'Easy',
        category: 'core',
        color: 'pink',
    },
    {
        id: 103,
        name: 'Digital Logic',
        apiName: 'Digital Logic',
        icon: Binary,
        questions: 226,
        difficulty: 'Easy',
        category: 'bookmarked',
        color: 'pink',
    },

    // 4. Computer Organization & Architecture
    {
        id: 4,
        name: 'Computer Organization & Architecture',
        apiName: 'CO & Architecture',
        icon: Cpu,
        questions: 166,
        difficulty: 'Medium',
        category: 'core',
        color: 'indigo',
    },
    {
        id: 104,
        name: 'Computer Organization & Architecture',
        apiName: 'CO & Architecture',
        icon: Cpu,
        questions: 166,
        difficulty: 'Medium',
        category: 'bookmarked',
        color: 'indigo',
    },

    // 5. Data Structures
    {
        id: 5,
        name: 'Data Structures',
        apiName: 'Data Structures',
        icon: Graph,
        questions: 269,
        difficulty: 'Medium',
        category: 'core',
        color: 'orange',
    },
    {
        id: 105,
        name: 'Data Structures',
        apiName: 'Data Structures',
        icon: Graph,
        questions: 269,
        difficulty: 'Medium',
        category: 'bookmarked',
        color: 'orange',
    },

    // 6. Algorithms
    {
        id: 6,
        name: 'Algorithms',
        apiName: 'Algorithms',
        icon: GitBranch,
        questions: 248,
        difficulty: 'Hard',
        category: 'core',
        color: 'teal',
    },
    {
        id: 106,
        name: 'Algorithms',
        apiName: 'Algorithms',
        icon: GitBranch,
        questions: 248,
        difficulty: 'Hard',
        category: 'bookmarked',
        color: 'teal',
    },

    // 7. Theory of Computation
    {
        id: 7,
        name: 'Theory of Computation',
        apiName: 'Theory of Computation',
        icon: Terminal,
        questions: 217,
        difficulty: 'Hard',
        category: 'core',
        color: 'red',
    },
    {
        id: 107,
        name: 'Theory of Computation',
        apiName: 'Theory of Computation',
        icon: Terminal,
        questions: 217,
        difficulty: 'Hard',
        category: 'bookmarked',
        color: 'red',
    },

    // 8. Compiler Design
    {
        id: 8,
        name: 'Compiler Design',
        apiName: 'Compiler Design',
        icon: FileCode,
        questions: 181,
        difficulty: 'Medium',
        category: 'core',
        color: 'yellow',
    },
    {
        id: 108,
        name: 'Compiler Design',
        apiName: 'Compiler Design',
        icon: FileCode,
        questions: 181,
        difficulty: 'Medium',
        category: 'bookmarked',
        color: 'yellow',
    },

    // 9. Operating System
    {
        id: 9,
        name: 'Operating System',
        apiName: 'Operating System',
        icon: LinuxLogo,
        questions: 255,
        difficulty: 'Medium',
        category: 'core',
        color: 'blue',
    },
    {
        id: 109,
        name: 'Operating System',
        apiName: 'Operating System',
        icon: LinuxLogo,
        questions: 255,
        difficulty: 'Medium',
        category: 'bookmarked',
        color: 'blue',
    },

    // 10. Database Management Systems
    {
        id: 10,
        name: 'Database Management Systems',
        apiName: 'Databases',
        icon: Database,
        questions: 191,
        difficulty: 'Easy',
        category: 'core',
        color: 'purple',
    },
    {
        id: 110,
        name: 'Database Management Systems',
        apiName: 'Databases',
        icon: Database,
        questions: 191,
        difficulty: 'Easy',
        category: 'bookmarked',
        color: 'purple',
    },

    // 11. Computer Networks
    {
        id: 11,
        name: 'Computer Networks',
        apiName: 'Computer Networks',
        icon: Globe,
        questions: 159,
        difficulty: 'Medium',
        category: 'core',
        color: 'green',
    },
    {
        id: 111,
        name: 'Computer Networks',
        apiName: 'Computer Networks',
        icon: Globe,
        questions: 159,
        difficulty: 'Medium',
        category: 'bookmarked',
        color: 'green',
    },

    // 12. Aptitude
    {
        id: 12,
        name: 'Aptitude',
        apiName: 'Aptitude',
        icon: Brain,
        questions: 247,
        difficulty: 'Easy',
        category: 'aptitude',
        color: 'red',
    },
    {
        id: 112,
        name: 'Aptitude',
        apiName: 'Aptitude',
        icon: Brain,
        questions: 247,
        difficulty: 'Easy',
        category: 'bookmarked',
        color: 'red',
    },
];

export default subjects;
