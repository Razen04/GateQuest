import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Bookmark,
    Brain,
    ChartPieSlice,
    Cloud,
    DeviceMobile,
    Eye,
    Flag,
    Lightning,
    Moon,
    PuzzlePiece,
    Sun,
    Timer,
    Trophy,
} from '@phosphor-icons/react';
import appLogo from '/logo.png';
import useSettings from '../hooks/useSettings.ts';
import About from './About.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';

// --- DATA: Features list ---
const features = [
    {
        icon: Brain,
        title: 'Master Every Topic',
        desc: 'Practice thousands of questions sorted by subject and topic to strengthen your skills comprehensively.',
    },
    {
        icon: ChartPieSlice,
        title: 'Track Your Progress',
        desc: 'See your streaks, accuracy, and performance at a glance to keep improving every day.',
    },
    {
        icon: Lightning,
        title: 'Fast & Focused',
        desc: 'A smooth, distraction-free interface lets you solve problems quickly and efficiently.',
    },
    {
        icon: Cloud,
        title: 'Sync Across Devices',
        desc: 'Your progress, bookmarks, and settings follow you wherever you go—phone, tablet, or desktop.',
    },
    {
        icon: DeviceMobile,
        title: 'Responsive Design',
        desc: "Enjoy a seamless experience whether you're on desktop or mobile, with intuitive navigation everywhere.",
    },
    {
        icon: Bookmark,
        title: 'Save Important Questions',
        desc: 'Bookmark questions for review later, so you never lose track of key topics.',
    },
    {
        icon: Timer,
        title: 'Timed Challenges',
        desc: 'Enable timers to boost your speed and accuracy.',
    },
    {
        icon: Trophy,
        title: 'Gamified Streaks',
        desc: 'Track your longest streaks and achievements to make learning more motivating and fun.',
    },
    {
        icon: PuzzlePiece,
        title: 'Organized Learning',
        desc: 'Questions are neatly displayed in cards with easy filtering, pagination, and clear layouts.',
    },
];

