import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import {
    FaBook, FaChartLine, FaClock,
    FaLaptopCode, FaMedal
} from 'react-icons/fa';
import Login from './Login';
import AuthContext from '../context/AuthContext';
import { getUserProfile } from '../helper';

const Dashboard = () => {
    const { isLogin, loading } = useContext(AuthContext);
    const user = getUserProfile();

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    // Handle loading
    if (loading) {
        return (
            <div className="w-full h-dvh flex justify-center items-center text-gray-600">
                Loading...
            </div>
        );
    }

    // If not logged in
    if (!isLogin) {
        return (
            <div className="flex justify-center items-center w-full h-full">
                {/* Sidebar will be rendered by Layout, so just render Login centered in content area */}
                <div className="flex-1 flex justify-center items-center min-h-[60vh]">
                    <Login canClose={false} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 min-h-[100dvh]">
            {/* Welcome */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-gray-800">
                    Welcome back,{' '}
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {user?.name}
                    </span>
                </h1>
                <p className="text-gray-600 mt-2">Your preparation journey is 42% complete. Keep going!</p>
            </motion.div>

            {/* Stats */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
                {/* Progress */}
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
                            <span className="text-2xl font-bold text-gray-800">2%</span>
                            <span className="ml-2 text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">+2%</span>
                        </div>
                    </div>
                </motion.div>

                {/* Accuracy */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center"
                >
                    <div className="p-4 rounded-full bg-purple-50 mr-4">
                        <FaMedal className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm">Overall Accuracy</h3>
                        <div className="flex items-center mt-1">
                            <span className="text-2xl font-bold text-gray-800">2%</span>
                            <span className="ml-2 text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">+2%</span>
                        </div>
                    </div>
                </motion.div>

                {/* Study Time */}
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
                            <span className="text-2xl font-bold text-gray-800">2</span>
                            <span className="ml-2 text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">+2</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Courses / Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    className="lg:col-span-2 space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <motion.div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-800">Recommended Courses</h2>
                            <button className="text-blue-500 text-sm hover:underline">View All</button>
                        </div>

                        <div className="space-y-4">
                            {/* DSA Course */}
                            <motion.div
                                className="flex items-start p-4 rounded-lg border border-gray-100 hover:bg-blue-50 transition-all cursor-pointer"
                                whileHover={{ scale: 1.02 }}
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

                            {/* OS Course */}
                            <motion.div
                                className="flex items-start p-4 rounded-lg border border-gray-100 hover:bg-purple-50 transition-all cursor-pointer"
                                whileHover={{ scale: 1.02 }}
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
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;