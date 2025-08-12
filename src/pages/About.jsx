// components/AccordionItem.js (or place it in the same file)
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';
import { FaGithub, FaDiscord, FaBook, FaHeart } from 'react-icons/fa';

const renderAnswer = (answerParts) => {
    return answerParts.map((part, index) => {
        if (part.type === 'link') {
            return (
                <a key={index} href={part.href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                    {part.text}
                </a>
            );
        }
        // Otherwise, it's just plain text
        return <span key={index}>{part.content}</span>;
    });
};

const AccordionItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    const variants = {
        open: { opacity: 1, height: 'auto', marginTop: '16px' },
        collapsed: { opacity: 0, height: 0, marginTop: '0px' }
    };

    return (
        <motion.div
            initial={false}
            className="border-b border-gray-200 dark:border-zinc-700 last:border-b-0 py-4"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left text-lg font-medium text-gray-800 dark:text-gray-100"
            >
                <span>{question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <FaPlus className="text-gray-500" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={variants}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="text-gray-600 dark:text-gray-400 leading-relaxed overflow-hidden"
                    >
                        {renderAnswer(answer)}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};


const About = () => {
    const faqs = [
        // --- The Basics: What is this and what does it cost? ---
        {
            question: 'What is GATEQuest?',
            answer: [
                { "type": "text", "content": "GATEQuest is a free, open-source platform designed to help students prepare for the GATE (Graduate Aptitude Test in Engineering) exam. My goal is to provide high-quality PYQs in a modern, user-friendly interface." }
            ]
        },
        {
            question: 'Is the platform completely free?',
            answer: [
                { "type": "text", "content": "Yes, GATEQuest is and always will be free to use. It is a community-driven project built by volunteers." }
            ]
        },
        {
            question: 'Will you put Ads?',
            answer: [
                { "type": "text", "content": "Nope, that will defeat the purpose of being distraction-free. If money ever becomes a problem, I will either ask for donations upfront or bear the cost myself." }
            ]
        },

        // --- Content: What's on the platform? ---
        {
            question: "What is the source of questions?",
            answer: [
                { "type": "text", "content": "The source for questions is the " },
                { "type": "link", "text": "GOPDF PYQs repository", "href": "https://github.com/GATEOverflow/GO-PDFs" },
                { "type": "text", "content": "." }
            ]
        },
        {
            question: 'Are all questions present in the app?',
            answer: [
                { "type": "text", "content": "Except for descriptive and out-of-syllabus questions, all are present in the app. I may add descriptive questions in the future." }
            ]
        },
        {
            question: 'What if I find an error in a question?',
            answer: [
                { "type": "text", "content": "Most probably you will because everything is done manually so would like you to let me know about it either via  " },
                { "type": "link", "text": "Discord server", "href": "https://discord.gg/dFmg3g52c5" },
                { "type": "text", "content": " or by opening an issue on GitHub. I will fix it as soon as possible and notify via in-app notification." }
            ]
        },

        // --- Community: How can I get involved? ---
        {
            question: 'How can I contribute to the project?',
            answer: [
                { "type": "text", "content": "I welcome all contributions! Whether you are a developer or a designer (I really need one), the best place to start is our " },
                { "type": "link", "text": "GitHub repository", "href": "https://github.com/Razen04/GateQuest" },
                { "type": "text", "content": ". You can also join our " },
                { "type": "link", "text": "Discord", "href": "https://discord.gg/dFmg3g52c5" },
                { "type": "text", "content": " to discuss ideas." }
            ]
        },
        {
            question: 'How can I report a bug or request a feature?',
            answer: [
                { "type": "text", "content": "The best way to report a bug or suggest a new feature is by opening an issue on our " },
                { "type": "link", "text": "GitHub repository", "href": "https://github.com/Razen04/GateQuest/issues" },
                { "type": "text", "content": ". This helps us track all feedback in one place. Since the repository is not public yet, you can also join our " },
                { "type": "link", "text": "Discord server", "href": "https://discord.gg/dFmg3g52c5" },
                { "type": "text", "content": " and report the issue directly." }
            ]
        },

        // --- Policies: Important details about usage ---
        {
            question: 'What about privacy?',
            answer: [
                { "type": "text", "content": "I take privacy seriously that is why you can use the platform without signing up but analytics require sign-in therefore that is something I can't avoid but rest assured I have taken very little information about you and that is your email id which cannot be changed but other things like name, institution can be changed so you don't necessarily have to use your real details." }
            ]
        }
    ];

    // Animation variants for scroll-triggered effects
    const fadeInUp = {
        initial: { opacity: 0, y: 40 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeInOut' } }
    };

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="mx-auto p-4 sm:p-8 dark:text-white overflow-scroll max-h-[calc(100vh-15vh)]">
            {/* Header Section */}
            <motion.header
                initial="initial"
                animate="animate"
                variants={staggerContainer}
                className="text-center my-8 sm:my-24"
            >
                <motion.h1
                    variants={fadeInUp}
                    className="text-5xl sm:text-7xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400"
                >
                    About GATEQuest
                </motion.h1>
                <motion.p
                    variants={fadeInUp}
                    className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto"
                >
                    My Mission: Have a community of great people within my reach.
                </motion.p>
            </motion.header>

            {/* Grid Section with Scroll-Triggered Stagger Animation */}
            <motion.section
                initial="initial"
                whileInView="animate"
                variants={staggerContainer}
                viewport={{ once: true, amount: 0.4 }}
                className="max-w-5xl  mx-auto grid md:grid-cols-2 gap-8 my-20"
            >
                <motion.div variants={fadeInUp} className="bg-gray-100 dark:bg-zinc-800/50 p-8 rounded-2xl border border-transparent dark:border-zinc-800">
                    <h2 className="text-3xl font-bold mb-4 flex items-center"><FaBook className="mr-3 text-blue-500" />Why GATEQuest?</h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        There are many websites great for GATE prep out there like GO or Examside but the UI felt less modern to me. I wanted to provided a clean, distraction-free UI so here it is.
                    </p>
                </motion.div>
                <motion.div variants={fadeInUp} className="bg-gray-100 dark:bg-zinc-800/50 p-8 rounded-2xl border border-transparent dark:border-zinc-800">
                    <h2 className="text-3xl font-bold mb-4 flex items-center"><FaHeart className="mr-3 text-red-500" />Join Me</h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                        I want this to become everyone's goto website for GATE prep so contributions are highly appreciated.
                    </p>
                    <div className="flex space-x-4">
                        <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href="https://github.com/Razen04/GATEQuest" target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-gray-900 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-lg">
                            <FaGithub className="mr-2 w-5" /> GitHub (Will Soon Public)
                        </motion.a>
                        <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href="https://discord.gg/dFmg3g52c5" target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-lg">
                            <FaDiscord className="mr-2" /> Discord
                        </motion.a>
                    </div>
                </motion.div>
            </motion.section>

            {/* FAQ Section */}
            <section className="my-20 sm:my-32">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl font-bold text-center mb-12"
                >
                    Frequently Asked Questions
                </motion.h2>
                <motion.div
                    initial="initial"
                    whileInView="animate"
                    variants={staggerContainer}
                    viewport={{ once: true, amount: 0.2 }}
                    className="max-w-3xl mx-auto"
                >
                    {faqs.map((faq, index) => (
                        <motion.div key={index} variants={fadeInUp}>
                            <AccordionItem question={faq.question} answer={faq.answer} />
                        </motion.div>
                    ))}
                </motion.div>
            </section>
        </div>
    );
};

export default About;