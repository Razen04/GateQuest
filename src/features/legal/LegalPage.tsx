import { ArrowLeft } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import remarkGfm from 'remark-gfm';

interface LegalPageProps {
    title: string;
    lastUpdated: string;
    content: string;
}

export function LegalPage({ title, lastUpdated, content }: LegalPageProps) {
    const navigate = useNavigate();

    return (
        <div className="h-dvh overflow-y-auto bg-background text-foreground">
            <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
                    <motion.button
                        whileHover={{ x: -4 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => navigate(-1)}
                        className="group inline-flex items-center gap-2 border border-border bg-card/60 px-3.5 py-2 font-grotesk text-xs font-bold text-foreground shadow-sm backdrop-blur-md transition-colors hover:border-chart-1/30 hover:text-chart-1"
                    >
                        <ArrowLeft
                            size={16}
                            className="transition-transform group-hover:-translate-x-0.5"
                        />
                        <span>Back</span>
                    </motion.button>

                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Last updated: {lastUpdated}
                    </span>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
                <h1 className="mb-2 font-display text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                    {title}
                </h1>
                <p className="mb-10 font-mono text-xs text-muted-foreground">
                    Effective {lastUpdated}
                </p>

                <article
                    className="prose prose-neutral max-w-none dark:prose-invert
                        prose-headings:font-display
                        prose-headings:font-bold
                        prose-headings:tracking-tight
                        prose-headings:text-foreground
                        prose-h1:text-3xl prose-h1:mt-0
                        prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
                        prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
                        prose-p:text-foreground prose-p:leading-relaxed
                        prose-li:text-foreground prose-li:leading-relaxed prose-li:my-1
                        prose-a:text-chart-1 prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-foreground
                        prose-code:font-mono prose-code:text-chart-1 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-none prose-code:text-xs prose-code:font-normal
                        prose-code:before:content-none prose-code:after:content-none
                        prose-hr:border-border
                        prose-table:text-sm
                        prose-th:text-left prose-th:text-foreground prose-th:border-border prose-th:pb-2
                        prose-td:border-border prose-td:py-2 prose-td:text-muted-foreground"
                >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </article>

                {/* Footer */}
                <footer className="mt-16 border-t border-border pt-6 text-sm text-muted-foreground">
                    <p>
                        Questions about this document? Contact{' '}
                        <a
                            href="mailto:badbyeworld@proton.me"
                            className="text-chart-1 hover:underline"
                        >
                            badbyeworld[at]proton.me
                        </a>
                    </p>
                </footer>
            </main>
        </div>
    );
}
