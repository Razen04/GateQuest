import React from 'react'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import TableRenderer from './TableRenderer'
import CodeBlockRenderer from './CodeBlockRenderer'
import parseContent from './QuestionCard/parseContent'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-javascript'

/**
 * Renders text that may contain LaTeX math expressions enclosed in $ symbols,
 * code blocks enclosed in ``` delimiters, and tables with | separators.
 * Safely handles null/undefined inputs and mixed content types.
 */
const MathRenderer = ({ text }) => {
    if (!text || typeof text !== 'string') return null

    // Decode common HTML entities that often appear in problem text (e.g., B&lt;C)
    const decodeEntities = (str) => {
        if (!str) return str
        return str
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&nbsp;/g, ' ')
            .replace(/&dollar;/g, '$')  // Handle encoded dollar signs
    }

    // Clean LaTeX content: decode entities and replace non-breaking spaces with regular spaces
    const cleanLatexContent = (content) => {
        return decodeEntities(content).replace(/\u00A0/g, ' ')
    }

    // Detect markdown alignment row like | :---: | --- |
    const isAlignmentRow = (cells) => cells.length > 0 && cells.every(c => /^:?-{3,}:?$/.test(c.replace(/\s+/g, '')))

    // Split the input into segments of normal text and table blocks (markdown table or LaTeX tabular)
    const splitTextAndTables = (fullText) => {
        const ranges = []

        // 1) Detect only LaTeX tabular blocks (not array - those should be handled as math)
        const latexTabularRe = /\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/g
        
        let m
        while ((m = latexTabularRe.exec(fullText)) !== null) {
            ranges.push({ start: m.index, end: m.index + m[0].length, kind: 'latex' })
        }

        // 2) Detect Markdown table blocks using line scanning
        const lines = fullText.split('\n')
        const offsets = []
        {
            let acc = 0
            for (const ln of lines) {
                offsets.push(acc)
                acc += ln.length + 1 // include the newline
            }
        }
        let i = 0
        while (i < lines.length) {
            const line = lines[i]
            if (line.trim().startsWith('|')) {
                const startLine = i
                const blockLines = []
                let j = i
                while (j < lines.length && lines[j].trim().startsWith('|')) {
                    blockLines.push(lines[j])
                    j++
                }
                // Validate it's a real markdown table (has alignment row and at least one data row after it)
                if (blockLines.length >= 2) {
                    const rows = blockLines.map(l => l.split('|').filter(c => c.trim() !== '').map(c => c.trim()))
                    const alignIdx = rows.findIndex(isAlignmentRow)
                    if (alignIdx > 0 && rows.length > alignIdx + 1) {
                        const start = offsets[startLine]
                        const end = j < lines.length ? offsets[j] : fullText.length
                        ranges.push({ start, end, kind: 'md' })
                        i = j
                        continue
                    }
                }
            }
            i++
        }

        // 3) Combine ranges (prefer LaTeX when overlapping), sort and build segments
        ranges.sort((a, b) => a.start - b.start || (a.kind === 'latex' ? -1 : 1))
        const merged = []
        for (const r of ranges) {
            if (merged.length === 0 || r.start >= merged[merged.length - 1].end) {
                merged.push(r)
            }
            // if overlapping, skip this one (latex already prioritized by sort secondary key)
        }

        const segs = []
        let cursor = 0
        for (const r of merged) {
            if (cursor < r.start) segs.push({ type: 'text', content: fullText.slice(cursor, r.start) })
            segs.push({ type: 'table', content: fullText.slice(r.start, r.end) })
            cursor = r.end
        }
        if (cursor < fullText.length) segs.push({ type: 'text', content: fullText.slice(cursor) })
        return segs
    }

    // If the entire string is an inline LaTeX expression
    if (
        text.startsWith('$') &&
        text.endsWith('$') &&
        text.indexOf('$', 1) === text.length - 1
    ) {
        let inner = text.slice(1, -1).trim();

        // Normalize: decode entities and unescape \$ → $
        inner = decodeEntities(inner).replace(/\\\$/g, '$');

        // If it's literally just a "$", don't render as math
        if (inner === '$') {
            return <span>$</span>;
        }

        return <InlineMath math={cleanLatexContent(inner)} />;
    }


    // If the entire string is a block LaTeX expression
    if (
        text.startsWith('$$') &&
        text.endsWith('$$') &&
        text.indexOf('$$', 2) === text.length - 2
    ) {
        const content = text.slice(2, -2).trim();

        // Check if it contains table-like array structures that should be rendered as tables
        if (content.includes('\\begin{array}') && (content.includes('\\hline') || content.includes('|'))) {
            return <TableRenderer tableText={text} />
        }

        // Same safety: ignore escaped dollar block (rare but possible)
        if (content === '\\$') {
            return <span>$</span>;
        }

        return <BlockMath math={cleanLatexContent(content)} />;
    }

    // Split text into [text|table] segments first so tables don't swallow the rest of the question
    const tableAwareSegments = splitTextAndTables(text)

    return (
        <>
            {tableAwareSegments.map((outer, segIdx) => (
                outer.type === 'table' ? (
                    <div key={`tbl-${segIdx}`} className="my-3">
                        <TableRenderer tableText={outer.content} />
                    </div>
                ) : (
                    // For normal text, parse mixed content (math, code, images, and line breaks)
                    parseContent(outer.content).map((segment, index) => {
                        switch (segment.type) {
                            case 'math':
                                // Handle escaped dollar signs - if the math content contains only \$, render as $
                                if (segment.content.trim() === '\\$') {
                                    return <span key={`${segIdx}-${index}`}>$</span>;
                                }
                                return (
                                    <div
                                        key={`${segIdx}-${index}`}
                                        className="inline-block whitespace-nowrap scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100"
                                        style={{ verticalAlign: 'middle', display: 'inline-flex' }}
                                    >
                                        <InlineMath math={cleanLatexContent(segment.content)} />
                                    </div>
                                );
                            case 'blockMath':
                                return (
                                    <div
                                        key={`${segIdx}-${index}`}
                                        className="block scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 p-2 rounded"
                                        style={{ display: 'block' }}
                                    >
                                        <BlockMath math={cleanLatexContent(segment.content)} />
                                    </div>
                                );
                            case 'code':
                                return <CodeBlockRenderer key={`${segIdx}-${index}`} code={segment.content} language={segment.language} />;
                            case 'inlineCode':
                                return (
                                    <CodeBlockRenderer key={`${segIdx}-${index}`} code={`\`${segment.content}\``} />
                                );
                            case 'lineBreak':
                                return <br key={`${segIdx}-${index}`} />;
                            case 'image':
                                return (
                                    <div key={`${segIdx}-${index}`} className="image-container flex justify-center my-4 w-full text-xs">
                                        <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl overflow-hidden">
                                            <img
                                                src={segment.src}
                                                alt={segment.alt || "Image"}
                                                className="w-full max-w-full h-auto object-contain rounded shadow-lg mx-auto"
                                                style={{ maxHeight: '50vh', minWidth: 0 }}
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    // Create error message element that doesn't disrupt content flow
                                                    const errorDiv = document.createElement('div');
                                                    errorDiv.className = 'text-red-500 text-xs p-1 bg-red-50 rounded border border-red-200 inline-block';
                                                    errorDiv.innerText = `[Image unavailable: ${segment.alt || "unnamed image"}]`;
                                                    e.target.parentNode.appendChild(errorDiv);
                                                }}
                                            />
                                            {segment.alt && (
                                                <div className="text-center text-xs text-gray-500 mt-2 italic">
                                                    {segment.alt}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            default:
                                // Process any remaining <br> tags and escaped LaTeX symbols in regular text content
                                if (segment.content.includes('<br>') || segment.content.includes('<br/>') || segment.content.includes('<br />') || segment.content.includes('\\$') || segment.content.includes('\\mid') || segment.content.includes('`$`')) {
                                    let processedContent = segment.content;
                                    
                                    // Handle escaped LaTeX symbols first
                                    processedContent = processedContent.replace(/\\\$/g, '$'); // \$ -> $
                                    processedContent = processedContent.replace(/\\mid\b/g, '|'); // \mid -> |
                                    // Handle backtick-dollar-backtick pattern
                                    processedContent = processedContent.replace(/`\$`/g, '$'); // `$` -> $
                                    
                                    // Split by different br tag formats and render with React fragments
                                    if (processedContent.includes('<br>') || processedContent.includes('<br/>') || processedContent.includes('<br />')) {
                                        const parts = processedContent.split(/<br\s*\/?>/i);
                                        return (
                                            <React.Fragment key={`${segIdx}-${index}`}>
                                                {parts.map((part, i) => (
                                                    <React.Fragment key={`${segIdx}-${index}-${i}`}>
                                                        {decodeEntities(part)}
                                                        {i < parts.length - 1 && <br />}
                                                    </React.Fragment>
                                                ))}
                                            </React.Fragment>
                                        );
                                    } else {
                                        return <span key={`${segIdx}-${index}`}>{decodeEntities(processedContent)}</span>;
                                    }
                                }
                                return <span key={`${segIdx}-${index}`}>{decodeEntities(segment.content)}</span>;
                        }
                    })
                )
            ))}
        </>
    )
}

export default MathRenderer