
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { HfInference } from "@huggingface/inference";

export type AiProvider = 'GEMINI' | 'OPENAI' | 'HUGGINGFACE';

export interface AiConfig {
    provider: AiProvider;
    apiKey: string;
    model: string; // Specific model name (e.g., 'gpt-4', 'meta-llama/Llama-2-70b-chat-hf')
}

// Default Configuration (loaded from env or localStorage)
export const DEFAULT_AI_CONFIG: AiConfig = {
    provider: 'GEMINI',
    apiKey: (process.env.GEMINI_API_KEY as string) || '',
    model: 'gemini-1.5-pro'
};

const SYSTEM_INSTRUCTIONS_BASE = `
You are the Lead Architect and AI Manager of BaseForge, a brutalist no-code database platform.
Your role is to assist users with data management, formulas, and platform configuration.

You have the ability to execute commands by outputting a JSON block at the end of your response.

AVAILABLE ACTIONS:
1. Create Table:
\`\`\`json
{ "action": "CREATE_TABLE", "name": "Table Name", "fields": [{"name": "Col1", "type": "TEXT"}] }
\`\`\`

2. Add Field:
\`\`\`json
{ "action": "ADD_FIELD", "tableId": "current", "name": "Field Name", "type": "TEXT" }
\`\`\`

3. Switch View:
\`\`\`json
{ "action": "SWITCH_VIEW", "viewId": "kanban" } // options: table, kanban, gantt, dashboard, ai_manager
\`\`\`

When asked to "create a database for X" or "add a column for Y", provide a helpful text response AND the JSON action block.
Style: Professional, concise, tech-focused, industrial, brutalist.
`;

export const askAi = async (prompt: string, context: string, config: AiConfig): Promise<string> => {
    const fullSystemPrompt = `${SYSTEM_INSTRUCTIONS_BASE}\n\nCurrent System Context:\n${context}`;

    try {
        switch (config.provider) {
            case 'GEMINI':
                return await callGemini(prompt, fullSystemPrompt, config.apiKey, config.model);
            case 'OPENAI':
                return await callOpenAI(prompt, fullSystemPrompt, config.apiKey, config.model);
            case 'HUGGINGFACE':
                return await callHuggingFace(prompt, fullSystemPrompt, config.apiKey, config.model);
            default:
                return "Error: Unknown AI Provider selected.";
        }
    } catch (error: any) {
        console.error("AI Service Error:", error);
        return `System Alert: AI Module Failure. Error: ${error.message || 'Unknown error'}. Check API Key and Connectivity.`;
    }
};

// --- Provider Implementations ---

const callGemini = async (prompt: string, systemPrompt: string, apiKey: string, model: string) => {
    if (!apiKey) throw new Error("Gemini API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });

    // Construct contents
    const contents = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: prompt }] }
    ];

    const response = await ai.models.generateContent({
        model: model || "gemini-1.5-pro",
        contents: `${systemPrompt}\n\nUser Question: ${prompt}`, // New SDK often prefers single prompt or specific structure. 
        // Let's use the simplest single-prompt approach for stability with new SDK based on geminiService.ts success
    });

    return response.text || "No response.";
};

const callOpenAI = async (prompt: string, systemPrompt: string, apiKey: string, model: string) => {
    if (!apiKey) throw new Error("OpenAI API Key is missing.");
    const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true }); // Client-side use

    const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ],
        model: model || "gpt-4-turbo",
    });

    return completion.choices[0].message.content || "No response received.";
};

const callHuggingFace = async (prompt: string, systemPrompt: string, apiKey: string, model: string) => {
    if (!apiKey) throw new Error("Hugging Face Access Token is missing.");
    const hf = new HfInference(apiKey);

    // Using text-generation or conversational task depending on model support
    // For most chat models (e.g., Llama 3), we treat it as a conversation
    const response = await hf.textGeneration({
        model: model || "meta-llama/Meta-Llama-3-70B-Instruct",
        inputs: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`,
        parameters: {
            max_new_tokens: 1024,
            return_full_text: false,
        }
    });

    return response.generated_text;
};
