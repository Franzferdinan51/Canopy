
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Nutrient, Strain, NutrientType, StrainType, UserSettings, NewsArticle, GeneticAnalysis } from '../types';

// --- Gemini Client ---
const getAiClient = (apiKey: string) => {
  // Use user provided key, fallback to env, or throw error
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

// --- Inventory Scanning (Gemini Only for Vision Reliability) ---
export const scanInventoryItem = async (
  base64Image: string, 
  mode: 'nutrient' | 'strain',
  settings: UserSettings
): Promise<Partial<Nutrient | Strain>> => {
  // We strictly use Gemini for vision tasks as it's more reliable than setting up local vision models for most users
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

// --- LM Studio / OpenAI Compatible Client ---
const callLmStudio = async (
  messages: any[], 
  settings: UserSettings, 
  systemInstruction: string
): Promise<string> => {
  try {
    const url = `${settings.lmStudioUrl.replace(/\/$/, '')}/chat/completions`;
    
    // Prepend system instruction to messages for OpenAI format
    const fullMessages = [
      { role: "system", content: systemInstruction },
      ...messages
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

/**
 * Grow Assistant Chat - Context Aware & Agentic
 * Supports Streaming
 */
export const askGrowAssistant = async (
  history: { role: string; text: string }[],
  inventoryContext: { nutrients: Nutrient[], strains: Strain[] },
  settings: UserSettings,
  onStreamUpdate?: (fullText: string) => void
): Promise<string> => {
  
  // 1. Build Context
  const nutrientList = inventoryContext.nutrients.map(n => `- ${n.brand} ${n.name} (${n.npk}, ${n.bottleCount} bottles)`).join('\n');
  const strainList = inventoryContext.strains.map(s => `- ${s.breeder} ${s.name} (${s.type}, ${s.floweringTimeWeeks}w, ${s.inventoryCount} seeds)`).join('\n');
  const currentDate = new Date().toLocaleDateString();

  // 2. Build Agentic System Prompt
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
  - **Be Proactive**: If the user asks for a schedule, cross-reference their Nutrient list. If they are missing CalMag or a Base Nutrient, WARN them specifically.
  - **Be Adaptive**: Tailor advice to a "${settings.experienceLevel}" level.
    - Beginner: Explain the 'Why' simply. Focus on pH and watering.
    - Master: Focus on EC/PPM, VPD targets, and Crop Steering.
  - **Be Concise**: Use Markdown. Use lists. Do not ramble.
  `;

  const lastMessage = history[history.length - 1].text;

  // 3. Route to Provider
  if (settings.aiProvider === 'lm-studio') {
    // Convert history format for OpenAI/LM Studio
    const apiMessages = history.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.text
    }));
    // Note: Streaming not implemented for fetch-based LM Studio in this version
    const response = await callLmStudio(apiMessages, settings, systemInstruction);
    if (onStreamUpdate) onStreamUpdate(response);
    return response;
  } else {
    // Gemini Route
    try {
      const ai = getAiClient(settings.geminiApiKey);
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemInstruction,
        },
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
      console.error("Gemini Chat Error:", error);
      const errText = "Error connecting to Gemini. Please check your API Key in settings.";
      if (onStreamUpdate) onStreamUpdate(errText);
      return errText;
    }
  }
};

/**
 * Analyze Genetic Lineage and suggest Cross Breeding
 */
export const analyzeGenetics = async (
  targetStrain: Strain,
  inventory: Strain[],
  settings: UserSettings
): Promise<GeneticAnalysis> => {
  
  const ai = getAiClient(settings.geminiApiKey);
  
  // Filter inventory to exclude the target strain itself
  const potentialPartners = inventory
    .filter(s => s.id !== targetStrain.id)
    .map(s => JSON.stringify({ id: s.id, name: s.name, type: s.type, breeder: s.breeder }))
    .join('\n');

  // Include user provided lineage if available
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
  
  ${knownLineageContext ? `IMPORTANT - USE THIS KNOWN LINEAGE DATA provided by the grower:\n${knownLineageContext}\nDo not hallucinate different parents if they are listed above.` : 'TASK 1: Determine its Lineage (Parents/Grandparents). If custom/unknown, make an educated guess.'}
  
  TASK 2: Suggest Breeding Matches
  Review the provided list of "Potential Partners" from my inventory.
  Select 3 strains that would make a scientifically or aesthetically interesting cross-breed with "${targetStrain.name}".
  Invent a creative "Projected Name" for the offspring.
  Explain the synergy (e.g., combining terpenes, yield, growth structure).
  Identify the top 3 dominant terpenes likely to be present in this cross.
  Predict 2 potential phenotypes (e.g., "Pheno 1: Tall, heavy yield, fruity").

  Potential Partners List:
  ${potentialPartners}

  Return valid JSON matching this schema:
  {
    "strainName": "${targetStrain.name}",
    "parents": [{"name": "string", "type": "Indica/Sativa/Hybrid"}], (Max 2)
    "grandparents": [{"name": "string", "type": "Indica/Sativa/Hybrid"}], (Max 4)
    "recommendations": [
      {
        "partnerId": "id from list",
        "partnerName": "name from list",
        "projectedName": "Creative Name",
        "synergyAnalysis": "Why this is a good match",
        "dominantTerpenes": ["Myrcene", "Limonene", "etc"],
        "potentialPhenotypes": [
           { "name": "Pheno 1", "description": "Description of structure and smell" },
           { "name": "Pheno 2", "description": "Description of structure and smell" }
        ]
      }
    ]
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneticAnalysis;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Genetics Analysis Error:", error);
    throw error;
  }
};

/**
 * Fetch Cannabis News using Google Search Grounding with Structured JSON output
 */
export const fetchCannabisNews = async (settings: UserSettings, category: string = 'Latest'): Promise<NewsArticle[]> => {
  try {
    const ai = getAiClient(settings.geminiApiKey);
    const currentDate = new Date().toLocaleDateString();
    
    // Customize prompt based on category
    let categoryQuery = "";
    switch(category) {
      case 'Legislation': categoryQuery = "specifically regarding Cannabis legalization, laws, and bills"; break;
      case 'Cultivation': categoryQuery = "specifically regarding Cannabis growing techniques, horticulture, and cultivation science"; break;
      case 'Business': categoryQuery = "specifically regarding Cannabis stocks, industry mergers, and market trends"; break;
      case 'Medical': categoryQuery = "specifically regarding Medical Marijuana research, health benefits, and studies"; break;
      default: categoryQuery = "regarding Cannabis legislation, industry, and culture";
    }

    const prompt = `Find 8 most important and recent news stories ${categoryQuery} in the USA as of today, ${currentDate}.
    
    Return a valid JSON array where each object has the following keys:
    - headline (string)
    - summary (string, max 2 sentences)
    - source (string, name of the news outlet)
    - url (string, the link to the article if found, otherwise use a search link)
    - date (string, e.g. "Oct 12")
    
    Output strictly valid JSON. Do not wrap in markdown code blocks.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Note: responseMimeType and responseSchema cannot be used with googleSearch
      }
    });

    if (response.text) {
      let cleanedText = response.text.trim();
      // Remove markdown code blocks if present (```json ... ```)
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }
      
      const articles = JSON.parse(cleanedText) as NewsArticle[];
      return articles;
    }
    
    return [];

  } catch (error) {
    console.error("News Fetch Error:", error);
    throw new Error("Failed to fetch news. Ensure you have a valid Gemini API Key enabled.");
  }
};
