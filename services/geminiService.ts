
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Nutrient, Strain, NutrientType, StrainType, UserSettings, NewsArticle, GeneticAnalysis, UsageLog, LineageNode, ProductAlternative, Attachment, AiModelId, BreedingProject } from '../types';

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

// --- URL Data Fetching ---
export const fetchStrainDataFromUrl = async (
  url: string,
  settings: UserSettings
): Promise<Partial<Strain>> => {
  const ai = getAiClient(settings.geminiApiKey);
  
  const prompt = `TARGET URL: "${url}"

  ROLE: You are a research assistant.
  OBJECTIVE: Find definitive growing information for the cannabis strain at the provided URL.

  INSTRUCTIONS:
  1.  **Extract Terms**: Identify the Strain Name and Breeder from the URL string itself.
  2.  **Web Search**: 
      - Execute a search for the URL to find the page title and snippet.
      - Execute a search for "[Strain Name] [Breeder] strain info flowering time lineage".
  3.  **Synthesize**: Combine findings to fill the JSON schema.
  4.  **Validation**: 
      - **Do NOT hallucinate**. If the flowering time is not explicitly found in search results, return null.
      - If the lineage is not explicitly found, return empty lists.
      - Type (Indica/Sativa) is often a percentage (e.g. 60/40). If >50% Indica, label "Indica".

  JSON Output Schema:
  {
    "name": "string",
    "breeder": "string",
    "type": "Indica" | "Sativa" | "Hybrid" | "Ruderalis",
    "floweringTimeWeeks": number | null,
    "isAuto": boolean,
    "notes": "string (concise summary of effects/flavors)",
    "parents": [{"name": "string", "type": "Indica/Sativa/Hybrid"}]
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }] 
      }
    });

    if (response.text) {
      let cleanedText = response.text.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }
      
      try {
        const data = JSON.parse(cleanedText);
        let normalizedType = StrainType.HYBRID;
        if (data.type?.toLowerCase().includes('indica')) normalizedType = StrainType.INDICA;
        else if (data.type?.toLowerCase().includes('sativa')) normalizedType = StrainType.SATIVA;
        else if (data.type?.toLowerCase().includes('auto') || data.type?.toLowerCase().includes('ruderalis') || data.isAuto) normalizedType = StrainType.RUDERALIS;

        return {
          ...data,
          type: normalizedType,
          isAuto: data.isAuto || normalizedType === StrainType.RUDERALIS,
          floweringTimeWeeks: typeof data.floweringTimeWeeks === 'number' ? data.floweringTimeWeeks : null
        };
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError, cleanedText);
        throw new Error("AI returned invalid JSON format.");
      }
    }
    throw new Error("No data returned from AI");
  } catch (error) {
    console.error("Gemini URL Fetch Error:", error);
    throw error;
  }
};

// --- Product Alternatives ---
export const findProductAlternatives = async (
  itemName: string,
  brand: string,
  category: 'Nutrient' | 'Seed',
  settings: UserSettings
): Promise<ProductAlternative[]> => {
  const ai = getAiClient(settings.geminiApiKey);

  const prompt = `Find 3 excellent alternative products for: "${brand} ${itemName}" (${category}).
  
  Criteria:
  1. Similar or better quality.
  2. Comparable function (e.g. if base nutrient, suggest base nutrient).
  3. Include approximate USD price.
  
  Return JSON Array:
  [
    { "name": "string", "brand": "string", "approxPrice": number, "reason": "string (Why is this a good alternative?)", "searchQuery": "string (Optimized Google Search Query)" }
  ]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ProductAlternative[];
    }
    return [];
  } catch (error) {
    console.error("Alternatives Fetch Error", error);
    throw new Error("Could not find alternatives.");
  }
};

