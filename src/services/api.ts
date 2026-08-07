import { UserProfile, AdHocOverride, ChatMessage, Recipe, NutritionMacros } from '../types';
import { getFoodPhotoFallback } from '../lib/foodPhotos';

export interface ChatRequestPayload {
  prompt: string;
  history: ChatMessage[];
  globalProfile: UserProfile;
  adHocOverride?: AdHocOverride;
}

export interface ChatApiResponse {
  success: boolean;
  data?: {
    message: string;
    recipe?: Partial<Recipe>;
    suggestedFollowUps?: string[];
  };
  error?: string;
}

export async function sendRecipeChatMessage(payload: ChatRequestPayload): Promise<ChatApiResponse> {
  try {
    const res = await fetch('/api/chat/recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: payload.prompt,
        history: payload.history.map(m => ({
          role: m.role,
          content: m.content
        })),
        globalProfile: payload.globalProfile,
        adHocOverride: payload.adHocOverride
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Server responded with status ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error('sendRecipeChatMessage error:', error);
    return {
      success: false,
      error: error.message || 'Network error communicating with PantryPal Chef'
    };
  }
}

export async function generateRecipeImage(title: string, description?: string): Promise<string> {
  try {
    const res = await fetch('/api/recipe/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    const data = await res.json();
    return data.imageUrl || getFoodPhotoFallback(title, description);
  } catch (err) {
    console.error('generateRecipeImage error:', err);
    return getFoodPhotoFallback(title, description);
  }
}

export async function parseMacrosFromText(ingredientsText: string): Promise<NutritionMacros | null> {
  try {
    const res = await fetch('/api/recipe/parse-macro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredientsText })
    });
    const data = await res.json();
    return data.nutritionMacros || null;
  } catch (err) {
    console.error('parseMacrosFromText error:', err);
    return null;
  }
}
