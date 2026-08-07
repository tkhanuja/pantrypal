import { UserProfile, Recipe, PantryItem, MealPlanEntry, AdHocOverride } from '../types';

export const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'profile-balanced',
    name: 'Balanced',
    avatarUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=200&q=80',
    globalSystemPrompt: 'A balanced, wholesome diet with no specific restrictions. Focus on fresh ingredients, well-rounded macros, and clean, delicious home cooking.',
    dietaryRestrictions: [],
    allergies: [],
    measurementUnit: 'metric',
    preferredCuisines: ['Mediterranean', 'American', 'Asian', 'Italian'],
    appliances: ['Oven', 'Stove', 'Air Fryer', 'Microwave', 'Blender'],
    mealPrepStyle: 'balanced',
    macroTargets: {
      calories: 2000,
      protein: 100,
      carbs: 225,
      fats: 65,
    },
  },
  {
    id: 'profile-high-protein',
    name: 'High Protein',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    globalSystemPrompt: 'Focus on high-protein, lean meats, poultry, fish, legumes, and high-protein dairy or plant-based protein. Keep prep clean and nutrient-dense with generous protein targets.',
    dietaryRestrictions: ['High-Protein'],
    allergies: [],
    measurementUnit: 'metric',
    preferredCuisines: ['Mediterranean', 'Japanese', 'Asian'],
    mealPrepStyle: 'high_macro_density',
    macroTargets: {
      calories: 2200,
      protein: 160,
      carbs: 180,
      fats: 70,
    },
  },
  {
    id: 'profile-vegetarian',
    name: 'Vegetarian',
    avatarUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80',
    globalSystemPrompt: 'Strictly lacto-ovo vegetarian recipes with zero meat, poultry, or seafood. Focus on legumes, eggs, dairy, tofu, grains, and colorful vegetables.',
    dietaryRestrictions: ['Vegetarian'],
    allergies: [],
    measurementUnit: 'metric',
    preferredCuisines: ['Indian', 'Italian', 'Mexican'],
    mealPrepStyle: 'balanced',
    macroTargets: {
      calories: 2000,
      protein: 90,
      carbs: 230,
      fats: 65,
    },
  },
  {
    id: 'profile-vegan',
    name: 'Vegan',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    globalSystemPrompt: '100% plant-based vegan recipes with no meat, seafood, dairy, eggs, or animal products. Focus on whole grains, legumes, tempeh, seeds, and rich plant flavor.',
    dietaryRestrictions: ['Vegan', 'Plant-Based'],
    allergies: [],
    measurementUnit: 'metric',
    preferredCuisines: ['Thai', 'Indian', 'Mediterranean'],
    mealPrepStyle: 'budget_friendly',
    macroTargets: {
      calories: 2000,
      protein: 85,
      carbs: 250,
      fats: 60,
    },
  },
  {
    id: 'profile-keto',
    name: 'Keto',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    globalSystemPrompt: 'Strict Ketogenic guidelines: keep net carbs low (<20g per meal). Prioritize healthy oils, avocados, wild seafood, meats, cheeses, and leafy greens.',
    dietaryRestrictions: ['Keto', 'Low-Carb'],
    allergies: [],
    measurementUnit: 'imperial',
    preferredCuisines: ['Mexican', 'Italian', 'American'],
    mealPrepStyle: 'weekly_batch',
    macroTargets: {
      calories: 1800,
      protein: 110,
      carbs: 25,
      fats: 135,
    },
  },
  {
    id: 'profile-dash',
    name: 'DASH',
    avatarUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=200&q=80',
    globalSystemPrompt: 'DASH (Dietary Approaches to Stop Hypertension) diet: focus on low-sodium, heart-healthy meals rich in potassium, calcium, magnesium, whole grains, and lean proteins.',
    dietaryRestrictions: ['DASH', 'Low-Sodium', 'Heart-Healthy'],
    allergies: [],
    measurementUnit: 'metric',
    preferredCuisines: ['Mediterranean', 'American'],
    mealPrepStyle: 'balanced',
    macroTargets: {
      calories: 1900,
      protein: 100,
      carbs: 210,
      fats: 55,
    },
  },
];

export const INITIAL_AD_HOC_OVERRIDE: AdHocOverride = {
  active: false,
  scenario: 'Dinner Party',
  guestCount: 4,
  cookingTimeLimit: 30,
  equipmentConstraints: [],
  customNotes: '',
};

export const INITIAL_SAVED_RECIPES: Recipe[] = [];

export const INITIAL_PANTRY_ITEMS: PantryItem[] = [];

export const INITIAL_MEAL_PLAN: MealPlanEntry[] = [];