// --- Grow Assistant & Agent ---
export const askGrowAssistant = async (
  history: { role: string; text: string }[],
  inventoryContext: { nutrients: Nutrient[], strains: Strain[], breedingProjects: BreedingProject[], currentView: string },
  settings: UserSettings,
  attachments: Attachment[] = [],
  modelId: AiModelId = 'gemini-2.5-flash',
  onStreamUpdate?: (fullText: string, isThinking?: boolean) => void,
  onAgentAction?: (action: any) => void
): Promise<string> => {
  
  const safeNutrients = inventoryContext.nutrients || [];
  const safeStrains = inventoryContext.strains || [];
  const safeProjects = inventoryContext.breedingProjects || [];
  
  const nutrientList = safeNutrients.map(n => `- ${n.brand} ${n.name} (${n.npk}, ${n.bottleCount} bottles)`).join('\n');
  const strainList = safeStrains.map(s => `- ${s.id}: ${s.breeder} ${s.name} (${s.type}, ${s.floweringTimeWeeks}w, ${s.inventoryCount} seeds)`).join('\n');
  const projectList = safeProjects.map(p => `- ${p.id}: "${p.name}" (Status: ${p.status}, Start: ${p.startDate})`).join('\n');
  
  const currentDate = new Date().toLocaleDateString();

  const isThinkingModel = modelId.includes('thinking');

  const systemInstruction = `You are Canopy, a fully Context-Aware, Agentic Master Grower AI.
  Managed by: ${settings.userName} (${settings.experienceLevel} grower).
  Date: ${currentDate}.
  Current View: ${inventoryContext.currentView}.

  FULL INVENTORY ACCESS:
  Nutrients:
  ${nutrientList || "None"}
  
  Strain Library:
  ${strainList || "None"}
  
  Breeding Projects:
  ${projectList || "None"}

  CAPABILITIES:
  1. **Sub-Agents**: If a query is specialized (e.g., genetic lineage, pest diagnosis), act as a specialist sub-agent. Prefix your response with your Role (e.g., "🧬 Geneticist:", "🩺 Plant Doctor:").
  2. **Agentic Control**: You can CONTROL the app. If the user asks to go somewhere (e.g., "Take me to nutrients", "Go to breeding lab"), YOU MUST output a JSON command block at the end of your response.
  3. **Project Management**: You can move projects on the Kanban board or create new ones.

  AGENTIC COMMAND FORMAT:
  Output ONE JSON block on a new line at the very end.

  1. NAVIGATION:
  \`\`\`json
  { "type": "NAVIGATE", "payload": "breeding" } 
  \`\`\`
  Valid payloads: dashboard, nutrients, strains, breeding, order, analytics, news, settings.

  2. MOVE BREEDING PROJECT:
  \`\`\`json
  { "type": "MOVE_PROJECT", "payload": { "id": "project_id", "status": "Pollination" } }
  \`\`\`
  Valid statuses: Planning, Pollination, Seed Harvest, Pheno Hunting, Completed.

  3. CREATE BREEDING PROJECT:
  \`\`\`json
  { "type": "CREATE_PROJECT", "payload": { "motherId": "strain_id", "fatherId": "strain_id", "name": "Project Name", "notes": "Notes..." } }
  \`\`\`

  GUIDELINES:
  - Be proactive. Look for gaps in inventory.
  - Be concise and use Markdown.
  `;

  // Prepare contents with attachments
  const lastMessageText = history[history.length - 1].text;
  const userContentParts: any[] = [{ text: lastMessageText }];
  
  attachments.forEach(att => {
    userContentParts.push({
      inlineData: {
        mimeType: att.mimeType,
        data: att.base64
      }
    });
  });

  // Construct history for API (Standard text history + current multimedia message)
  const pastHistory = history.slice(0, -1).map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  try {
    const ai = getAiClient(settings.geminiApiKey);
    const chat = ai.chats.create({
      model: modelId,
      config: { systemInstruction: systemInstruction },
      history: pastHistory
    });

    const streamResponse = await chat.sendMessageStream({ 
      role: 'user', 
      parts: userContentParts 
    });

    let fullText = '';
    
    for await (const chunk of streamResponse) {
       const c = chunk as GenerateContentResponse;
       if (c.text) {
         fullText += c.text;
         if (onStreamUpdate) onStreamUpdate(fullText, isThinkingModel);
       }
    }

    // Check for Agentic Commands in the final text
    // Regex matches the last JSON block with a "type" field
    const commandRegex = /```json\s*(\{\s*"?type"?:.*?\})\s*```/s;
    const match = fullText.match(commandRegex);
    if (match && match[1] && onAgentAction) {
        try {
            const action = JSON.parse(match[1]);
            onAgentAction(action);
            // Clean the JSON out of the visible chat
            fullText = fullText.replace(match[0], '').trim();
            // Perform one last update to clean UI
            if (onStreamUpdate) onStreamUpdate(fullText, isThinkingModel);
        } catch (e) { console.error("Agent Command Parse Error", e); }
    }

    return fullText;

  } catch (error) {
    console.error("Gemini Assistant Error:", error);
    const errText = "Error connecting to Gemini. Please check your API Key or Network.";
    if (onStreamUpdate) onStreamUpdate(errText);
    return errText;
  }
};

