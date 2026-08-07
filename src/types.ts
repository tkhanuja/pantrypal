export type MeasurementUnit = 'metric' | 'imperial' | 'grams_only';

export type MealPrepStyle = 
  | 'quick_under_20' 
  | 'weekly_batch' 
  | 'budget_friendly' 
  | 'gourmet' 
  | 'high_macro_density'
  | 'balanced';

export interface MacroTargets {
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fats: number;    // grams
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatarUrl: string;
  globalSystemPrompt: string;
  dietaryRestrictions: string[];
  allergies: string[];
  measurementUnit: MeasurementUnit;
  preferredCuisines: string[];
  appliances?: string[];
  mealPrepStyle: MealPrepStyle;
  macroTargets: MacroTargets;
}

export interface AdHocOverride {
  active: boolean;
  scenario: string;
  guestCount: number;
  cookingTimeLimit: number; // minutes
  equipmentConstraints: string[];
  customNotes: string;
}

export interface NutritionMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sodium: number;
  sugar: number;
}

export interface Ingredient {
  item: string;
  amount: number;
  unit: string;
  notes?: string;
  category?: 'Produce' | 'Meat & Seafood' | 'Dairy & Eggs' | 'Pantry & Spices' | 'Baking' | 'Other';
}

export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  dietaryTags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  nutritionMacros: NutritionMacros;
  imageUrl: string;
  createdAt: string;
  chefTips?: string[];
  matchingPantryIngredients?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  generatedRecipe?: Recipe;
  suggestedFollowUps?: string[];
  isThinking?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
  recipeId?: string;
  adHocOverride?: AdHocOverride;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: string;
  category: 'Produce' | 'Meat & Seafood' | 'Dairy & Eggs' | 'Pantry & Spices' | 'Baking' | 'Other';
  expiryDays?: number;
}

export interface MealPlanEntry {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  recipe: Recipe;
}
