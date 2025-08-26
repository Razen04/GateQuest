import MathRenderer from "./MathRenderer"

// Utility: check if a row is the markdown alignment row like | :---: | --- |
const isAlignmentRow = (cells) => cells.length > 0 && cells.every(c => /^:?-{3,}:?$/.test(c.replace(/\s+/g, '')))

// Parse contiguous markdown table blocks into { caption?, headers, rows }
const parseMarkdownTables = (text) => {
    const out = []
    const normalized = text
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&nbsp;/gi, ' ')
    const lines = normalized.split('\n')

    let current = []
    const flush = () => {
        if (current.length < 2) { current = []; return }
        // Convert lines -> cells
        const rows = current.map(line => line.split('|').filter(cell => cell.trim() !== '').map(c => c.trim()))
        if (rows.length < 2) { current = []; return }

        // Find first alignment row index (usually 1)
        const alignIdx = rows.findIndex(isAlignmentRow)
        if (alignIdx !== -1) {
            if (alignIdx === 0 || rows.length <= alignIdx + 1) { current = []; return }
            // Handle optional caption row before headers (like "| R | |")
            let caption = null
            let headerRowIdx = alignIdx - 1
            if (headerRowIdx > 0) {
                const maybeHeader = rows[headerRowIdx]
                const looksHeader = maybeHeader.some(c => /[A-Za-z$\\]/.test(c))
                if (looksHeader) {
                    const maybeCaption = rows[headerRowIdx - 1]
                    const isCaption = maybeCaption.every(c => c.length <= 3 || c === '' || /^(R|S)$/i.test(c))
                    if (isCaption) {
                        caption = maybeCaption.join(' ')
                    }
                }
            }
            const headers = rows[headerRowIdx]
            const dataRows = rows.slice(alignIdx + 1)
            out.push({ type: 'md', caption, headers, rows: dataRows })
            current = []
            return
        }

        // Fallback: no alignment row present (non-standard markdown). Assume first row is headers.
        const headers = rows[0]
        const dataRows = rows.slice(1)
        out.push({ type: 'md', caption: null, headers, rows: dataRows })
        current = []
    }

    for (const line of lines) {
        if (line.trim().startsWith('|')) {
            current.push(line)
        } else {
            flush()
        }
    }
    flush()
    return out
}

// Parse only LaTeX tabular environments into { headers, rows } (not array - those are math)
const parseLatexTabular = (text) => {
    const out = []
    let normalized = text.replace(/<br\s*\/?>/gi, '\n')
    
    // Remove surrounding $$ if present
    if (normalized.startsWith('$$') && normalized.endsWith('$$')) {
        normalized = normalized.slice(2, -2)
    }
    
    // Match only tabular environments (array should be handled as LaTeX math)
    const tabularRe = /\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/g
    
    // Helper function to process matches
    const processMatch = (match) => {
        // Extract the column specification and body
        const beginMatch = match[0].match(/\\begin\{tabular\}(?:\{[^}]*\})?\s*/)
        if (!beginMatch) return null
        
        const body = match[0].substring(beginMatch[0].length, match[0].lastIndexOf('\\end{'))
        
        // Remove \hline and trim
        const cleaned = body
            .replace(/\\hline\s*/g, '')
            .trim()
            
        // Split rows by \\ (but be careful about escaping)
        const rawRows = cleaned.split(/\\\\\s*/).map(r => r.trim()).filter(Boolean)
        if (rawRows.length === 0) return null
        
        // Split cells by & and clean them up
        const rows = rawRows.map(r => 
            r.split('&').map(c => {
                // Clean up LaTeX formatting in cells
                let cell = c.trim()
                // Remove \text{} wrappers
                cell = cell.replace(/\\text\{([^}]*)\}/g, '$1')
                return cell
            })
        )
        
        const headers = rows[0]
        const dataRows = rows.slice(1)
        return { type: 'latex', caption: null, headers, rows: dataRows }
    }
    
    // Process tabular environments only
    let match
    while ((match = tabularRe.exec(normalized)) !== null) {
        const result = processMatch(match)
        if (result) out.push(result)
    }
    
    return out
}

/**
 * Renders one or more tables found in the provided text. Supports:
 * - Markdown tables (including captions like "| R | |" above headers)
 * - LaTeX tabular blocks (\begin{tabular} ... \end{tabular}) - converted to HTML tables
 * - LaTeX math inside cells via MathRenderer
 * Note: LaTeX array environments (\begin{array}) are handled as LaTeX math, not tables
 */
const TableRenderer = ({ tableText }) => {
    if (!tableText || typeof tableText !== 'string') return null

    const mdTables = parseMarkdownTables(tableText)
    const texTables = parseLatexTabular(tableText)
    const all = [...mdTables, ...texTables]

    if (all.length === 0) return null

    return (
        <div className="space-y-6 my-4">
            {all.map((tbl, idx) => (
                <div key={idx} className="overflow-x-auto w-full text-xs">
                    {tbl.caption && (
                        <div className="text-xs sm:text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
                            <MathRenderer text={tbl.caption} />
                        </div>
                    )}
                    <table className="min-w-[360px] w-full border border-gray-200 rounded-lg text-xs sm:text-sm">
                        <thead className="bg-gray-50 dark:bg-zinc-800/40">
                            <tr>
                                {tbl.headers.map((header, i) => (
                                    <th key={i} className="px-2 sm:px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-200 border-b whitespace-nowrap">
                                        {header.includes('\\textbf{') ? (
                                            <strong>
                                                <MathRenderer text={header.replace(/\\textbf\{([^}]*)\}/g, '$1')} />
                                            </strong>
                                        ) : (
                                            <MathRenderer text={header} />
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tbl.rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-gray-50 dark:bg-zinc-800/20'}>
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex} className="px-2 sm:px-4 py-2 text-gray-700 dark:text-gray-200 border-t whitespace-nowrap">
                                            {cell.includes('\\textbf{') ? (
                                                <strong>
                                                    <MathRenderer text={cell.replace(/\\textbf\{([^}]*)\}/g, '$1')} />
                                                </strong>
                                            ) : (
                                                <MathRenderer text={cell} />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    )
}

export default TableRenderer