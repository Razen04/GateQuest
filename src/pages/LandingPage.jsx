import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import appLogo from '/logo.svg';
import { ArrowRight, BookOpen, CloudArrowUp, GithubLogo, ListChecks, MagicWand } from 'phosphor-react';

const features = [
    {
        icon: BookOpen,
        title: 'Practice GATE Questions',
        desc: 'Organized by subject, year, and difficulty. Instant feedback and explanations.',
    },
    {
        icon: ListChecks,
        title: 'Track Progress',
        desc: 'See your stats and accuracy. Bookmark questions for review.',
    },
    {
        icon: MagicWand,
        title: 'Modern Experience',
        desc: 'Dark mode, sound effects, animations, and PWA support for mobile.',
    },
    {
        icon: CloudArrowUp,
        title: 'Cloud Sync',
        desc: 'Sign in with Google. Your progress and bookmarks are always safe.',
    },
];

export default function LandingPage() {
    const navigate = useNavigate();
    return (
        <div className="max-h-lvh flex flex-col bg-gradient-to-br from-blue-50 to-purple-100 dark:from-zinc-900 dark:to-zinc-950 overflow-scroll">
            {/* Header */}
            <header className="w-full flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
                <div className="flex flex-col items-start gap-0">
                    <div className="flex items-center gap-3">
                        <img src={appLogo} alt="GATEQuest Logo" className="w-10 h-10" />
                        <h1 className='text-2xl font-bold dark:text-white'>
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                GATE
                            </span>
                            Quest
                        </h1>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-[-7px] text-right w-full">
                        Good Luck
                    </span>
                </div>
                <nav className="hidden md:flex gap-8 text-gray-700 dark:text-gray-200 text-base font-medium">
                    <a href="#features" className="hover:text-blue-600 transition">Features</a>
                    <a href="#about" className="hover:text-blue-600 transition">About</a>
                </nav>
                <button
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:from-blue-700 hover:to-purple-700 hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition hidden md:block"
                    onClick={() => navigate('/practice')}
                >
                    Try Practice <ArrowRight className="inline ml-2" />
                </button>
            </header>

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                    Crack GATE With Full Preparation
                </motion.h1>
                <p className="max-w-2xl text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-8">
                    Practice, track, and improve your GATE exam preparation with a beautiful, open-source app. Free, privacy-friendly, and always improving.
                </p>
                <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <button
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg shadow hover:from-blue-700 hover:to-purple-700 hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition"
                        onClick={() => navigate('/practice')}
                    >
                        Start Practicing <ArrowRight />
                    </button>
                    <a
                        href="https://github.com/Razen04/GateQuest"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold text-lg shadow hover:bg-gray-800 transition"
                    >
                        <GithubLogo /> GitHub (Soon Public)
                    </a>
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="max-w-5xl mx-auto py-12 px-4">
                <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="rounded-xl bg-white/80 dark:bg-zinc-900/80 shadow p-6 flex flex-col gap-2 border border-border-primary dark:border-border-primary-dark"
                        >
                            <div className='flex gap-3 items-center'>
                                {<f.icon className="h-6 w-6 text-blue-500" />}
                                <h3 className="font-semibold text-lg text-blue-600 dark:text-blue-400">{f.title}</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="max-w-3xl mx-auto py-12 px-4 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">About GATEQuest</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                    GATEQuest is an open-source project built with React, Vite, and Supabase. It is designed to help students prepare for the GATE exam with a modern, distraction-free interface and powerful features. Your data stays private and secure.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                    Made with ❤️ by <a href="https://github.com/Razen04" className="text-blue-600 hover:underline">Razen04</a>
                </p>
            </section>

            {/* Footer */}
            <footer className="w-full py-6 text-center text-gray-400 text-sm border-t border-border-primary dark:border-border-primary-dark bg-white/60 dark:bg-zinc-900/60 mt-auto">
                &copy; {new Date().getFullYear()} GATEQuest. Open Source on <a href="https://github.com/Razen04/GateQuest" className="text-blue-600 hover:underline">GitHub (Soon Public)</a>.
            </footer>
        </div>
    );
}