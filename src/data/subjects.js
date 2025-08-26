import { LinuxLogo, Brain, Database, Globe, Cpu, Graph, Terminal, Gear } from 'phosphor-react';

// Subjects Data
const subjects = [
    {
        id: 1,
        name: "Computer Organization & Architecture",
        apiName: "CO & Architecture",
        icon: Cpu,
        questions: 180,
        difficulty: "Hard",
        category: "core",
        color: "indigo"
    },
    {
        id: 101,
        name: "Computer Organization & Architecture",
        apiName: "CO & Architecture",
        icon: Cpu,
        questions: 180,
        difficulty: "Hard",
        category: "bookmarked",
        color: "indigo"
    },
    {
        id: 2,
        name: "Aptitude",
        apiName: "Aptitude",
        icon: Brain,
        questions: 236,
        difficulty: "Easy",
        category: "aptitude",
        color: "red"
    },
    {
        id: 102,
        name: "Aptitude",
        apiName: "Aptitude",
        icon: Brain,
        questions: 236,
        difficulty: "Easy",
        category: "bookmarked",
        color: "red"
    },
    {
        id: 3,
        name: "Theory of Computation",
        apiName: "Theory of Computation",
        icon: Terminal,
        questions: 200,
        difficulty: "Hard",
        category: "core",
        color: "purple"
    },
    {
        id: 103,
        name: "Theory of Computation",
        apiName: "Theory of Computation",
        icon: Terminal,
        questions: 200,
        difficulty: "Hard",
        category: "bookmarked",
        color: "purple"
    },
    {
        id: 4,
        name: "Operating System",
        apiName: "Operating System",
        icon: LinuxLogo,
        questions: 235,
        difficulty: "Medium",
        category: "core",
        color: "blue"
    },
    {
        id: 104,
        name: "Operating System",
        apiName: "Operating System",
        icon: LinuxLogo,
        questions: 235,
        difficulty: "Medium",
        category: "bookmarked",
        color: "blue"
    },
    {
        id: 5,
        name: "Data Structures",
        apiName: "Data Structures",
        icon: Graph,
        questions: 250,
        difficulty: "Medium",
        category: "core",
        color: "green"
    },
    {
        id: 105,
        name: "Data Structures",
        apiName: "Data Structures",
        icon: Graph,
        questions: 250,
        difficulty: "Medium",
        category: "bookmarked",
        color: "green"
    },
    // Networks
    {
        id: 6,
        name: "Computer Networks",
        apiName: "Computer Networks",
        icon: Globe,
        questions: 144,
        difficulty: "Medium",
        category: "core",
        color: "teal"
    },
    {
        id: 106,
        name: "Computer Networks",
        apiName: "Computer Networks",
        icon: Globe,
        questions: 144,
        difficulty: "Medium",
        category: "bookmarked",
        color: "teal"
    },
    // Database
    {
        id: 7,
        name: "Database Management Systems",
        apiName: "Databases",
        icon: Database,
        questions: 172,
        difficulty: "Medium",
        category: "core",
        color: "orange"
    },
    {
        id: 107,
        name: "Database Management Systems",
        apiName: "Databases",
        icon: Database,
        questions: 172,
        difficulty: "Medium",
        category: "bookmarked",
        color: "orange"
    },
    {
        id: 8,
        name: "Compiler Design",
        apiName: "Compiler Design",
        icon: Gear,
        questions: 162,
        difficulty: "Hard",
        category: "core",
        color: "orange"
    },
    {
        id: 108,
        name: "Compiler Design",
        apiName: "Compiler Design",
        icon: Gear,
        questions: 162,
        difficulty: "Hard",
        category: "bookmarked",
        color: "orange"
    }
];

export default subjects;