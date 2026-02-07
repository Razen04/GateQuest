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
import { ArticleIcon } from '@phosphor-icons/react';
import { GithubLogoIcon } from '@phosphor-icons/react';
import { LinkIcon } from '@phosphor-icons/react';
import { SparkleIcon } from '@phosphor-icons/react';

function Changelog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <motion.button
                    aria-label="Changelog"
                    className="cursor-pointer hover:bg-gray-700 md:p-1.5"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArticleIcon size={20} />
                </motion.button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Changelog</DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4">
                    <article className="prose prose-neutral dark:prose-invert max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ children }) => (
                                    <h1 className="inline-flex items-center gap-1 text-xl text-blue-500 font-semibold border-b py-2">
                                        <SparkleIcon className="w-4 h-4 text-yellow-500" />
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
