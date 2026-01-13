
import { GoogleGenAI } from "@google/genai";
import { Question } from "../types";

export const getExplanation = async (question: Question): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Jsi odborný učitel strojírenství. Vysvětli stručně a jasně tuto maturitní otázku a proč je správná právě uvedená odpověď.
      
Otázka: ${question.text}
Možnosti:
${question.options.map((opt, i) => `${i}) ${opt}`).join('\n')}
Správná odpověď: ${question.options[question.correctAnswerIndex]}

Vysvětlení napiš v češtině, srozumitelně pro studenta střední odborné školy. Zaměř se na technickou podstatu.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      }
    });

    return response.text || "Nepodařilo se vygenerovat vysvětlení.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_NOT_FOUND");
    }
    return "Omlouvám se, ale při komunikaci s AI došlo k chybě. Zkontrolujte prosím své připojení nebo API klíč.";
  }
};

export const chatWithTutor = async (history: { role: 'user' | 'model', text: string }[], message: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: "Jsi přátelský a vysoce odborný tutor pro strojírenské obory (SPS a STT). Odpovídej věcně, technicky správně a pomáhej studentům pochopit látku k maturitě.",
      }
    });
    return response.text || "Tutor neodpovídá.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Chyba v chatu.";
  }
};
