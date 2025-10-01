import React from 'react';
import { motion } from 'framer-motion';
import { faqs } from '../data/faqs.js';
import AccordionItem from '../components/About/AccordionItem.js';
import { Book, DiscordLogo, GithubLogo, Heart, Coffee } from '@phosphor-icons/react';
import { fadeInUp, stagger } from '../utils/motionVariants.js';

type Answer =
    | {
          type: 'text';
          content: string;
      }
    | {
          type: 'link';
          text: string;
          href: string;
      };

// To render links in the FAQ section
const renderAnswer = (answerParts: Answer[]) => {
    return answerParts.map((part, index) => {
        if (part.type === 'link') {
            return (
                <a
                    key={index}
                    href={part.href}
                    className="text-blue-500 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {part.text}
                </a>
            );
        }
        // Otherwise, it's just plain text
        return <span key={index}>{part.content}</span>;
    });
};

type AboutProps = {
    landing: boolean;
};

const About = ({ landing = false }: AboutProps) => {
    return (
        <div
            className={`mx-auto p-4 sm:p-8 pb-40 dark:text-white ${landing ? '' : 'overflow-scroll max-h-screen'}`}
        >
            {/* Header Section */}
            <motion.header
                initial="initial"
                animate="animate"
                variants={stagger}
                className="text-center my-8 sm:my-24"
            >
                <motion.h1
                    variants={fadeInUp}
                    className="text-5xl sm:text-7xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400"
                >
                    About{' '}
                    <span className="bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text">
                        GATE
                    </span>
                    Quest
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
                variants={stagger}
                viewport={{ once: true, amount: 0.4 }}
                className="max-w-5xl  mx-auto grid md:grid-cols-2 gap-8 my-20"
            >
                <motion.div
                    variants={fadeInUp}
                    className="bg-gray-100 dark:bg-zinc-800/50 p-8 rounded-2xl border border-transparent dark:border-zinc-800"
                >
                    <h2 className="text-3xl font-bold mb-4 flex items-center">
                        <Book className="mr-3 text-blue-500" />
                        Why GATEQuest?
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        There are many websites great for GATE prep out there like GO or Examside
                        but the UI felt less modern to me. I wanted to provided a clean,
                        distraction-free UI so here it is.
                    </p>
                </motion.div>
                <motion.div
                    variants={fadeInUp}
                    className="bg-gray-100 dark:bg-zinc-800/50 p-8 rounded-2xl border border-transparent dark:border-zinc-800"
                >
                    <h2 className="text-3xl font-bold mb-4 flex items-center">
                        <Heart className="mr-3 text-red-500" />
                        Join Me
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                        I want this to become everyone's goto website for GATE prep so contributions
                        are highly appreciated.
                    </p>
                    <div className="flex flex-col space-y-2">
                        <div className="flex flex-col lg:flex-row lg:space-x-2 space-y-2 lg:space-y-0">
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://github.com/Razen04/GATEQuest"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-center bg-gray-900 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-lg"
                            >
                                <GithubLogo className="mr-2 w-5" /> GitHub
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://discord.gg/dFmg3g52c5"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-lg"
                            >
                                <DiscordLogo className="mr-2" /> Discord
                            </motion.a>
                        </div>
                        <motion.a
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            href="https://buymeachai.ezee.li/Razen"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-lg"
                        >
                            <Coffee className="mr-2" /> Buy Me A Chai
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
                    variants={stagger}
                    viewport={{ once: true, amount: 0.2 }}
                    className="max-w-3xl mx-auto"
                >
                    {faqs.map((faq, index) => (
                        <motion.div key={index} variants={fadeInUp}>
                            <AccordionItem
                                question={faq.question}
                                answer={faq.answer}
                                renderAnswer={renderAnswer}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </section>
        </div>
    );
};

export default About;