// --- Analyze Genetics ---
export const analyzeGenetics = async (
  targetStrain: Strain,
  inventory: Strain[],
  settings: UserSettings
): Promise<GeneticAnalysis> => {
  const ai = getAiClient(settings.geminiApiKey);
  
  const safeInventory = inventory || [];
  
  const potentialPartners = safeInventory
    .filter(s => s.id !== targetStrain.id)
    .map(s => JSON.stringify({ id: s.id, name: s.name, type: s.type, breeder: s.breeder }))
    .join('\n');

  let knownLineageContext = "";
  if (targetStrain.parents && targetStrain.parents.length > 0) {
    const parentStr = targetStrain.parents.map(p => `${p.name} (${p.type})`).join(', ');
    knownLineageContext += `KNOWN PARENTS: ${parentStr}.\n`;
  }

  const prompt = `Analyze the cannabis strain "${targetStrain.name}" by ${targetStrain.breeder}.
  ${knownLineageContext ? `IMPORTANT: Use this lineage:\n${knownLineageContext}` : 'TASK 1: Determine lineage.'}
  
  TASK 2: Suggest Breeding Matches from "Potential Partners".
  Potential Partners List:
  ${potentialPartners}

  IMPORTANT REQUIREMENTS:
  1. For each recommendation, predict 2-3 specific potential phenotypes. 
  2. For EACH phenotype, provide a 'name' (e.g. 'Berry Pheno') and a DETAILED 'description'.
  
  Expected JSON Structure:
  {
    "strainName": "string",
    "parents": [{"name": "string", "type": "Indica/Sativa/Hybrid"}],
    "grandparents": [],
    "recommendations": [
      {
        "partnerId": "id from list",
        "partnerName": "string",
        "projectedName": "string",
        "synergyAnalysis": "string",
        "dominantTerpenes": ["string"],
        "potentialPhenotypes": [
           { "name": "string", "description": "Detailed description." }
        ]
      }
    ]
  }

  Return valid JSON matching this schema.
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

  Provide 3 key insights in Markdown.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return response.text || "Could not analyze data.";
};

// --- Generate Dashboard Briefing ---
export const generateDashboardBriefing = async (
  nutrients: Nutrient[],
  strains: Strain[],
  settings: UserSettings
): Promise<string> => {
  const ai = getAiClient(settings.geminiApiKey);
  const lowStockNutes = nutrients.filter(n => (n.bottleCount || 0) <= 1).map(n => n.name).join(', ');
  const totalBottles = nutrients.reduce((acc, n) => acc + (n.bottleCount || 0), 0);

  const prompt = `
  You are 'Canopy', a Master Grower AI.
  Grower Name: ${settings.userName}
  Context:
  - Total Strains: ${strains.length}
  - Nutrient Bottles: ${totalBottles}
  - Low Stock Nutrients: ${lowStockNutes || 'None'}
  
  Task:
  Generate a "Daily Briefing" card text (Markdown).
  1. Start with a short, motivating greeting.
  2. Give 1 specific observation.
  3. Offer 1 quick "Pro Tip".
  Keep it under 60 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    return response.text || "Welcome back, Grower.";
  } catch (e) {
    return "Welcome back! Check your nutrient levels today.";
  }
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
