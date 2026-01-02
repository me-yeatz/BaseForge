
import { GoogleGenAI } from "@google/genai";

export async function askArchitect(question: string, context: string) {
  try {
    // Initialize right before the call to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemPrompt = `You are the Lead Architect and AI Manager of BaseForge, a brutalist no-code database platform.
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
    Style: Professional, concise, tech-focused, industrial.
    State Context: ${context}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `${systemPrompt}
      
      Answer the following developer question with deep technical insight, prioritizing performance, scalability, and security. Use professional tone.
      
      Question: ${question}`,
      config: {
        temperature: 0.7,
        // Removed maxOutputTokens to avoid token exhaustion when using thinkingBudget and follow recommendation.
        // thinkingBudget guides the model for more detailed architectural reasoning.
        thinkingConfig: { thinkingBudget: 5000 }
      },
    });

    // Directly access .text property as per guidelines
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The architect is currently unavailable. Please check the spec manually.";
  }
}