// --- COMPONENT: App Mockup with a simple initial animation ---
const AppMockup = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md sm:max-w-2xl lg:max-w-3xl mx-auto mt-12 z-10 pb-20"
        >
            <div className="relative aspect-[9/10] lg:aspect-[16/10] border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/50 p-2 sm:p-4 md:p-6 shadow-2xl shadow-blue-600/10 backdrop-blur-xl min-h-[400px]">
                {/* Browser Header */}
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-200 dark:border-slate-700/50">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>

                {/* App Content */}
                <div className="p-4 sm:p-6 md:p-8 text-left">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                        <p className="text-sm sm:text-base font-medium text-blue-500 dark:text-blue-400">
                            Question 1 of 162
                        </p>
                        <div className="flex flex-wrap gap-1 sm:gap-2 items-center">
                            <Button
                                size="icon"
                                className="h-5 w-8 bg-blue-500 dark:bg-blue-600 rounded-full"
                            >
                                <Bookmark size={16} classname="text-white" />
                            </Button>
                            <Button
                                size="icon"
                                className="h-5 w-8 bg-blue-500 dark:bg-blue-600 rounded-full"
                            >
                                <Timer size={4} classname="text-white" />
                            </Button>
                            <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                            >
                                Easy
                            </Badge>
                            <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                                GATE 2024
                            </Badge>
                            <Badge
                                variant="secondary"
                                className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400"
                            >
                                MCQ
                            </Badge>
                        </div>
                    </div>

                    <h3 className="mt-2 text-sm sm:text-lg md:text-xl text-slate-800 dark:text-slate-100">
                        Q. What is the maximum number of hosts in a Class C network?
                    </h3>

                    <div className="mt-4 space-y-2 text-slate-600 dark:text-slate-300">
                        {['254', '256', '65,534'].map((option, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-3 p-2 rounded-lg
                                ${
                                    option === '256'
                                        ? 'bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/30 dark:border-blue-500/50 ring-2 ring-blue-500/20 dark:ring-blue-500/30'
                                        : 'bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full border-2
                                    ${option === '256' ? 'border-blue-500 dark:border-blue-400 bg-blue-500 flex items-center justify-center' : 'border-slate-400 dark:border-slate-500'}`}
                                >
                                    {option === '256' && (
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <span
                                    className={`${option === '256' ? 'text-slate-800 dark:text-white' : ''}`}
                                >
                                    {option}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute left-0 bottom-3 flex flex-row gap-2 w-full px-4 sm:px-8 text-xs sm:text-base">
                    {[
                        {
                            label: 'Previous',
                            icon: ArrowLeft,
                            bg: 'bg-slate-200 text-slate-600 dark:bg-gray-700 dark:text-white',
                        },
                        {
                            label: 'Submit',
                            icon: Eye,
                            bg: 'bg-blue-500 text-white dark:bg-blue-300 dark:text-blue-700',
                        },
                        {
                            label: 'Surrender',
                            icon: Flag,
                            bg: 'bg-violet-500 text-white dark:bg-violet-300 dark:text-violet-700',
                        },
                        {
                            label: 'Next',
                            icon: ArrowRight,
                            bg: 'bg-slate-200 text-slate-600 dark:bg-gray-700 dark:text-white',
                        },
                    ].map((btn, i) => (
                        <Button className={`${btn.bg} flex-1`} size="lg" key={i}>
                            {btn.icon && <btn.icon />}
                            {btn.label}
                        </Button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// --- COMPONENT: Main Landing Page ---
export default function LandingPage() {
    const navigate = useNavigate();
    const { settings, handleSettingToggle } = useSettings();
    const isDark = settings.darkMode;

    return (
        <div className="relative w-full max-h-screen bg-slate-50 dark:bg-[#0A0A0A] text-slate-800 dark:text-white overflow-x-hidden">
            <div
                className="absolute inset-0 z-0 opacity-40 dark:opacity-40"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)',
                    backgroundSize: '24px 24px',
                }}
            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[600px] -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.3)_0%,_rgba(10,10,10,0)_60%)] z-0"></div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <header className="sticky top-0 z-50 w-full flex items-center justify-between px-6 lg:px-20 py-4 bg-white/20 dark:bg-slate-900/50 backdrop-blur-lg border-b border-slate-200 dark:border-slate-300/10">
                    <div className="flex items-center gap-3">
                        <img src={appLogo} alt="GATEQuest Logo" className="w-9 h-9" />
                    </div>
                    <nav className="hidden md:flex gap-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        <Button
                            variant="ghost"
                            asChild
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                            <a href="#features">Features</a>
                        </Button>
                        <Button
                            variant="ghost"
                            asChild
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                            <a href="#about">About</a>
                        </Button>
                    </nav>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-gray-800"
                        onClick={() => handleSettingToggle('darkMode')}
                    >
                        {isDark ? <Moon size={20} /> : <Sun size={20} />}
                    </Button>
                </header>

                <main className="h-screen flex-grow flex flex-col items-center justify-start text-center px-4 pt-24 pb-20 sm:pt-32 sm:pb-28">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold mb-6 tracking-tight max-w-5xl">
                            Precision Practice for Peak <br />
                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                                GATE Performance
                            </span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10">
                            The ultimate open-source platform with a massive question bank,
                            real-time analytics, and a modern, distraction-free interface. Engineer
                            your success.
                        </p>

                        <Button size="lg" onClick={() => navigate('/practice')}>
                            Start Practicing Now <ArrowRight weight="bold" />
                        </Button>
                    </motion.div>
                </main>
                <AppMockup />
                <div className="bg-white dark:bg-[#0A0A0A]">
                    <section id="features" className="w-full max-w-7xl mx-auto py-20 px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-5xl font-bold text-slate-800 dark:text-slate-100">
                                An Arsenal of Features
                            </h2>
                            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                                We've built the tools you need to analyze, adapt, and accelerate
                                your GATE preparation.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {features.map((f, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                    viewport={{ once: true, amount: 0.7 }}
                                >
                                    <Card className="group relative h-full bg-white/5 dark:bg-slate-500/5 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 rounded-none">
                                        <div
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden dark:block"
                                            style={{
                                                background:
                                                    'radial-gradient(300px circle at center, rgba(37, 99, 235, 0.1), transparent)',
                                            }}
                                        />
                                        <CardHeader>
                                            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white mb-4">
                                                <f.icon size={28} weight="bold" />
                                            </div>
                                            <CardTitle className="text-xl text-slate-800 dark:text-slate-100">
                                                {f.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {f.desc}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                    <section id="about">
                        <About landing={true} />
                    </section>

                    <footer className="w-full py-6 text-center text-sm text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-300/10 mt-12">
                        &copy; {new Date().getFullYear()} GATEQuest. All Rights Reserved.
                    </footer>
                </div>
            </div>
        </div>
    );
}
