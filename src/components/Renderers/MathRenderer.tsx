import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import TableRenderer from '../Renderers/TableRenderer.js';
import CodeBlockRenderer from '../Renderers/CodeBlockRenderer.js';
import parseContent from './parseContent.js';
import 'prismjs/themes/prism-tomorrow.css';
// @ts-expect-error Don't really know why TS is showing error (help me)
import 'prismjs/components/prism-c';
// @ts-expect-error Don't really know why TS is showing error (help me)
import 'prismjs/components/prism-cpp';
// @ts-expect-error Don't really know why TS is showing error (help me)
import 'prismjs/components/prism-java';
// @ts-expect-error Don't really know why TS is showing error (help me)
import 'prismjs/components/prism-python';
// @ts-expect-error Don't really know why TS is showing error (help me)
import 'prismjs/components/prism-javascript';

/**
 * Renders text that may contain LaTeX math expressions enclosed in $ symbols,
 * code blocks enclosed in ``` delimiters, and tables with | separators.
 * Safely handles null/undefined inputs and mixed content types.
 */

type MathRendererProps = {
    text: string | number | number[];
};

const MathRenderer = ({ text }: MathRendererProps) => {
    if (!text || typeof text !== 'string') return null;

    // Decode common HTML entities that often appear in problem text (e.g., B&lt;C)
    const decodeEntities = (str: string): string => {
        if (!str) return str;
        return str
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&nbsp;/g, ' ');
    };

    // Clean LaTeX content: decode entities and replace non-breaking spaces with regular spaces
    const cleanLatexContent = (content: string): string => {
        return decodeEntities(content).replace(/\u00A0/g, ' ');
    };

    // Detect markdown alignment row like | :---: | --- |
    const isAlignmentRow = (cells: string[]): boolean =>
        cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c.replace(/\s+/g, '')));

    type Range = { start: number; end: number; kind: 'latex' | 'md' };

    // Split the input into segments of normal text and table blocks (markdown table or LaTeX tabular)
    const splitTextAndTables = (fullText: string) => {
        const ranges: Range[] = [];

        // 1) Detect LaTeX tabular blocks
        const latexRe = /\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/g;
        let m;
        while ((m = latexRe.exec(fullText)) !== null) {
            ranges.push({
                start: m.index,
                end: m.index + m[0].length,
                kind: 'latex',
            });
        }

        // 2) Detect Markdown table blocks using line scanning
        const lines = fullText.split('\n');
        const offsets: number[] = [];
        {
            let acc = 0;
            for (const ln of lines) {
                offsets.push(acc);
                acc += ln.length + 1; // include the newline
            }
        }
        let i = 0;
        while (i < lines.length) {
            const line = lines[i]!;
            if (line.trim().startsWith('|')) {
                const startLine = i;
                const blockLines: string[] = [];
                let j = i;
                while (j < lines.length && lines[j]!.trim().startsWith('|')) {
                    blockLines.push(lines[j]!);
                    j++;
                }
                // Validate it's a real markdown table (has alignment row and at least one data row after it)
                if (blockLines.length >= 2) {
                    const rows = blockLines.map((l) =>
                        l
                            .split('|')
                            .filter((c) => c.trim() !== '')
                            .map((c) => c.trim()),
                    );
                    const alignIdx = rows.findIndex(isAlignmentRow);
                    if (alignIdx > 0 && rows.length > alignIdx + 1) {
                        const start = offsets[startLine]!;
                        const end = j < lines.length ? offsets[j]! : fullText.length;
                        ranges.push({ start, end, kind: 'md' });
                        i = j;
                        continue;
                    }
                }
            }
            i++;
        }

        // 3) Combine ranges (prefer LaTeX when overlapping), sort and build segments
        ranges.sort((a, b) => a.start - b.start || (a.kind === 'latex' ? -1 : 1));
        const merged: Range[] = [];
        for (const r of ranges) {
            if (merged.length === 0 || r.start >= merged[merged.length - 1]!.end) {
                merged.push(r);
            }
            // if overlapping, skip this one (latex already prioritized by sort secondary key)
        }

        const segs: { type: 'text' | 'table'; content: string }[] = [];
        let cursor = 0;
        for (const r of merged) {
            if (cursor < r.start)
                segs.push({
                    type: 'text',
                    content: fullText.slice(cursor, r.start),
                });
            segs.push({
                type: 'table',
                content: fullText.slice(r.start, r.end),
            });
            cursor = r.end;
        }
        if (cursor < fullText.length) segs.push({ type: 'text', content: fullText.slice(cursor) });
        return segs;
    };

    // If the entire string is a code block
    if (text.startsWith('```') && text.endsWith('```')) {
        return <CodeBlockRenderer code={text} />;
    }

    // If the entire string is a LaTeX expression
    if (text.startsWith('$') && text.endsWith('$') && text.indexOf('$', 1) === text.length - 1) {
        return <InlineMath math={cleanLatexContent(text.slice(1, -1))} />;
    }

    // If the entire string is a block LaTeX expression
    if (text.startsWith('$$') && text.endsWith('$$') && text.indexOf('$$', 2) === text.length - 2) {
        return <BlockMath math={cleanLatexContent(text.slice(2, -2))} />;
    }

    // Split text into [text|table] segments first so tables don't swallow the rest of the question
    const tableAwareSegments = splitTextAndTables(text);

    return (
        <>
            {tableAwareSegments.map((outer, segIdx) => {
                if (outer.type === 'table') {
                    return (
                        <div key={`tbl-${segIdx}`} className="my-3">
                            <TableRenderer tableText={outer.content} />
                        </div>
                    );
                }

                // --- NEW LOGIC STARTS HERE ---
                // We split the text segment by <ul> blocks so parseContent doesn't break them
                const listSplit = outer.content.split(/(<ul>[\s\S]*?<\/ul>)/gi);

                return (
                    <span key={`seg-${segIdx}`}>
                        {listSplit.map((part, partIdx) => {
                            // 1. If this part is a List Block
                            if (part.toLowerCase().startsWith('<ul>')) {
                                // Extract list items manually
                                const liMatches = part.match(/<li>([\s\S]*?)<\/li>/gi);
                                if (!liMatches) return null;

                                return (
                                    <ul
                                        key={`${segIdx}-${partIdx}`}
                                        className="list-disc ml-6 my-2"
                                    >
                                        {liMatches.map((liRaw, liIdx) => {
                                            // Strip the <li> tags to get the content
                                            const innerContent = liRaw.replace(/<\/?li>/gi, '');
                                            return (
                                                <li key={liIdx}>
                                                    {/* RECURSION: Use MathRenderer inside the list item */}
                                                    <MathRenderer text={innerContent} />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                );
                            }

                            // 2. If this part is regular Text (Process with parseContent as usual)
                            if (!part) return null;

                            return parseContent(part).map((segment, index) => {
                                // ... (Keep your existing switch statement logic EXACTLY as it was) ...
                                switch (segment.type) {
                                    case 'math':
                                        return (
                                            <div
                                                key={`${segIdx}-${partIdx}-${index}`}
                                                className="inline-block whitespace-nowrap scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100"
                                                style={{
                                                    verticalAlign: 'middle',
                                                    display: 'inline-flex',
                                                }}
                                            >
                                                <InlineMath
                                                    math={cleanLatexContent(segment.content!)}
                                                />
                                            </div>
                                        );
                                    case 'blockMath':
                                        return (
                                            <div
                                                key={`${segIdx}-${partIdx}-${index}`}
                                                className="block scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 p-2"
                                            >
                                                <BlockMath
                                                    math={cleanLatexContent(segment.content!)}
                                                />
                                            </div>
                                        );
                                    case 'code':
                                        return (
                                            <CodeBlockRenderer
                                                key={`${segIdx}-${partIdx}-${index}`}
                                                code={segment.content}
                                                language={segment.language}
                                            />
                                        );
                                    case 'inlineCode':
                                        return (
                                            <CodeBlockRenderer
                                                key={`${segIdx}-${partIdx}-${index}`}
                                                code={`\`${segment.content}\``}
                                            />
                                        );
                                    case 'lineBreak':
                                        return <br key={`${segIdx}-${partIdx}-${index}`} />;
                                    case 'image':
                                        // ... (Keep your existing image logic) ...
                                        return (
                                            <div
                                                key={`${segIdx}-${partIdx}-${index}`}
                                                className="image-container flex justify-center my-4 w-full text-xs"
                                            >
                                                {/* ... existing image rendering code ... */}
                                                <img
                                                    src={segment.src}
                                                    alt={segment.alt}
                                                    className="w-full max-w-full h-auto object-contain shadow-lg mx-auto"
                                                    style={{ maxHeight: '50vh' }}
                                                />
                                            </div>
                                        );
                                    default: {
                                        // REMOVE the check for <br>. Apply this logic to ALL text segments.
                                        // This handles <br>, <b>, and regular text simultaneously.

                                        // 1. Split by <br> tags (if any exist)
                                        const parts = segment.content
                                            ? segment.content.split(/<br\s*\/?>/i)
                                            : [segment.content || ''];

                                        return (
                                            <React.Fragment key={`${segIdx}-${partIdx}-${index}`}>
                                                {parts.map((p, i) => (
                                                    <React.Fragment key={i}>
                                                        <span
                                                            dangerouslySetInnerHTML={{
                                                                __html: decodeEntities(p)
                                                                    // This simple replace works even if the string was split by parseContent
                                                                    .replace(/<b>/gi, '<strong>')
                                                                    .replace(
                                                                        /<\/b>/gi,
                                                                        '</strong>',
                                                                    ),
                                                            }}
                                                        />
                                                        {/* Re-add the break if this wasn't the last part */}
                                                        {i < parts.length - 1 && <br />}
                                                    </React.Fragment>
                                                ))}
                                            </React.Fragment>
                                        );
                                    }
                                }
                            });
                        })}
                    </span>
                );
            })}
        </>
    );
};

export default MathRenderer;
