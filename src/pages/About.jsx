import React from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaDiscord, FaBook, FaHeart } from 'react-icons/fa';
import { faqs } from '../data/faqs';
import AccordionItem from '../components/About/AccordionItem';

// To render links in the FAQ section
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

const About = () => {

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
        <div className="mx-auto p-6 sm:p-8 dark:text-white overflow-scroll max-h-[calc(100vh-15vh)]">
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
                            <AccordionItem question={faq.question} answer={faq.answer} renderAnswer={renderAnswer} />
                        </motion.div>
                    ))}
                </motion.div>
            </section>
        </div>
    );
};

export default About;