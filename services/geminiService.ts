
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Nutrient, Strain, NutrientType, StrainType, UserSettings, NewsArticle, GeneticAnalysis, UsageLog } from '../types';

// --- Gemini Client ---
const getAiClient = (apiKey: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    throw new Error("API Key not found. Please check your settings.");
  }
  return new GoogleGenAI({ apiKey: key });
};

// --- Helper: File to Base64 ---
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- Inventory Scanning ---
export const scanInventoryItem = async (
  base64Image: string, 
  mode: 'nutrient' | 'strain',
  settings: UserSettings
): Promise<Partial<Nutrient | Strain>> => {
  const ai = getAiClient(settings.geminiApiKey);
  const modelId = "gemini-2.5-flash";

  let prompt = "";
  let responseSchema = {};

  if (mode === 'nutrient') {
    prompt = "Analyze this image of a cannabis nutrient bottle. Extract the Name, Brand, NPK ratio (if visible, format N-P-K), and likely Type. If NPK is not visible, use '0-0-0'.";
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        brand: { type: Type.STRING },
        npk: { type: Type.STRING },
        type: { type: Type.STRING, enum: Object.values(NutrientType) },
      },
      required: ["name", "brand", "type"],
    };
  } else {
    prompt = "Analyze this image of a cannabis seed pack. Extract the Strain Name, Breeder, Type (Indica, Sativa, Hybrid), and estimated Flowering Time in weeks (integer). If Auto-flowering, mark isAuto as true.";
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        breeder: { type: Type.STRING },
        type: { type: Type.STRING, enum: Object.values(StrainType) },
        floweringTimeWeeks: { type: Type.INTEGER },
        isAuto: { type: Type.BOOLEAN },
      },
      required: ["name", "breeder", "type"],
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No data returned from AI");
  } catch (error) {
    console.error("Gemini Scan Error:", error);
    throw error;
  }
};

