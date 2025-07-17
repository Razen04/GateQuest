import { FaLaptopCode, FaMicrochip, FaSquareRootAlt } from 'react-icons/fa';

// Subject data
const subjects = [
    {
        id: 1,
        name: "Algorithms",
        apiName: "Algorithms",
        icon: FaLaptopCode, // Store the component reference
        progress: 65,
        questions: 240,
        difficulty: "Medium",
        category: "core",
        color: "blue"
    },
    {
        id: 2,
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
        id: 2.1,
        name: "Computer Organization & Architecture",
        apiName: "CO & Architecture",
        icon: FaMicrochip,
        progress: 42,
        questions: 180,
        difficulty: "Hard",
        category: "bookmarked",
        color: "purple"
    },
    // Other subjects remain the same...
]

export default subjects;