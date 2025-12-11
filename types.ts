
export enum NutrientType {
  BASE = 'Base Nutrient',
  ADDITIVE = 'Additive/Booster',
  PH_ADJUSTER = 'pH Adjuster',
  OTHER = 'Other'
}

export interface Nutrient {
  id: string;
  name: string;
  brand: string;
  npk: string; // e.g. "4-3-3"
  type: NutrientType;
  volumeLiters: number;
  bottleCount: number;
  cost?: number; // Price per bottle
  currency?: string;
  notes?: string;
}

export enum StrainType {
  INDICA = 'Indica',
  SATIVA = 'Sativa',
  HYBRID = 'Hybrid',
  RUDERALIS = 'Ruderalis (Auto)'
}

export interface LineageNode {
  name: string;
  type: 'Indica' | 'Sativa' | 'Hybrid' | 'Unknown';
}

export interface Strain {
  id: string;
  name: string;
  breeder: string;
  type: StrainType;
  floweringTimeWeeks: number;
  inventoryCount: number; // Seeds or Clones
  cost?: number; // Price per pack
  rating?: number; // 0-5 stars
  isAuto: boolean;
  isLandrace: boolean;
  notes?: string;
  infoUrl?: string; 
  parents?: LineageNode[]; 
  grandparents?: LineageNode[]; 
}

export interface UsageLog {
  id: string;
  date: string; // ISO String
  itemId: string;
  itemName: string;
  category: 'Nutrient' | 'Strain';
  action: 'Dose' | 'Germinate' | 'Restock' | 'Adjustment' | 'Harvest';
  amount: number; // e.g. 5 (seeds), 50 (ml)
  unit: string;
  note?: string;
}

export interface UserSettings {
  userName: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Master';
  aiProvider: 'gemini' | 'lm-studio';
  geminiApiKey: string;
  lmStudioUrl: string; 
  lmStudioModel: string;
  theme: 'light' | 'dark';
}

export interface NewsArticle {
  headline: string;
  summary: string;
  source: string;
  date: string;
  url: string;
}

export interface Phenotype {
  name: string;
  description: string;
}

export interface BreedingRecommendation {
  partnerId: string; 
  partnerName: string;
  projectedName: string; 
  synergyAnalysis: string; 
  dominantTerpenes: string[];
  potentialPhenotypes: Phenotype[];
}

export interface GeneticAnalysis {
  strainName: string;
  parents: LineageNode[]; 
  grandparents: LineageNode[]; 
  recommendations: BreedingRecommendation[];
}

export type View = 'dashboard' | 'nutrients' | 'strains' | 'assistant' | 'settings' | 'news' | 'breeding' | 'analytics';
