// MP42 Jadaene Brown 1903233
import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) 
  ? process.env.GEMINI_API_KEY 
  : (import.meta as any).env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey });

export async function getAIRecommendations(nutrientData: any, moistureData: any, weatherData?: any) {
  const prompt = `
    You are a friendly AI farm helper for children who are learning about farming in St. Thomas, Jamaica.
    Look at this farm data and weather forecast, and explain what the farmer should do in very simple words.
    When a plot needs nutrients (Nitrogen, Phosphorus, or Potassium), explicitly suggest a real-life commercial fertilizer or nutrient product (like Miracle-Gro, Osmocote, Blood Meal, Bone Meal, Urea, NPK 15-15-15, etc.) that can be bought at a local farm store.
    Consider the weather! For example, if it's going to rain, maybe they don't need to water.
    Check the "growthHistory" for each plot. The last element is "Today". If the level is 90% to 100%, recommend harvesting!
    
    Nutrient Status:
    ${JSON.stringify(nutrientData)}
    
    Current Field Moisture:
    ${JSON.stringify(moistureData)}
    
    Current Weather:
    ${JSON.stringify(weatherData || { condition: 'Unknown', temperature: 'Unknown' })}

    RESPOND ONLY WITH JSON in this exact structure:
    {
      "summary": "A very brief 1-sentence friendly summary for the whole farm, max 15 words. Mention a specific store-bought fertilizer if needed. If any crop is at 90% to 100% growth, recommend harvesting.",
      "plots": [
        {
          "id": "plot id",
          "name": "plot name",
          "primaryNeed": "e.g., 'Water', 'Nitrogen', 'Phosphorus', 'Potassium', 'Harvest', or 'None'",
          "urgency": number between 0-100 (100 means critical need or ready for harvest),
          "recommendation": "very short action (max 6 words) suggesting a real product if food is needed, water, or harvesting!"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text);
  } catch (error: any) {
    console.warn("AI Advisor error:", error);
    
    const isQuotaError = error?.message?.includes("RESOURCE_EXHAUSTED") || error?.status === 429;
    
    // Fallback structure
    return {
      summary: isQuotaError 
        ? "AI Quota Exhausted. Please check your AI Studio project billing or update your API key in Settings > Secrets." 
        : "Your plants are a little hungry for vitamins. Give them some water and food so they can grow big and strong!",
      plots: moistureData.map((p: any) => ({
        id: p.id,
        name: p.name,
        primaryNeed: (p.growthHistory?.[6]?.level >= 95) ? "Harvest" : p.moisture < 40 ? "Water" : "None",
        urgency: (p.growthHistory?.[6]?.level >= 95) ? 100 : p.moisture < 40 ? 85 : 10,
        recommendation: (p.growthHistory?.[6]?.level >= 95) ? "Ready for harvest!" : p.moisture < 40 ? "Very thirsty! Give lots of water." : "Looking good! Just a little sip."
      }))
    };
  }
}

export async function getAIAudio(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say in a warm, friendly, helpful voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error: any) {
    console.warn("TTS error:", error);
    if (error?.message?.includes("RESOURCE_EXHAUSTED") || error?.status === 429) {
      alert("AI Voice Quota Exhausted. Please check your AI Studio project billing or update your API key in Settings > Secrets.");
    }
    return null;
  }
}
