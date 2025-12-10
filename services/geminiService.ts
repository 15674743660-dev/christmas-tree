import { GoogleGenAI, Type } from "@google/genai";
import { HandData } from "../types";

let ai: GoogleGenAI | null = null;

export const initGemini = () => {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
};

export const analyzeHandGesture = async (base64Image: string): Promise<HandData> => {
  if (!ai) {
    console.warn("Gemini AI not initialized");
    return { state: 'NONE', x: 0.5, y: 0.5 };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: `Analyze the hand in this image. Return a JSON object with two fields:
            1. "state": "OPEN" (fingers spread), "CLOSED" (fist), "POINTING" (index finger out), or "NONE" (no hand).
            2. "position": object with "x" and "y" (0 to 1 normalized coordinates of the hand center).
            Only return the JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            state: { type: Type.STRING, enum: ["OPEN", "CLOSED", "POINTING", "NONE"] },
            position: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) return { state: 'NONE', x: 0.5, y: 0.5 };
    
    const result = JSON.parse(text);
    return {
      state: result.state,
      x: result.position?.x ?? 0.5,
      y: result.position?.y ?? 0.5,
    };
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return { state: 'NONE', x: 0.5, y: 0.5 };
  }
};
