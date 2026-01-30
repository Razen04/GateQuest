import { motion } from 'framer-motion';
import { faqs } from '../data/faqs.js';
import AccordionItem from '../components/About/AccordionItem.js';
import { Book, DiscordLogo, GithubLogo, Heart, Coffee } from '@phosphor-icons/react';
import { fadeInUp, stagger } from '../utils/motionVariants.js';
import { useNavigate } from 'react-router-dom';
import { Text, Title } from '@/components/ui/typography.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import animatedLogo from '/animated_logo.svg';
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
    const navigate = useNavigate();

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
                <motion.div variants={fadeInUp} className="w-full flex flex-col items-center">
                    <img src={animatedLogo} className="w-36 h-36" />
                    <Title className="text-5xl sm:text-7xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        About{' '}
                        <span className="bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text">
                            GATE
                        </span>
                        Quest
                    </Title>
                </motion.div>
                <motion.div variants={fadeInUp}>
                    <Text className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mt-[-15px]">
                        My Mission: Have a community of great people within my reach.
                    </Text>
                </motion.div>
            </motion.header>

            {/* Grid Section with Scroll-Triggered Stagger Animation */}
            <motion.section
                initial="initial"
                whileInView="animate"
                variants={stagger}
                viewport={{ once: true, amount: 0.4 }}
                className="max-w-5xl mx-auto grid md:grid-cols-2 gap-5 my-20"
            >
                <motion.div variants={fadeInUp}>
                    <Card className="bg-gray-100 dark:bg-zinc-800/50 rounded-md border border-transparent dark:border-zinc-800 h-[265px]">
                        <CardHeader className="flex items-center">
                            <Book size={30} className="mr-3 text-blue-500" />
                            <CardTitle className="text-3xl font-bold">Why GATEQuest?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Text className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                There are many websites great for GATE prep out there like GO or
                                Examside but the UI felt less modern to me. I wanted to provided a
                                clean, distraction-free UI so here it is.
                            </Text>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={fadeInUp}>
                    <Card className="bg-gray-100 dark:bg-zinc-800/50 rounded-md border border-transparent dark:border-zinc-800">
                        <CardHeader className="flex items-center">
                            <Heart size={30} className="mr-3 text-red-500" />
                            <Title className="text-3xl font-bold">Join Me</Title>
                        </CardHeader>
                        <CardContent>
                            <Text className="text-gray-700 dark:text-gray-300 mb-6">
                                I want this to become everyone's goto website for GATE prep so
                                contributions are highly appreciated.
                            </Text>
                            <div className="flex flex-col space-y-2">
                                <div className="flex flex-col lg:flex-row lg:space-x-2 space-y-2 lg:space-y-0">
                                    <Button
                                        asChild
                                        className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                                    >
                                        <motion.a
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            href="https://github.com/Razen04/GATEQuest"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <GithubLogo className="mr-2 w-5" /> GitHub
                                        </motion.a>
                                    </Button>
                                    <Button
                                        asChild
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                                    >
                                        <motion.a
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            href="https://discord.gg/dFmg3g52c5"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <DiscordLogo className="mr-2" /> Discord
                                        </motion.a>
                                    </Button>
                                </div>
                                <Button asChild className=" bg-green-500 hover:bg-green-400 flex-1">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate('/donate')}
                                        rel="noopener noreferrer"
                                    >
                                        <Coffee className="mr-2" /> Buy Me A Chai
                                    </motion.button>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
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
