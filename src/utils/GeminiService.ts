import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

/**
 * AI MODEL CONFIGURATION
 * We use a prioritized list of models to stay within free tier quotas.
 * Verified Model IDs from Google AI Documentation (Jan 2026).
 */
const MODEL_PRIORITY = [
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-exp-1206",
    "gemini-2.0-flash-thinking-exp-1219",
    "gemini-exp-1121",
];

export const getGeminiChatResponse = async (
    apiKey: string,
    moodLabel: string,
    history: ChatMessage[],
    userInput?: string,
    userName?: string | null,
    interests?: string[]
) => {
    let lastError: any = null;
    let allQuotaExhausted = true;

    // Attempt each model in order of priority
    for (let i = 0; i < MODEL_PRIORITY.length; i++) {
        const activeModelName = MODEL_PRIORITY[i];

        try {
            if (!apiKey) throw new Error("Missing API Key");

            const genAI = new GoogleGenerativeAI(apiKey);

            const systemPrompt = `You are Lumina, a warm and empathetic mood companion.
            The user's name is ${userName || 'friend'}. ${interests && interests.length > 0 ? `They are interested in ${interests.join(', ')}.` : ''}
            The user is currently feeling "${moodLabel}".
            
            INSTRUCTIONS:
            1. Keep responses very short (1-2 sentences).
            2. Be warm, supportive, and never harsh.
            3. Mention or relate to one of their interests if helpful/appropriate for their current mood.
            4. Offer a quick, replyable follow-up.
            5. ALWAYS end with exactly 3 short suggested follow-up questions THE USER CAN ASK YOU (to help them feel better, explore interests, or just chat).
            Format: [SUGGESTIONS]: Question 1? | Question 2? | Question 3?
            
            Examples of good suggestions:
            "How can I relax?" | "Tell me a fun fact about [Interest]?" | "Suggest a movie?" | "Why do I feel this way?" | "Give me a motivation quote?"
            
            No medical advice.`;

            const model = genAI.getGenerativeModel({
                model: activeModelName,
                systemInstruction: systemPrompt
            });

            // SDK history preparation
            let historyForSDK = history
                .filter(msg => msg.text && msg.text.trim().length > 0)
                .map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }],
                }));

            if (historyForSDK.length > 0 && historyForSDK[0].role === 'model') {
                historyForSDK.unshift({
                    role: 'user',
                    parts: [{ text: `I am feeling ${moodLabel}.` }]
                });
            }

            let lastUserMsg = userInput || (historyForSDK.length === 0 ? `I'm feeling ${moodLabel}.` : "Tell me more.");

            if (historyForSDK.length > 0 && historyForSDK[historyForSDK.length - 1].role === 'user') {
                const popped = historyForSDK.pop();
                if (popped) lastUserMsg = popped.parts[0].text;
            }

            const chat = model.startChat({
                history: historyForSDK,
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                }
            });

            const result = await chat.sendMessage(lastUserMsg);
            const response = await result.response;
            const text = response.text();

            if (!text || text.trim().length < 5) {
                throw new Error("Invalid or empty response");
            }

            // Success! Log if we switched models
            if (i > 0) {
                console.log(`✅ Successfully switched to model: ${activeModelName}`);
            }

            return text.trim();

        } catch (error: any) {
            lastError = error;
            const errorMsg = error?.message || "";
            const isQuotaError = errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('resource exhausted');
            const isRateLimitError = errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('too many requests');
            const isNotFoundError = errorMsg.includes('404') || errorMsg.includes('not found');
            const hasNextModel = i < MODEL_PRIORITY.length - 1;

            // If it's not a quota error, mark that not all quotas are exhausted
            if (!isQuotaError && !isRateLimitError) {
                allQuotaExhausted = false;
            }

            if ((isQuotaError || isRateLimitError || isNotFoundError) && hasNextModel) {
                const reason = isQuotaError ? 'Quota exhausted' : isRateLimitError ? 'Too many requests' : 'Not found';
                console.warn(`⚠️ Model ${activeModelName} failed (${reason}). Switching to ${MODEL_PRIORITY[i + 1]}...`);
                continue;
            }

            // If this is the last model and it's a quota/rate limit error, we'll handle it below
            if (!hasNextModel && (isQuotaError || isRateLimitError)) {
                console.error(`❌ All models exhausted. Last attempt: ${activeModelName}`);
                break;
            }

            // For non-quota errors on the last model, throw immediately with helpful message
            if (!hasNextModel && !isQuotaError && !isRateLimitError) {
                console.error(`### GEMINI SDK ERROR (${activeModelName}) ###`, error?.message || error);

                // Provide helpful error messages based on error type
                if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('invalid api key')) {
                    throw new Error("Invalid API Key. Please check your API key in Settings and make sure it's correct.");
                }
                if (errorMsg.includes('403') || errorMsg.includes('permission')) {
                    throw new Error("API Key doesn't have permission. Please enable Gemini API in Google AI Studio.");
                }
                if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
                    throw new Error("Network error. Please check your internet connection and try again.");
                }

                throw new Error(`AI service error: ${errorMsg}`);
            }
        }
    }

    // If all models failed due to quota or rate limits
    if (allQuotaExhausted) {
        const errorMsg = lastError?.message || "";
        const isRateLimit = errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('too many requests');

        if (isRateLimit) {
            throw new Error(
                "⏱️ Too Many Requests\n\n" +
                "You're sending messages too quickly. Please:\n" +
                "• Wait 1-2 minutes before trying again\n" +
                "• Avoid sending multiple messages rapidly\n" +
                "• The AI needs a short break to process requests"
            );
        }

        throw new Error(
            "📊 Quota Limit Reached\n\n" +
            "All AI models have reached their daily quota. Solutions:\n\n" +
            "1️⃣ Wait 24 hours for quota reset\n" +
            "2️⃣ Get a new API key at: https://aistudio.google.com/\n" +
            "3️⃣ Check your quota usage in Google AI Studio\n" +
            "4️⃣ Consider upgrading to paid tier for higher limits"
        );
    }

    // Fallback response if we somehow get here
    throw lastError || new Error("Unable to get AI response. Please try again later.");
};

export const getGeminiResponse = async (apiKey: string, moodLabel: string, userName?: string | null, interests?: string[]) => {
    return getGeminiChatResponse(apiKey, moodLabel, [], undefined, userName, interests);
};

export const validateApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
    try {
        if (!apiKey) return { valid: false, error: "Please enter an API key." };

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Try a very simple, low-token generation
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: "hi" }] }],
            generationConfig: { maxOutputTokens: 5 }
        });

        const response = await result.response;
        if (response.text()) {
            return { valid: true };
        }
        return { valid: false, error: "Could not verify key. Please try again." };
    } catch (error: any) {
        let msg = "Invalid API Key.";
        if (error?.message?.includes('429')) msg = "Quota exceeded or too many requests.";
        if (error?.message?.includes('403')) msg = "Key does not have permission for this model.";
        if (error?.message?.includes('API_KEY_INVALID')) msg = "The API key provided is invalid.";
        return { valid: false, error: msg };
    }
};

export const parseSuggestions = (text: string): { cleanText: string, suggestions: string[] } => {
    if (!text) return { cleanText: '', suggestions: [] };
    const parts = text.split('[SUGGESTIONS]:');
    const cleanText = parts[0].trim();
    const suggestions = parts[1]
        ? parts[1].split('|').map(s => s.trim()).filter(s => s.length > 5)
        : [];
    return { cleanText, suggestions };
};
