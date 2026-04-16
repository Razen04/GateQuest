

import { serve } from "std/http/server.ts";

import { encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let question_id = null;
  let user_id = null;
  let flagWasSet = false; // track if we set is_generating_ai so we can reset on error

  try {
    // 1. AUTHENTICATION
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "");

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized: " + (authError?.message || "User not found"));
    user_id = user.id; // Save for error logging if needed

    // 2. PARSE REQUEST
    const bodyText = await req.text();
    const parsedBody = JSON.parse(bodyText);
    question_id = parsedBody.question_id;
    const userApiKey: string | undefined = parsedBody.user_api_key?.trim() || undefined;

    if (!question_id) throw new Error("Missing question_id");

    // 3. FETCH QUESTION & CHECK CACHE
    const { data: questionData, error: qError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", question_id)
      .single();

    if (qError || !questionData) throw new Error("Question not found");

    if (questionData.answer_text && questionData.answer_text.trim() !== "") {
        console.log("CACHE HIT: Returning existing answer_text for", question_id);
        return new Response(JSON.stringify({ answer: questionData.answer_text }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // If another request is already generating this question, tell the client
    // to subscribe to realtime and wait — don't duplicate Gemini API calls.
    if (questionData.is_generating_ai === true) {
        console.log("ALREADY GENERATING: Returning sync signal for", question_id);
        return new Response(JSON.stringify({ status: 'generating' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 4. PREPARE AI DATA
    // Prefer the user's own key (BYOK) — fall back to the server-side env key.
    const GEMINI_API_KEY = userApiKey || Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("No Gemini API key available. Please add your own key in Settings → AI Answer Key.");

    const imageUrlPattern = /!\[.*?\]\((.*?)\)/g;
    const imageUrls = [...((questionData.question || "").matchAll(imageUrlPattern) || [])].map((m: any) => m[1]);

    const imageParts: any[] = [];
    for (const url of imageUrls) {
        try {
            const res = await fetch(url);
            if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                const buffer = new Uint8Array(arrayBuffer);
                const base64 = encode(buffer);
                const contentType = res.headers.get('content-type') || 'image/jpeg';
                imageParts.push({ inlineData: { data: base64, mimeType: contentType } });
            }
        } catch (e) {
            console.error("Failed to fetch image:", url);
        }
    }

    const formattedOptions = (questionData.options || []).map((opt: string, i: number) => `${i}: ${opt}`).join('\n');
    let correctOptionString = Array.isArray(questionData.correct_answer) 
        ? questionData.correct_answer.map((i: number) => questionData.options[i]).join(', ')
        : String(questionData.correct_answer || "");

    // Strip raw markdown image syntax from the text part — the actual images are
    // already supplied as inlineData binary parts below, so Gemini can see them.
    // Including the raw URL in text alongside the binary would be redundant & confusing.
    const cleanQuestionText = (questionData.question || "")
        .replace(/!\[.*?\]\(.*?\)/g, imageParts.length > 0
            ? '[See diagram image provided above]'
            : '[Image — diagram not available in text format]'
        );

    // 5. LOCK: Mark question as generating so concurrent requests get the sync path
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
    const { error: lockError } = await serviceClient
        .from("questions")
        .update({ is_generating_ai: true })
        .eq("id", question_id);

    if (lockError) throw new Error("Failed to set is_generating_ai flag: " + lockError.message);
    flagWasSet = true;

    // 6. CALL GEMINI DIRECTLY (No loops, no Groq)
    console.log(`Generating Gemini Explanation... (${imageParts.length} image(s) attached)`);
    const promptText = `You are an expert GATE exam tutor with deep knowledge of ${questionData.subject}.
QUESTION:
${cleanQuestionText}
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

    const geminiPayload = {
        contents: [{ parts: [{ text: promptText }, ...imageParts] }],
        generationConfig: { temperature: 0.1 } // Kept low for mathematical accuracy
    };

    let apiRes;
    let retries = 3;
    
    while (retries > 0) {
        apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });
        
        if (apiRes.ok || apiRes.status !== 503) {
            break;
        }
        retries--;
        if (retries > 0) await new Promise(r => setTimeout(r, 1500)); // wait before retry
    }

    if (!apiRes) throw new Error("Failed to reach Gemini API");
    // Optionally capture error JSON to aid debugging
    if (!apiRes.ok) {
        let errDesc = "";
        try { 
            const errJson = await apiRes.json(); 
            errDesc = errJson.error?.message || JSON.stringify(errJson);
        } catch(e) {}
        throw new Error(`Gemini API Error: ${apiRes.status} - ${errDesc}`);
    }

    const json = await apiRes.json();
    const finalAnswerContent = json.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!finalAnswerContent) throw new Error("Gemini returned an empty or invalid response.");

    // 7. SAVE TO DATABASE & RELEASE LOCK
    // Set answer_text and flip is_generating_ai back to false atomically.
    // The realtime listener on the client side checks both fields before resolving.
    const { error: updateError } = await serviceClient
        .from("questions")
        .update({ answer_text: finalAnswerContent, is_generating_ai: false })
        .eq("id", question_id);

    if (updateError) throw new Error("Failed to save to DB: " + updateError.message);
    flagWasSet = false; // lock successfully released

    return new Response(JSON.stringify({ answer: finalAnswerContent, status: 'generated' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Pipeline Failed:", error.message);

    // SAFETY NET: If we set the generating flag but then crashed before clearing it,
    // reset it now so the question doesn't get permanently stuck.
    if (flagWasSet && question_id) {
        try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
            const safetyClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
            await safetyClient
                .from("questions")
                .update({ is_generating_ai: false })
                .eq("id", question_id);
            console.log("Safety net: is_generating_ai reset to false after failure.");
        } catch (resetErr) {
            console.error("CRITICAL: Could not reset is_generating_ai flag", resetErr);
        }
    }

    // 7. FALLBACK: LOG TO QUESTION REPORTS TABLE
    if (user_id) {
         try {
             const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
             // Use Service Role to bypass RLS for logging errors
             const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
             
              const reportData: any = {
                  user_id: user_id,
                  report_type: 'AI Generation Failure',
                  report_text: "System Failure: " + error.message,
                  status: 'pending'
              };
              if (question_id) reportData.question_id = question_id;

              await serviceClient.from("question_reports").insert(reportData);
              console.log("Error successfully logged to question_reports table.");
         } catch(logError) { 
             console.error("CRITICAL: Could not save to question_reports", logError); 
         }
    }

    return new Response(JSON.stringify({ error: "Failed to generate AI answer. The error has been reported." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});