// --- LM Studio Client ---
const callLmStudio = async (
  messages: any[], 
  settings: UserSettings, 
  systemInstruction: string
): Promise<string> => {
  try {
    const url = `${settings.lmStudioUrl.replace(/\/$/, '')}/chat/completions`;
    const fullMessages = [
      { role: "system", content: systemInstruction },
      ...messages
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.lmStudioModel || "local-model",
        messages: fullMessages,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      throw new Error(`LM Studio Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response from local model.";
  } catch (error) {
    console.error("LM Studio Connection Error:", error);
    throw new Error("Failed to connect to LM Studio. Is it running with the Server enabled?");
  }
};

// --- Grow Assistant ---
export const askGrowAssistant = async (
  history: { role: string; text: string }[],
  inventoryContext: { nutrients: Nutrient[], strains: Strain[] },
  settings: UserSettings,
  onStreamUpdate?: (fullText: string) => void
): Promise<string> => {
  
  const nutrientList = inventoryContext.nutrients.map(n => `- ${n.brand} ${n.name} (${n.npk}, ${n.bottleCount} bottles)`).join('\n');
  const strainList = inventoryContext.strains.map(s => `- ${s.breeder} ${s.name} (${s.type}, ${s.floweringTimeWeeks}w, ${s.inventoryCount} seeds)`).join('\n');
  const currentDate = new Date().toLocaleDateString();

  const systemInstruction = `You are Canopy, an expert master grower AI agent managed by ${settings.userName} (${settings.experienceLevel} grower).
  Current Date: ${currentDate}.
  
  YOUR MISSION:
  Act as a proactive inventory manager and cultivation consultant.
  You have full access to the user's "Virtual Grow Room" inventory listed below.
  
  CONTEXT - INVENTORY:
  Nutrients Available:
  ${nutrientList || "No nutrients listed in inventory."}
  
  Strain Library:
  ${strainList || "No strains listed in library."}
  
  GUIDELINES:
  - **Be Proactive**: If the user asks for a schedule, cross-reference their Nutrient list.
  - **Be Adaptive**: Tailor advice to a "${settings.experienceLevel}" level.
  - **Be Concise**: Use Markdown.
  `;

  const lastMessage = history[history.length - 1].text;

  if (settings.aiProvider === 'lm-studio') {
    const apiMessages = history.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.text
    }));
    const response = await callLmStudio(apiMessages, settings, systemInstruction);
    if (onStreamUpdate) onStreamUpdate(response);
    return response;
  } else {
    try {
      const ai = getAiClient(settings.geminiApiKey);
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { systemInstruction: systemInstruction },
        history: history.slice(0, -1).map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        }))
      });

      if (onStreamUpdate) {
        const streamResponse = await chat.sendMessageStream({ message: lastMessage });
        let fullText = '';
        for await (const chunk of streamResponse) {
           const c = chunk as GenerateContentResponse;
           if (c.text) {
             fullText += c.text;
             onStreamUpdate(fullText);
           }
        }
        return fullText;
      } else {
        const response = await chat.sendMessage({ message: lastMessage });
        return response.text || "I couldn't generate a response.";
      }
    } catch (error) {
      const errText = "Error connecting to Gemini. Please check your API Key in settings.";
      if (onStreamUpdate) onStreamUpdate(errText);
      return errText;
    }
  }
};

// --- Analyze Genetics ---
export const analyzeGenetics = async (
  targetStrain: Strain,
  inventory: Strain[],
  settings: UserSettings
): Promise<GeneticAnalysis> => {
  const ai = getAiClient(settings.geminiApiKey);
  
  const potentialPartners = inventory
    .filter(s => s.id !== targetStrain.id)
    .map(s => JSON.stringify({ id: s.id, name: s.name, type: s.type, breeder: s.breeder }))
    .join('\n');

  let knownLineageContext = "";
  if (targetStrain.parents && targetStrain.parents.length > 0) {
    const parentStr = targetStrain.parents.map(p => `${p.name} (${p.type})`).join(', ');
    knownLineageContext += `KNOWN PARENTS: ${parentStr}.\n`;
  }
  if (targetStrain.grandparents && targetStrain.grandparents.length > 0) {
    const gpStr = targetStrain.grandparents.map(gp => `${gp.name} (${gp.type})`).join(', ');
    knownLineageContext += `KNOWN GRANDPARENTS: ${gpStr}.\n`;
  }

  const prompt = `Analyze the cannabis strain "${targetStrain.name}" by ${targetStrain.breeder}.
  ${knownLineageContext ? `IMPORTANT: Use this lineage:\n${knownLineageContext}` : 'TASK 1: Determine lineage.'}
  
  TASK 2: Suggest Breeding Matches from "Potential Partners".
  Potential Partners List:
  ${potentialPartners}

  Return valid JSON matching GeneticAnalysis schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneticAnalysis;
    }
    throw new Error("No data returned");
  } catch (error) {
    throw error;
  }
};

// --- Analyze Usage History ---
export const analyzeGrowData = async (
  logs: UsageLog[],
  nutrients: Nutrient[],
  strains: Strain[],
  settings: UserSettings
): Promise<string> => {
  const ai = getAiClient(settings.geminiApiKey);

  const logSummary = logs.slice(0, 50).map(l => `${l.date}: ${l.action} ${l.amount}${l.unit} of ${l.itemName} (${l.category})`).join('\n');
  const totalValue = nutrients.reduce((acc, n) => acc + ((n.cost || 0) * (n.bottleCount || 0)), 0) + 
                     strains.reduce((acc, s) => acc + (s.cost || 0), 0);

  const prompt = `Analyze this grower's data log and inventory value.
  
  Inventory Value: $${totalValue} (approx).
  Recent Activity Log:
  ${logSummary}

  Provide 3 key insights in Markdown:
  1. **Cost Efficiency**: Comment on spending/value.
  2. **Usage Trends**: Are they using specific nutrients heavily? Are they popping a lot of seeds?
  3. **Recommendation**: Suggest a bulk purchase or process change.
  
  Keep it brief and analytical.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return response.text || "Could not analyze data.";
};

// --- News ---
export const fetchCannabisNews = async (settings: UserSettings, category: string = 'Latest'): Promise<NewsArticle[]> => {
  try {
    const ai = getAiClient(settings.geminiApiKey);
    const currentDate = new Date().toLocaleDateString();
    let categoryQuery = "regarding Cannabis legislation, industry, and culture";
    if (category !== 'Latest') categoryQuery = `specifically regarding Cannabis ${category}`;

    const prompt = `Find 8 most important and recent news stories ${categoryQuery} in the USA as of today, ${currentDate}.
    Return a valid JSON array of NewsArticle objects (headline, summary, source, url, date).
    Output strictly valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    if (response.text) {
      let cleanedText = response.text.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }
      return JSON.parse(cleanedText) as NewsArticle[];
    }
    return [];
  } catch (error) {
    throw new Error("Failed to fetch news.");
  }
};
