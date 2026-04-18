import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import changelog from '/CHANGELOG.md?raw';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArticleIcon, GithubLogoIcon, LinkIcon, HashIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { version } from '../../../package.json';

function Changelog() {
    const [isOpen, setIsOpen] = useState(false);
    const APP_VERSION = version;

    useEffect(() => {
        const lastSeen = localStorage.getItem('app_version');

        if (!lastSeen || lastSeen !== APP_VERSION) {
            setIsOpen(true);
            localStorage.setItem('app_version', APP_VERSION);
        }
    }, [APP_VERSION]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <motion.button
                    aria-label="Changelog"
                    className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 md:p-1.5"
                    whileTap={{ scale: 0.95 }}
                >
                    <ArticleIcon size={20} />
                </motion.button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl">
                <DialogHeader className="py-3">
                    <DialogTitle className="flex flex-col items-center justify-center">
                        {/* The Text Effect */}
                        <motion.span
                            initial={{
                                opacity: 0,
                                letterSpacing: '-0.5em',
                                filter: 'blur(12px)',
                            }}
                            animate={{
                                opacity: 1,
                                letterSpacing: '0.3em',
                                filter: 'blur(0px)',
                            }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="text-4xl font-black bg-gradient-to-r from-blue-500 to-blue-700 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x pl-[0.3em]"
                        >
                            CHANGELOG
                        </motion.span>
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                    <article className="prose prose-neutral dark:prose-invert max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ children }) => (
                                    <h1 className="inline-flex items-center gap-1 text-xl text-blue-500 font-semibold border-b py-2">
                                        <HashIcon className="w-4 h-4 text-red-500" />
                                        {children}
                                    </h1>
                                ),
                                a: ({ href, children }) => {
                                    const isGithubLink =
                                        href?.includes('github.com') || href?.startsWith('#');
                                    return (
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-primary italic bg-blue-200 dark:bg-blue-800"
                                        >
                                            {children}
                                            {isGithubLink ? (
                                                <GithubLogoIcon className="w-3 h-3" />
                                            ) : (
                                                <LinkIcon className="w-3 h-3" />
                                            )}
                                        </a>
                                    );
                                },
                                ul: ({ children }) => (
                                    <ul className="list-disc pl-6 space-y-1">{children}</ul>
                                ),
                                li: ({ children }) => (
                                    <li className="leading-relaxed">{children}</li>
                                ),
                            }}
                        >
                            {changelog}
                        </ReactMarkdown>
                    </article>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

export default Changelog;
