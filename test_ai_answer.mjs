import fs from 'fs';

const questionData = {

        "topic": "Data Interpretation",
        "question": "Weight of a person can be expressed as a function of their age. Suppose this function is identical for two brothers, and it monotonically increases till the age of $50$ years and then it monotonically decreases. Let $a_1$ and $a_2$ (in years) denote the ages of the brothers and $a_1 < a_2$.<br>Which one of the following statements is correct about their age on the day when they attain the same weight?",
        "options": [
            "$a_1 < a_2 < 50$",
            "$a_1 < 50 < a_2$",
            "$50 < a_1 < a_2$",
            "Either $a_1 = 50$ or $a_2 = 50$"
        ],
        "correctAnswer": [1],
        "tags": [
            "/general-aptitude/quantitative-aptitude",
            "/tag/gateda-2025",
            "/tag/quantitative-aptitude",
            "/tag/data-interpretation",
            "/tag/two-marks"
        ],

};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ ERROR: Please set GEMINI_API_KEY environment variable.");
    console.error("Usage: GEMINI_API_KEY=your_key node test_ai_answer.mjs");
    process.exit(1);
}

// 1. Extract image URLs from the markdown question
const imageUrlPattern = /!\[.*?\]\((.*?)\)/g;
const imageUrls = [...(questionData.question.matchAll(imageUrlPattern) || [])].map(m => m[1]);

async function run() {
    console.log(`🔍 Extracted ${imageUrls.length} image(s) from question.`);

    const imageParts = [];
    
    // 2. Download and Base64 encode the images for Gemini Flash
    for (const url of imageUrls) {
        console.log(`⬇️  Downloading image: ${url}`);
        try {
            const res = await fetch(url);
            if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const base64 = buffer.toString('base64');
                const contentType = res.headers.get('content-type') || 'image/jpeg';
                
                imageParts.push({
                    inlineData: {
                        data: base64,
                        mimeType: contentType
                    }
                });
                console.log(`✅ Image converted to base64 (${contentType})`);
            } else {
                console.warn(`⚠️  Failed to download ${url} (HTTP ${res.status})`);
            }
        } catch (e) {
            console.error(`❌ Fetch error for ${url}:`, e);
        }
    }

    // 3. Prepare the prompt exactly as specified in ai_answers_planning.md
    const formattedOptions = questionData.options.map((opt, i) => `${i}: ${opt}`).join('\n');
    const correctOptionString = questionData.correctAnswer.map(i => questionData.options[i]).join(', ');

    const promptText = `You are an expert GATE exam tutor with deep knowledge of ${questionData.subject}.

QUESTION:
${questionData.question}

OPTIONS:
${formattedOptions}

CORRECT ANSWER: ${correctOptionString}

Your task:
first answer in short crisp correct answer in summary way and then deep dive point by point
1. THINK deeply: reason through the problem from first principles.
2. Explain step-by-step WHY the correct answer is right.
3. State any key concepts, theorems, or formulas used.
4. Explain why each wrong option is wrong.
5. Be thorough enough that a student encountering this topic
   for the first time can understand completely.

CRITICAL FORMATTING RULES:
- IMPORTANT: The ENTIRE answer MUST be exactly ONE single line of text. Do NOT use physical newline characters.
- Do NOT use absolute newline characters (\\n) EXCEPT inside block latex ($$ ... $$) or markdown code blocks (\`\`\` ... \`\`\`).
- For all other line breaks, use the HTML <br> tag.
- Use HTML <strong>text</strong> instead of markdown **text** for bold.
- Use HTML <em>text</em> instead of markdown *text* for italics.
- Use HTML <ul><li>item</li></ul> or <ol><li>item</li></ol> tags instead of markdown lists.
- For code blocks, use standard markdown format: \`\`\`language ... \`\`\`.
- Use $ for inline math and $$ for display math.
- NEVER use \\( or \\[ delimiters — they will break rendering.
- never use "" use inline codes
- Output the raw string directly. Do NOT wrap the output in JSON.`;

    const payload = {
        contents: [{
            parts: [
                { text: promptText },
                ...imageParts
            ]
        }],
        generationConfig: {
            temperature: 0.2
        }
    };

    console.log("\n🚀 Sending request to Gemini API...");
    
    const apiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }
    );

    if (!apiRes.ok) {
        const errText = await apiRes.text();
        console.error("❌ Error from API:", apiRes.status, errText);
        return;
    }

    const json = await apiRes.json();
    const answerContent = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answerContent) {
         console.error("❌ Unrecognized API response structure:", JSON.stringify(json, null, 2));
         return;
    }

    console.log("\n======================== [ ✨ GENERATED ANSWER ✨ ] ========================\n");
    console.log(answerContent);
    console.log("\n======================== [ 📊 TOKEN USAGE 📊 ] ========================\n");
    console.log(`Prompt Tokens:     ${json.usageMetadata?.promptTokenCount || 'N/A'}`);
    console.log(`Candidate Tokens:  ${json.usageMetadata?.candidatesTokenCount || 'N/A'}`);
    console.log(`Total Tokens:      ${json.usageMetadata?.totalTokenCount || 'N/A'}`);
    console.log("===========================================================================\n");
}

run().catch(console.error);
