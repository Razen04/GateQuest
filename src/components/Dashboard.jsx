import React from 'react'
import { motion } from 'framer-motion'
import { FaBook, FaChartLine, FaClock, FaLaptopCode, FaMedal, FaTrophy } from 'react-icons/fa'

const Dashboard = () => {
    // Animation variants for staggered animations
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 }
        }
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-gray-800">Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Anonymous</span></h1>
                <p className="text-gray-600 mt-2">Your preparation journey is 42% complete. Keep going!</p>
            </motion.div>

            {/* Stats Overview */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center"
                >
                    <div className="p-4 rounded-full bg-blue-50 mr-4">
                        <FaChartLine className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm">Overall Progress</h3>
                        <div className="flex items-center mt-1">
                            <span className="text-2xl font-bold text-gray-800">42%</span>
                            <span className="ml-2 text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">+2.5%</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center"
                >
                    <div className="p-4 rounded-full bg-purple-50 mr-4">
                        <FaMedal className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm">Practice Score</h3>
                        <div className="flex items-center mt-1">
                            <span className="text-2xl font-bold text-gray-800">78/100</span>
                            <span className="ml-2 text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">+3</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center"
                >
                    <div className="p-4 rounded-full bg-indigo-50 mr-4">
                        <FaClock className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm">Study Time</h3>
                        <div className="flex items-center mt-1">
                            <span className="text-2xl font-bold text-gray-800">24h 32m</span>
                            <span className="ml-2 text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">+2h</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Recent Activity & Upcoming Tests */}
                <motion.div
                    className="lg:col-span-2 space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    {/* Recommended Courses */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-800">Recommended Courses</h2>
                            <button className="text-blue-500 text-sm hover:underline">View All</button>
                        </div>

                        <div className="space-y-4">
                            {/* Course Item 1 */}
                            <motion.div
                                className="flex items-start p-4 rounded-lg border border-gray-100 hover:bg-blue-50 transition-all cursor-pointer"
                                whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0,0,0,0.05)", duration: 0.6 }}
                            >
                                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white mr-4">
                                    <FaLaptopCode className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-800">Data Structures & Algorithms</h3>
                                    <p className="text-sm text-gray-500 mt-1">A comprehensive guide to DSA for GATE CS</p>
                                    <div className="mt-2 flex items-center">
                                        <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }}></div>
                                        </div>
                                        <span className="ml-3 text-xs text-gray-500">65% Complete</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Course Item 2 */}
                            <motion.div
                                className="flex items-start p-4 rounded-lg border border-gray-100 hover:bg-purple-50 transition-all cursor-pointer"
                                whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0,0,0,0.05)", duration: 0.6 }}
                            >
                                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white mr-4">
                                    <FaBook className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-800">Operating Systems</h3>
                                    <p className="text-sm text-gray-500 mt-1">Core concepts and practical applications</p>
                                    <div className="mt-2 flex items-center">
                                        <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500 rounded-full" style={{ width: '32%' }}></div>
                                        </div>
                                        <span className="ml-3 text-xs text-gray-500">32% Complete</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                            <button className="text-blue-500 text-sm hover:underline">View All</button>
                        </div>

                        <div className="space-y-4">
                            {/* Timeline Item 1 */}
                            <div className="flex">
                                <div className="flex flex-col items-center">
                                    <div className="w-3.5 h-5 bg-blue-500 rounded-full"></div>
                                    <div className="w-0.5 h-full bg-gray-200"></div>
                                </div>
                                <div className="ml-4 pb-4">
                                    <p className="text-sm text-gray-600">
                                        Completed <span className="font-medium text-gray-800">Practice Test: Computer Networks</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Today, 9:32 AM • Score: 85/100</p>
                                </div>
                            </div>

                            {/* Timeline Item 2 */}
                            <div className="flex">
                                <div className="flex flex-col items-center">
                                    <div className="w-3.5 h-5 bg-purple-500 rounded-full"></div>
                                    <div className="w-0.5 h-full bg-gray-200"></div>
                                </div>
                                <div className="ml-4 pb-4">
                                    <p className="text-sm text-gray-600">
                                        Watched <span className="font-medium text-gray-800">Video: Virtual Memory Management</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Yesterday, 7:15 PM • 45 minutes</p>
                                </div>
                            </div>

                            {/* Timeline Item 3 */}
                            <div className="flex">
                                <div className="flex flex-col items-center">
                                    <div className="w-3.5 h-5 bg-green-500 rounded-full"></div>
                                    <div className="w-0.5 h-full bg-gray-200"></div>
                                </div>
                                <div className="ml-4 pb-4">
                                    <p className="text-sm text-gray-600">
                                        Completed <span className="font-medium text-gray-800">Quiz: Database Systems</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">May 12, 2025, 4:50 PM • Score: 92/100</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column - Stats & Progress */}
                <motion.div
                    className="space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    {/* Upcoming Tests */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800 mb-6">Upcoming Tests</h2>

                        <div className="space-y-4">
                            <motion.div
                                className="p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-all cursor-pointer"
                                whileHover={{ scale: 1.02, boxShadow: "0 3px 10px rgba(0,0,0,0.05)" }}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium text-gray-800">Computer Networks Mock</h3>
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Tomorrow</span>
                                </div>
                                <p className="text-sm text-gray-500">100 questions • 3 hours • 10:00 AM</p>
                            </motion.div>

                            <motion.div
                                className="p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-all cursor-pointer"
                                whileHover={{ scale: 1.02, boxShadow: "0 3px 10px rgba(0,0,0,0.05)" }}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium text-gray-800">Theory of Computation Quiz</h3>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">3 days</span>
                                </div>
                                <p className="text-sm text-gray-500">50 questions • 1 hour • 2:00 PM</p>
                            </motion.div>
                        </div>

                        <button className="mt-4 w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-colors">
                            Schedule New Test
                        </button>
                    </div>

                    {/* Performance Stats */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800 mb-6">Top Performance</h2>

                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-600">Computer Networks</span>
                                    <span className="text-sm font-medium text-gray-800">85%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full" style={{ width: '85%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-600">Database Systems</span>
                                    <span className="text-sm font-medium text-gray-800">92%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" style={{ width: '92%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-600">Algorithms</span>
                                    <span className="text-sm font-medium text-gray-800">78%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" style={{ width: '78%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-600">Operating Systems</span>
                                    <span className="text-sm font-medium text-gray-800">65%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center">
                            <div className="flex items-center gap-2">
                                <FaTrophy className="text-yellow-500 w-5 h-5" />
                                <span className="text-sm font-medium text-gray-800">Rank: <span className='text-blue-500 font-bold'>69</span> out of 5,281 students</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default Dashboard