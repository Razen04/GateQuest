// Subject data
const subjects = [
    {
        id: 1,
        name: "Data Structures & Algorithms",
        icon: <FaLaptopCode className="h-6 w-6" />,
        progress: 65,
        questions: 240,
        difficulty: "Medium",
        category: "core",
        color: "blue"
    },
    {
        id: 2,
        name: "Computer Organization",
        icon: <FaMicrochip className="h-6 w-6" />,
        progress: 42,
        questions: 180,
        difficulty: "Hard",
        category: "core",
        color: "purple"
    },
    {
        id: 3,
        name: "Engineering Mathematics",
        icon: <FaSquareRootAlt className="h-6 w-6" />,
        progress: 28,
        questions: 320,
        difficulty: "Medium",
        category: "math",
        color: "green"
    },
    // Other subjects remain the same...
]

export default subjects;