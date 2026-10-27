// ---- Core Types ----
export type Theme = "dark" | "light" | "system";

export type Screen =
  | "optimize"
  | "library"
  | "saved"
  | "settings"
  | "workflows";

export type Category =
  | "education"
  | "coding"
  | "learning"
  | "daily"
  | "writing"
  | "research"
  | "business"
  | "general";

export type OptimizationMode =
  | "quick"
  | "deep"
  | "expert"
  | "beginner"
  | "custom";

export type SavedTab = "favorites" | "history" | "templates";

export type ComparisonView = "optimized" | "original";

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  template: string;
  category: Category;
  subcategory?: string;
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  createdAt: number;
  updatedAt: number;
  source?: string;
}

export interface SavedPrompt {
  id: string;
  original: string;
  optimized: string;
  category: Category;
  mode: OptimizationMode;
  isFavorite: boolean;
  createdAt: number;
  tags?: string[];
  parentId?: string;
  feedback?: "useful" | "needs-work";
}

export interface UserSettings {
  theme: Theme;
  language: "en" | "bn";
  defaultCategory: Category;
  defaultMode: OptimizationMode;
  showHistory: boolean;
  aiProvider: AIProviderConfig | null;
  websiteIntegrations: WebsiteIntegration[];
  keyboardShortcut: string;
  onboardingComplete: boolean;
}

export interface AIProviderConfig {
  provider: "openai" | "anthropic" | "gemini";
  apiKey: string;
  model: string;
}

export interface WebsiteIntegration {
  site: string;
  enabled: boolean;
}

export interface OptimizationResult {
  original: string;
  optimized: string;
  category: Category;
  mode: OptimizationMode;
  improvements: string[];
  timestamp: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

export interface ClientProfile {
  id: string;
  name: string;
  audience: string;
  offer: string;
  tone: string;
  constraints: string;
}
export type WorkflowKind = "proposal" | "advertising" | "reply";
