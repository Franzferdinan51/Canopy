
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
  isAuto: boolean;
  isLandrace: boolean;
  notes?: string;
  infoUrl?: string; // URL to breeder info or seed bank
  parents?: LineageNode[]; // Max 2
  grandparents?: LineageNode[]; // Max 4
}

export interface UserSettings {
  userName: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Master';
  aiProvider: 'gemini' | 'lm-studio';
  geminiApiKey: string;
  lmStudioUrl: string; // e.g., http://localhost:1234/v1
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
  partnerId: string; // ID from user inventory
  partnerName: string;
  projectedName: string; // Creative name for the child
  synergyAnalysis: string; // Why they fit together
  dominantTerpenes: string[];
  potentialPhenotypes: Phenotype[];
}

export interface GeneticAnalysis {
  strainName: string;
  parents: LineageNode[]; // Usually 2
  grandparents: LineageNode[]; // Usually 4
  recommendations: BreedingRecommendation[];
}

export interface GrowOpState {
  nutrients: Nutrient[];
  strains: Strain[];
}

export type View = 'dashboard' | 'nutrients' | 'strains' | 'assistant' | 'settings' | 'news' | 'breeding';
