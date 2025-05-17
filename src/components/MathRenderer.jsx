import React from 'react'
import { InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import TableRenderer from './TableRenderer'

/**
 * Renders text that may contain LaTeX math expressions enclosed in $ symbols
 * Safely handles null/undefined inputs and mixed text with LaTeX
 */
const MathRenderer = ({ text }) => {
    if (!text || typeof text !== 'string') return null

    // Check if this is a table format (contains multiple pipe characters and newlines)
    if (text.includes('|') && text.includes('\n') && text.split('\n').filter(line => line.includes('|')).length >= 3) {
        return <TableRenderer tableText={text} />
    }

    // If the entire string is a LaTeX expression
    if (text.startsWith('$') && text.endsWith('$') && text.indexOf('$', 1) === text.length - 1) {
        return <InlineMath math={text.slice(1, -1)} />
    }

    // Handle mixed text with inline LaTeX
    const segments = []
    let lastIndex = 0
    let inMath = false
    let mathStartIndex = -1

    // Find all $ symbols and split the text
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '$') {
            if (!inMath) {
                // Start of a math expression
                if (i > lastIndex) {
                    segments.push({
                        type: 'text',
                        content: text.substring(lastIndex, i)
                    })
                }
                mathStartIndex = i
                inMath = true
            } else {
                // End of a math expression
                segments.push({
                    type: 'math',
                    content: text.substring(mathStartIndex + 1, i)
                })
                lastIndex = i + 1
                inMath = false
            }
        }
    }

    // Add any remaining text
    if (lastIndex < text.length) {
        segments.push({
            type: 'text',
            content: text.substring(lastIndex)
        })
    }

    // Render the segments
    return (
        <>
            {segments.map((segment, index) =>
                segment.type === 'math' ?
                    <InlineMath key={index} math={segment.content} /> :
                    <span key={index}>{segment.content}</span>
            )}
        </>
    )
}

export default MathRenderer
