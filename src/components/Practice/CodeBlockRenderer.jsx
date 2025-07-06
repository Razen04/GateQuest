import { useEffect, useRef } from 'react';
import Prism from 'prismjs'

const CodeBlockRenderer = ({ code, language }) => {
    const codeRef = useRef(null);
    
    // Process the code input
    let processedCode = code;
    let codeLang = language || '';
    
    // If the code includes triple backticks, extract them
    if (processedCode.startsWith('```')) {
        const firstLineEnd = processedCode.indexOf('\n');
        const firstLine = processedCode.substring(3, firstLineEnd).trim();
        
        // Check if first line specifies a language
        if (firstLine && !firstLine.includes('```')) {
            codeLang = firstLine;
        }
        
        // Find the end of the code block
        const lastBacktickPos = processedCode.lastIndexOf('```');
        
        // Extract the actual code
        processedCode = processedCode.substring(firstLineEnd + 1, lastBacktickPos).trim();
    }
    
    // Normalize the language name
    let langClass = 'language-text'; // default
    if (codeLang) {
        codeLang = codeLang.toLowerCase();
        if (['js', 'javascript'].includes(codeLang)) langClass = 'language-javascript';
        else if (['py', 'python'].includes(codeLang)) langClass = 'language-python';
        else if (['java'].includes(codeLang)) langClass = 'language-java';
        else if (['c'].includes(codeLang)) langClass = 'language-c';
        else if (['cpp', 'c++'].includes(codeLang)) langClass = 'language-cpp';
        else langClass = `language-${codeLang}`;
    }

    useEffect(() => {
        // Apply syntax highlighting
        if (codeRef.current) {
            Prism.highlightElement(codeRef.current);
        }
    }, [processedCode, codeLang]);

    return (
        <div className="code-block rounded-md overflow-hidden my-3">
            {codeLang && (
                <div className="code-header bg-gray-800 text-gray-300 text-xs font-mono px-4 py-1">
                    {codeLang}
                </div>
            )}
            <pre className={`${langClass} rounded-b-md text-sm overflow-auto`}>
                <code ref={codeRef} className={langClass}>
                    {processedCode}
                </code>
            </pre>
            <style jsx>{`
                .code-block {
                    background-color: #2d2d2d;
                    border: 1px solid #444;
                }
                pre {
                    margin: 0;
                    padding: 1rem;
                }
                code {
                    font-family: 'Courier New', Courier, monospace;
                }
            `}</style>
        </div>
    );
};

export default CodeBlockRenderer