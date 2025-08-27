import React from 'react';
import MathRenderer from './MathRenderer.js';

type TableType = 'md' | 'latex';

interface ParsedTable {
    type: TableType;
    caption: string | null;
    headers?: string[];
    rows: string[][];
}

// Utility: check if a row is the markdown alignment row like | :---: | --- |
const isAlignmentRow = (cells: string[]): boolean =>
    cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c.replace(/\s+/g, '')));

// Parse contiguous markdown table blocks
const parseMarkdownTables = (text: string): ParsedTable[] => {
    const out: ParsedTable[] = [];
    const normalized = text.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/gi, ' ');
    const lines = normalized.split('\n');

    let current: string[] = [];

    const flush = () => {
        if (current.length < 2) {
            current = [];
            return;
        }

        const rows = current.map((line) =>
            line
                .split('|')
                .filter((cell) => cell.trim() !== '')
                .map((c) => c.trim()),
        );
        if (rows.length < 2) {
            current = [];
            return;
        }

        const alignIdx = rows.findIndex(isAlignmentRow);

        if (alignIdx !== -1) {
            if (alignIdx === 0 || rows.length <= alignIdx + 1) {
                current = [];
                return;
            }

            let caption: string | null = null;
            const headerRowIdx = alignIdx - 1;

            const maybeHeader = rows[headerRowIdx];
            if (maybeHeader) {
                const looksHeader = maybeHeader.some((c) => /[A-Za-z$\\]/.test(c));

                if (looksHeader && headerRowIdx - 1 >= 0) {
                    const maybeCaption = rows[headerRowIdx - 1];
                    if (maybeCaption) {
                        const isCaption = maybeCaption.every(
                            (c) => c.length <= 3 || c === '' || /^(R|S)$/i.test(c),
                        );
                        if (isCaption) {
                            caption = maybeCaption.join(' ');
                        }
                    }
                }

                const headers: string[] = maybeHeader;
                const dataRows = rows.slice(alignIdx + 1);
                out.push({ type: 'md', caption, headers, rows: dataRows });
            }

            current = [];
            return;
        }

        // fallback
        const headers = rows[0]!;
        const dataRows = rows.slice(1);
        out.push({ type: 'md', caption: null, headers, rows: dataRows });
        current = [];
    };

    for (const line of lines) {
        if (line.trim().startsWith('|')) {
            current.push(line);
        } else {
            flush();
        }
    }
    flush();
    return out;
};

// Parse simple LaTeX tabular environments
const parseLatexTabular = (text: string): ParsedTable[] => {
    const out: ParsedTable[] = [];
    const normalized = text.replace(/<br\s*\/?>/gi, '\n');
    const re = /\\begin\{tabular\}[\s\S]*?\n([\s\S]*?)\\end\{tabular\}/g;

    let match: RegExpExecArray | null;
    while ((match = re.exec(normalized)) !== null) {
        const body = match[1] ?? '';
        const cleaned = body.replace(/\\hline/g, '').trim();

        const rawRows = cleaned
            .split(/\\\\\s*/)
            .map((r) => r.trim())
            .filter(Boolean);

        if (rawRows.length === 0) continue;

        const rows = rawRows.map((r) => r.split('&').map((c) => c.trim()));
        const headers = rows[0]!;
        const dataRows = rows.slice(1);
        out.push({ type: 'latex', caption: null, headers, rows: dataRows });
    }
    return out;
};

interface TableRendererProps {
    tableText: string;
}

/**
 * Renders one or more tables found in the provided text. Supports:
 * - Markdown tables (with optional captions)
 * - LaTeX tabular blocks
 * - LaTeX math inside cells via MathRenderer
 */
const TableRenderer: React.FC<TableRendererProps> = ({ tableText }) => {
    if (!tableText) return null;

    const mdTables = parseMarkdownTables(tableText);
    const texTables = parseLatexTabular(tableText);
    const all = [...mdTables, ...texTables];

    if (all.length === 0) return null;

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
                                {tbl.headers &&
                                    tbl.headers.map((header, i) => (
                                        <th
                                            key={i}
                                            className="px-2 sm:px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-200 border-b whitespace-nowrap"
                                        >
                                            <MathRenderer text={header} />
                                        </th>
                                    ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tbl.rows.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className={
                                        rowIndex % 2 === 0
                                            ? 'bg-white dark:bg-zinc-900'
                                            : 'bg-gray-50 dark:bg-zinc-800/20'
                                    }
                                >
                                    {row.map((cell, cellIndex) => (
                                        <td
                                            key={cellIndex}
                                            className="px-2 sm:px-4 py-2 text-gray-700 dark:text-gray-200 border-t whitespace-nowrap"
                                        >
                                            <MathRenderer text={cell} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default TableRenderer;
