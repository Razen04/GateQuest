import {
    ArticleIcon,
    GithubLogoIcon,
    LinkIcon,
    MegaphoneIcon,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/components/ui/dialog';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import changelog from '/CHANGELOG.md?raw';
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
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <motion.button
                    aria-label="Changelog"
                    whileTap={{ scale: 0.95 }}
                    className="flex h-8 items-center gap-1.5 px-2.5 text-slate-500 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-all"
                >
                    <ArticleIcon size={20} />
                </motion.button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl rounded-none border border-white/30 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl backdrop-saturate-150 shadow-2xl">
                <DialogHeader className="py-5">
                    <DialogTitle className="flex items-center justify-center">
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
                            className="text-4xl font-black bg-gradient-to-r from-blue-400 via-blue-500 to-blue-700 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x pl-[0.3em]"
                        >
                            CHANGELOG
                        </motion.span>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4 bg-white/20 dark:bg-white/[0.03] backdrop-blur-xl backdrop-saturate-150 p-4">
                    <article className="prose prose-neutral dark:prose-invert max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ children }) => (
                                    <h1 className="inline-flex items-center gap-2 text-xl text-blue-500 font-semibold border-b border-white/20 pb-2">
                                        <MegaphoneIcon className="w-4 h-4 text-red-500 rotate-y-180" />
                                        {children}
                                    </h1>
                                ),
                                a: ({ href, children }) => {
                                    const isGithubLink =
                                        href?.includes('github.com') ||
                                        href?.startsWith('#');

                                    return (
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 text-primary italic bg-blue-500/10 hover:bg-blue-500/20 backdrop-blur-md transition-colors"
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
                                    <ul className="list-disc pl-6 space-y-1">
                                        {children}
                                    </ul>
                                ),
                                li: ({ children }) => (
                                    <li className="leading-relaxed">
                                        {children}
                                    </li>
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
