import { GoogleGenAI, Type } from "@google/genai";
import { WishData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLuxuryWish = async (): Promise<WishData> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a short, poetic, and ultra-luxurious Christmas and New Year greeting card text. The tone should be opulent, magical, and sophisticated. Suitable for a high-end jewelry or fashion brand 'Arix'.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A short, elegant 3-5 word headline."
            },
            body: {
              type: Type.STRING,
              description: "A sophisticated 20-30 word greeting message."
            }
          },
          required: ["title", "body"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    return JSON.parse(text) as WishData;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      title: "The Golden Season",
      body: "May the brilliance of this festive season illuminate your path with prosperity, elegance, and timeless joy."
    };
  }
};