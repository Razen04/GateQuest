const parseContent = (text: string) => {
    const segments = [];
    let remainingText = text;

    // Process the text until nothing is left
    while (remainingText.length > 0) {
        // Look for next special tokens
        const nextCodeBlock = remainingText.indexOf('```');
        const nextInlineMath = remainingText.indexOf('$');
        const nextInlineCode = remainingText.indexOf('`');
        const nextBlockMath = remainingText.indexOf('$$');
        const nextLineBreak = Math.min(
            remainingText.indexOf('<br>') !== -1 ? remainingText.indexOf('<br>') : Infinity,
            remainingText.indexOf('<br/>') !== -1 ? remainingText.indexOf('<br/>') : Infinity,
            remainingText.indexOf('<br />') !== -1 ? remainingText.indexOf('<br />') : Infinity,
        );
        const nextImage = remainingText.indexOf('![');

        // Determine which token comes first
        let tokenType = null;
        let tokenPos = -1;

        if (nextCodeBlock !== -1 && (tokenPos === -1 || nextCodeBlock < tokenPos)) {
            tokenPos = nextCodeBlock;
            tokenType = 'code';
        }

        if (nextBlockMath !== -1 && (tokenPos === -1 || nextBlockMath < tokenPos)) {
            // Check if it's really $$ and not part of a $ followed by another $
            if (nextBlockMath === 0 || remainingText[nextBlockMath - 1] !== '$') {
                tokenPos = nextBlockMath;
                tokenType = 'blockMath';
            }
        }

        if (nextInlineMath !== -1 && (tokenPos === -1 || nextInlineMath < tokenPos)) {
            // Make sure it's not part of a $$ expression
            if (
                (nextInlineMath === remainingText.length - 1 ||
                    remainingText[nextInlineMath + 1] !== '$') &&
                (nextInlineMath === 0 || remainingText[nextInlineMath - 1] !== '$')
            ) {
                tokenPos = nextInlineMath;
                tokenType = 'math';
            }
        }

        if (nextInlineCode !== -1 && (tokenPos === -1 || nextInlineCode < tokenPos)) {
            // Make sure it's not part of a ``` fenced code block
            const isTriple = remainingText.startsWith('```', nextInlineCode);
            if (!isTriple) {
                tokenPos = nextInlineCode;
                tokenType = 'inlineCode';
            }
        }

        if (nextLineBreak !== Infinity && (tokenPos === -1 || nextLineBreak < tokenPos)) {
            tokenPos = nextLineBreak;
            tokenType = 'lineBreak';
        }

        if (nextImage !== -1 && (tokenPos === -1 || nextImage < tokenPos)) {
            tokenPos = nextImage;
            tokenType = 'image';
        }

        // If no tokens found, add the rest as text
        if (tokenType === null) {
            segments.push({
                type: 'text',
                content: remainingText,
            });
            break;
        }

        // Add text before the token
        if (tokenPos > 0) {
            segments.push({
                type: 'text',
                content: remainingText.substring(0, tokenPos),
            });
        }

        // Process the token
        if (tokenType === 'code') {
            // Find the end of the code block
            const endPos = remainingText.indexOf('```', tokenPos + 3);
            if (endPos === -1) {
                // Unclosed code block, treat the rest as text
                segments.push({
                    type: 'text',
                    content: remainingText.substring(tokenPos),
                });
                break;
            }

            // Extract the code block content including the delimiters
            const codeBlock = remainingText.substring(tokenPos, endPos + 3);

            // Extract language if specified
            let language = '';
            const firstLineEnd = codeBlock.indexOf('\n');
            if (firstLineEnd !== -1) {
                const firstLine = codeBlock.substring(3, firstLineEnd).trim();
                if (firstLine) {
                    language = firstLine;
                }
            }

            segments.push({
                type: 'code',
                content: codeBlock,
                language: language,
            });

            // Update the remaining text
            remainingText = remainingText.substring(endPos + 3);
        } else if (tokenType === 'blockMath') {
            // Find the end of the block math
            const endPos = remainingText.indexOf('$$', tokenPos + 2);
            if (endPos === -1) {
                // Unclosed block math, treat the rest as text
                segments.push({
                    type: 'text',
                    content: remainingText.substring(tokenPos),
                });
                break;
            }

            // Extract the math content without the delimiters
            const mathContent = remainingText.substring(tokenPos + 2, endPos);

            segments.push({
                type: 'blockMath',
                content: mathContent,
            });

            // Update the remaining text
            remainingText = remainingText.substring(endPos + 2);
        } else if (tokenType === 'math') {
            // Find the end of the inline math
            const endPos = remainingText.indexOf('$', tokenPos + 1);
            if (endPos === -1) {
                // Unclosed math, treat the rest as text
                segments.push({
                    type: 'text',
                    content: remainingText.substring(tokenPos),
                });
                break;
            }

            // Extract the math content without the delimiters
            const mathContent = remainingText.substring(tokenPos + 1, endPos);

            segments.push({
                type: 'math',
                content: mathContent,
            });

            // Update the remaining text
            remainingText = remainingText.substring(endPos + 1);
        } else if (tokenType === 'inlineCode') {
            // Find the end of the inline code
            const endPos = remainingText.indexOf('`', tokenPos + 1);
            if (endPos === -1) {
                // Unclosed inline code, treat the rest as text
                segments.push({
                    type: 'text',
                    content: remainingText.substring(tokenPos),
                });
                break;
            }

            // Extract the inline code content without the delimiters
            const inlineCode = remainingText.substring(tokenPos + 1, endPos);

            segments.push({
                type: 'inlineCode',
                content: inlineCode,
            });

            // Update the remaining text
            remainingText = remainingText.substring(endPos + 1);
        } else if (tokenType === 'lineBreak') {
            segments.push({
                type: 'lineBreak',
            });

            // Determine which <br> tag format was found and skip past it
            if (remainingText.substring(tokenPos, tokenPos + 4) === '<br>') {
                remainingText = remainingText.substring(tokenPos + 4);
            } else if (remainingText.substring(tokenPos, tokenPos + 5) === '<br/>') {
                remainingText = remainingText.substring(tokenPos + 5);
            } else if (remainingText.substring(tokenPos, tokenPos + 6) === '<br />') {
                remainingText = remainingText.substring(tokenPos + 6);
            } else {
                // Default case, just skip a bit
                remainingText = remainingText.substring(tokenPos + 4);
            }
        } else if (tokenType === 'image') {
            // Handle markdown image syntax ![alt](src)
            const closeBracketPos = remainingText.indexOf('](', tokenPos);
            if (closeBracketPos === -1) {
                // Malformed image tag, treat as text
                segments.push({
                    type: 'text',
                    content: remainingText.substring(tokenPos, tokenPos + 2),
                });
                remainingText = remainingText.substring(tokenPos + 2);
                continue;
            }

            const closeParenPos = remainingText.indexOf(')', closeBracketPos);
            if (closeParenPos === -1) {
                // Malformed image tag, treat as text
                segments.push({
                    type: 'text',
                    content: remainingText.substring(tokenPos, closeBracketPos + 2),
                });
                remainingText = remainingText.substring(closeBracketPos + 2);
                continue;
            }

            // Extract alt text and image source
            const alt = remainingText.substring(tokenPos + 2, closeBracketPos);
            const src = remainingText.substring(closeBracketPos + 2, closeParenPos);

            segments.push({
                type: 'image',
                alt,
                src,
            });

            // Update remaining text
            remainingText = remainingText.substring(closeParenPos + 1);
        }
    }

    return segments;
};

export default parseContent;
