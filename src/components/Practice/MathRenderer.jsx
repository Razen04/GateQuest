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

    // Clean LaTeX content - replace non-breaking spaces with regular spaces
    const cleanLatexContent = (content) => {
        // Replace Unicode character 160 (non-breaking space) with regular space
        return content.replace(/\u00A0/g, ' ');
    }

    // Check if this is a table format (contains multiple pipe characters and newlines)
    if (text.includes('|') && text.includes('\n') && text.split('\n').filter(line => line.includes('|')).length >= 3) {
        return <TableRenderer tableText={text} />
    }

    // If the entire string is a code block
    if (text.startsWith('```') && text.endsWith('```')) {
        return <CodeBlockRenderer code={text} />
    }

    // If the entire string is a LaTeX expression
    if (text.startsWith('$') && text.endsWith('$') && text.indexOf('$', 1) === text.length - 1) {
        return <InlineMath math={cleanLatexContent(text.slice(1, -1))} />
    }

    // If the entire string is a block LaTeX expression
    if (text.startsWith('$$') && text.endsWith('$$') && text.indexOf('$$', 2) === text.length - 2) {
        return <BlockMath math={cleanLatexContent(text.slice(2, -2))} />
    }

    // Parse mixed content (text, LaTeX, code blocks, and line breaks)
    const segments = parseContent(text);

    // Render the segments
    return (
        <>
            {segments.map((segment, index) => {
                switch (segment.type) {
                    case 'math':
                        return (
                            <div
                                key={index}
                                className="inline-block whitespace-nowrap scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100"
                                style={{ verticalAlign: 'middle', display: 'inline-flex' }}
                            >
                                <InlineMath math={cleanLatexContent(segment.content)} />
                            </div>
                        );
                    case 'blockMath':
                        return (
                            <div
                                key={index}
                                className="block scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 p-2 rounded"
                                style={{ display: 'block' }}
                            >
                                <BlockMath math={cleanLatexContent(segment.content)} />
                            </div>
                        );
                    case 'code':
                        return <CodeBlockRenderer key={index} code={segment.content} language={segment.language} />;
                    case 'lineBreak':
                        return <br key={index} />;
                    case 'image':
                        return (
                            <div key={index} className="image-container flex justify-center my-4 w-full text-xs">
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
                        // Process any remaining <br> tags in regular text content
                        if (segment.content.includes('<br>') || segment.content.includes('<br/>') || segment.content.includes('<br />')) {
                            // Split by different br tag formats and render with React fragments
                            const parts = segment.content.split(/<br\s*\/?>/i);
                            return (
                                <React.Fragment key={index}>
                                    {parts.map((part, i) => (
                                        <React.Fragment key={`${index}-${i}`}>
                                            {part}
                                            {i < parts.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </React.Fragment>
                            );
                        }
                        return <span key={index}>{segment.content}</span>;
                }
            })}
        </>
    )
}

export default MathRenderer