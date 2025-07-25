import { FaMicrochip } from 'react-icons/fa';
import { FaBrain, FaDiagramProject } from 'react-icons/fa6';

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
    }
];
export default subjects;