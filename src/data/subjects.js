import { FaMicrochip } from 'react-icons/fa';
import { FaBrain, FaDiagramProject, FaSitemap, FaLinux, FaDatabase, FaNetworkWired } from 'react-icons/fa6';

// Subjects Data
const subjects = [
    {
        id: 1,
        name: "Computer Organization & Architecture",
        apiName: "CO & Architecture",
        icon: FaMicrochip,
        questions: 180,
        difficulty: "Hard",
        category: "core",
        color: "indigo"
    },
    {
        id: 101,
        name: "Computer Organization & Architecture",
        apiName: "CO & Architecture",
        icon: FaMicrochip,
        questions: 180,
        difficulty: "Hard",
        category: "bookmarked",
        color: "indigo"
    },
    {
        id: 2,
        name: "Aptitude",
        apiName: "Aptitude",
        icon: FaBrain,
        questions: 236,
        difficulty: "Easy",
        category: "aptitude",
        color: "red"
    },
    {
        id: 102,
        name: "Aptitude",
        apiName: "Aptitude",
        icon: FaBrain,
        questions: 236,
        difficulty: "Easy",
        category: "bookmarked",
        color: "red"
    },
    {
        id: 3,
        name: "Theory of Computation",
        apiName: "Theory of Computation",
        icon: FaDiagramProject,
        questions: 200,
        difficulty: "Hard",
        category: "core",
        color: "purple"
    },
    {
        id: 103,
        name: "Theory of Computation",
        apiName: "Theory of Computation",
        icon: FaDiagramProject,
        questions: 200,
        difficulty: "Hard",
        category: "bookmarked",
        color: "purple"
    },
    {
        id: 4,
        name: "Operating System",
        apiName: "Operating System",
        icon: FaLinux,
        questions: 235,
        difficulty: "Medium",
        category: "core",
        color: "blue"
    },
    {
        id: 104,
        name: "Operating System",
        apiName: "Operating System",
        icon: FaLinux,
        questions: 235,
        difficulty: "Medium",
        category: "bookmarked",
        color: "blue"
    },
    {
        id: 5,
        name: "Data Structures",
        apiName: "Data Structures",
        icon: FaSitemap,
        questions: 250,
        difficulty: "Medium",
        category: "core",
        color: "green"
    },
    {
        id: 105,
        name: "Data Structures",
        apiName: "Data Structures",
        icon: FaSitemap,
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
        icon: FaNetworkWired,
        questions: 144,
        difficulty: "Medium",
        category: "core",
        color: "teal"
    },
    {
        id: 106,
        name: "Computer Networks",
        apiName: "Computer Networks",
        icon: FaNetworkWired,
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
        icon: FaDatabase,
        questions: 172,
        difficulty: "Medium",
        category: "core",
        color: "orange"
    },
    {
        id: 107,
        name: "Database Management Systems",
        apiName: "Databases",
        icon: FaDatabase,
        questions: 172,
        difficulty: "Medium",
        category: "bookmarked",
        color: "orange"
    }
];

export default subjects;