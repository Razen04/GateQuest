import { FaMicrochip } from 'react-icons/fa';
import { FaBrain } from 'react-icons/fa6';

// Subject data
const subjects = [
    {
        id: 1,
        name: "Computer Organization & Architecture",
        apiName: "CO & Architecture",
        icon: FaMicrochip,
        progress: 42,
        questions: 180,
        difficulty: "Hard",
        category: "core",
        color: "purple"
    },
    {
        id: 1.1,
        name: "Computer Organization & Architecture",
        apiName: "CO & Architecture",
        icon: FaMicrochip,
        progress: 42,
        questions: 180,
        difficulty: "Hard",
        category: "bookmarked",
        color: "purple"
    },
    {
        id: 2,
        name: "Aptitude",
        apiName: "Aptitude",
        icon: FaBrain,
        progress: 42,
        questions: 236,
        difficulty: "Medium",
        category: "aptitude",
        color: "purple"
    },
    {
        id: 2.1,
        name: "Aptitude",
        apiName: "Aptitude",
        icon: FaBrain,
        progress: 42,
        questions: 236,
        difficulty: "Medium",
        category: "bookmarked",
        color: "purple"
    },

    // Other subjects remain the same...
]

export default subjects;