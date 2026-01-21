
// added comment above fix: Always use the direct import for GoogleGenAI and associated types as per guidelines
import { GoogleGenAI } from "@google/genai";
import { GenerateContentResponse, Chat } from "@google/genai";
import { Question } from "../types";

export const getExplanation = async (question: Question): Promise<string> => {
  try {
    // added comment above fix: Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key from the dialog.
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    
    // added comment above fix: Use gemini-3-pro-preview for complex STEM/engineering tasks
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Otázka: ${question.text}
Možnosti:
${question.options.map((opt, i) => `${i}) ${opt}`).join('\n')}
Správná odpověď: ${question.options[question.correctAnswerIndex]}`,
      config: {
        systemInstruction: "Jsi odborný učitel strojírenství. Vysvětli stručně a jasně tuto maturitní otázku a proč je správná právě uvedená odpověď. Vysvětlení napiš v češtině, srozumitelně pro studenta střední odborné školy. Zaměř se na technickou podstatu.",
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      }
    });

    // added comment above fix: Access .text property directly (not a method)
    return response.text || "Nepodařilo se vygenerovat vysvětlení.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // added comment above fix: Handle "Requested entity was not found" error by prompting for a new key as per guidelines
    if (error?.message?.includes("Requested entity was not found")) {
      if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
        (window as any).aistudio.openSelectKey();
      }
      throw new Error("API_KEY_NOT_FOUND");
    }
    return "Omlouvám se, ale při komunikaci s AI došlo k chybě. Zkontrolujte prosím své připojení nebo API klíč.";
  }
};

export const chatWithTutor = async (history: { role: 'user' | 'model', text: string }[], message: string): Promise<string> => {
  try {
    // added comment above fix: Create a new instance right before the call
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    
    // added comment above fix: Use the Chat interface for multi-turn conversations
    const chat: Chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "Jsi přátelský a vysoce odborný tutor pro strojírenské obory (SPS a STT). Odpovídej věcně, technicky správně a pomáhej studentům pochopit látku k maturitě.",
      },
      history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    });

    // added comment above fix: sendMessage only accepts the message parameter
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    
    // added comment above fix: Accessing text via property as per guidelines
    return response.text || "Tutor neodpovídá.";
  } catch (error: any) {
    console.error("Chat Error:", error);
    if (error?.message?.includes("Requested entity was not found")) {
      if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
        (window as any).aistudio.openSelectKey();
      }
    }
    return "Chyba v chatu.";
  }
};
