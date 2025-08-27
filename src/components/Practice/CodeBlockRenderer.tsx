import { useEffect, useRef } from 'react';
import Prism from 'prismjs';

type CodeBlockRendererProps = {
    code: string | undefined;
    language?: string | undefined;
};

const CodeBlockRenderer = ({ code, language }: CodeBlockRendererProps) => {
    const codeRef = useRef<HTMLElement | null>(null);

    let processedCode = code;
    let codeLang = language || '';
    let isInline = false;
    let isBlock = false;

    // Parse block code fences
    if (processedCode?.startsWith('```')) {
        isBlock = true;
        const firstLineEnd = processedCode.indexOf('\n');
        const firstLine = processedCode.substring(3, firstLineEnd).trim();

        if (firstLine && !firstLine.includes('```')) {
            codeLang = firstLine;
        }

        const lastBacktickPos = processedCode.lastIndexOf('```');
        if (lastBacktickPos > firstLineEnd) {
            processedCode = processedCode.substring(firstLineEnd + 1, lastBacktickPos).trim();
        }
    }
    // Parse inline backticks
    else if (
        processedCode?.startsWith('`') &&
        processedCode.endsWith('`') &&
        processedCode.indexOf('`', 1) === processedCode.length - 1
    ) {
        isInline = true;
        processedCode = processedCode.slice(1, -1);
    }

    // Normalize language
    let langClass = 'language-text';
    if (codeLang) {
        codeLang = codeLang.toLowerCase();
        if (['js', 'javascript'].includes(codeLang)) langClass = 'language-javascript';
        else if (['ts', 'typescript'].includes(codeLang)) langClass = 'language-typescript';
        else if (['py', 'python'].includes(codeLang)) langClass = 'language-python';
        else if (['java'].includes(codeLang)) langClass = 'language-java';
        else if (['c'].includes(codeLang)) langClass = 'language-c';
        else if (['cpp', 'c++'].includes(codeLang)) langClass = 'language-cpp';
        else langClass = `language-${codeLang}`;
    }

    useEffect(() => {
        if (codeRef.current) {
            Prism.highlightElement(codeRef.current);
        }
    }, [processedCode]);

    if (isInline) {
        return (
            <code
                ref={codeRef}
                className={`${langClass} inline-block px-1.5 py-0.5 rounded border bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-100 border-gray-200 dark:border-zinc-700 font-mono text-[0.9em]`}
                style={{ fontFamily: 'Courier New, Courier, monospace' }}
            >
                {processedCode}
            </code>
        );
    }

    return (
        <div className="code-block text-[10px] md:text-lg rounded-md overflow-hidden my-3">
            {codeLang && isBlock && (
                <div className="code-header bg-gray-800 text-gray-300 text-xs font-mono px-2 sm:px-4 py-1">
                    {codeLang}
                </div>
            )}
            <pre
                className={`${langClass} rounded-b-md text-xs sm:text-sm overflow-x-auto p-2 sm:p-4`}
            >
                <code
                    ref={codeRef}
                    className={langClass}
                    style={{ fontFamily: 'Courier New, Courier, monospace' }}
                >
                    {processedCode}
                </code>
            </pre>
            <style>{`
        .code-block {
          background-color: #2d2d2d;
          border: 1px solid #444;
        }
        pre {
          margin: 0;
        }
      `}</style>
        </div>
    );
};

export default CodeBlockRenderer;
