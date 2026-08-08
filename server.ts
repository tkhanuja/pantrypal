import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { getFoodPhotoFallback as getFoodPhotoFallbackLib } from './src/lib/foodPhotos';
import fs from "fs";
dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 8080;




app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini client to prevent crash if key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set in Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PantryPal Express API', geminiKeyConfigured: !!process.env.GEMINI_API_KEY });
});

// 2. Chat & Recipe Engineering Endpoint
app.post('/api/chat/recipe', async (req, res) => {
  try {
    const { prompt, history = [], globalProfile, adHocOverride } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();

    // Construct system instructions based on global profile & ad-hoc overrides
    let systemInstruction = `You are PantryPal, an expert AI master chef, culinary scientist, and precision nutritionist.
Your goal is to engineer personalized recipes and engage in interactive culinary dialogue.

USER GLOBAL SYSTEM PROMPT & PREFERENCES:
- User Custom Instructions: ${globalProfile?.globalSystemPrompt || 'High quality macro-balanced meal prep'}
- Dietary Restrictions: ${(globalProfile?.dietaryRestrictions || []).join(', ') || 'None'}
- Allergies / Exclusions: ${(globalProfile?.allergies || []).join(', ') || 'None'}
- Preferred Measurement Units: ${globalProfile?.measurementUnit || 'metric'} (ALWAYS output ingredient measurements in this unit system)
- Preferred Cuisines: ${(globalProfile?.preferredCuisines || []).join(', ') || 'Any'}
- Available Kitchen Appliances / Equipment: ${(globalProfile?.appliances || []).join(', ') || 'Standard Kitchen (Oven, Stove)'}
- Meal Prep Style: ${globalProfile?.mealPrepStyle || 'high_macro_density'}
- Target Macros Goal: Calories ${globalProfile?.macroTargets?.calories || 2000} kcal, Protein ${globalProfile?.macroTargets?.protein || 140}g, Carbs ${globalProfile?.macroTargets?.carbs || 180}g, Fats ${globalProfile?.macroTargets?.fats || 65}g
`;

    if (adHocOverride && adHocOverride.active) {
      systemInstruction += `\n*** ACTIVE AD-HOC SCENARIO OVERRIDE ***
Note: The user has applied a temporary scenario override for this session. Override global settings as specified:
- Scenario Name: ${adHocOverride.scenario}
- Target Guest / Portion Count: ${adHocOverride.guestCount} servings
- Maximum Cook Time: ${adHocOverride.cookingTimeLimit} minutes
- Equipment Constraints: ${(adHocOverride.equipmentConstraints || []).join(', ') || 'Standard kitchen equipment'}
- Special Scenario Notes: ${adHocOverride.customNotes || 'N/A'}
`;
    }

    systemInstruction += `\nRESPONSE STRUCTURE MANDATE:
You MUST respond with a single JSON object containing:
1. "message": A warm, encouraging chef dialogue explaining the dish, culinary choices, flavor pairing logic, and macro benefits.
2. "recipe": (Optional, but mandatory whenever a recipe is requested or refined) A detailed recipe object with:
   - "title": string
   - "description": string (enticing description)
   - "prepTime": number (minutes)
   - "cookTime": number (minutes)
   - "servings": number (matches guest count / user request)
   - "difficulty": "Easy" | "Medium" | "Advanced"
   - "dietaryTags": array of strings (e.g., ["High-Protein", "Keto", "Gluten-Free"])
   - "ingredients": array of objects { "item": string, "amount": number, "unit": string, "category": "Produce"|"Meat & Seafood"|"Dairy & Eggs"|"Pantry & Spices"|"Baking"|"Other", "notes": string }
   - "instructions": array of step-by-step strings
   - "nutritionMacros": object { "calories": number, "protein": number, "carbs": number, "fats": number, "fiber": number, "sodium": number, "sugar": number } (Must be accurate estimated numbers per serving!)
   - "chefTips": array of 2-3 culinary tips or substitution hacks
3. "suggestedFollowUps": array of 3 short, actionable refinement prompts the user can click next (e.g., ["Make it under 15 minutes", "Increase protein to 50g", "Make it dairy-free"]).
`;

    // Construct full contents conversation history
    const contents: any[] = [];
    
    // Append previous dialogue
    for (const msg of history) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
      });
    }

    // Append latest prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recipe: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                prepTime: { type: Type.NUMBER },
                cookTime: { type: Type.NUMBER },
                servings: { type: Type.NUMBER },
                difficulty: { type: Type.STRING },
                dietaryTags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      item: { type: Type.STRING },
                      amount: { type: Type.NUMBER },
                      unit: { type: Type.STRING },
                      category: { type: Type.STRING },
                      notes: { type: Type.STRING }
                    },
                    required: ['item', 'amount', 'unit']
                  }
                },
                instructions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                nutritionMacros: {
                  type: Type.OBJECT,
                  properties: {
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fats: { type: Type.NUMBER },
                    fiber: { type: Type.NUMBER },
                    sodium: { type: Type.NUMBER },
                    sugar: { type: Type.NUMBER }
                  },
                  required: ['calories', 'protein', 'carbs', 'fats', 'fiber']
                },
                chefTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['title', 'description', 'prepTime', 'cookTime', 'servings', 'ingredients', 'instructions', 'nutritionMacros']
            }
          },
          required: ['message']
        }
      }
    });

    const jsonText = geminiResponse.text?.trim() || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonText);
      if (parsedResult.recipe) {
        const title = parsedResult.recipe.title || 'Delicious Meal';
        const description = parsedResult.recipe.description || '';
        const cleanTitle = title.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'food dish';
        const promptTitle = encodeURIComponent(`photo of delicious ${cleanTitle}, gourmet food photography, restaurant presentation`);
        // Generate an image URL dynamically based on the recipe title
        parsedResult.recipe.imageUrl = `https://image.pollinations.ai/prompt/${promptTitle}?width=800&height=600&nologo=true`;
      }
    } catch (e) {
      console.error('Failed to parse Gemini JSON output:', jsonText);
      parsedResult = {
        message: geminiResponse.text || "Here is a recipe tailored to your request.",
        suggestedFollowUps: ["Make it under 20 minutes", "Increase protein", "Make it low carb"]
      };
    }

    return res.json({ success: true, data: parsedResult });
  } catch (error: any) {
    console.error('API /api/chat/recipe error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate recipe response',
    });
  }
});

function getFoodPhotoFallback(title: string, description?: string): string {
  return getFoodPhotoFallbackLib(title, description);
}

function _unused_old_getFoodPhotoFallback(title: string, description?: string) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  // 1. Banana Bread / Sweet Loaves / Specialty Breads (Highest Priority)
  if (
    text.includes('banana bread') ||
    text.includes('banana loaf') ||
    text.includes('zucchini bread') ||
    text.includes('pumpkin bread') ||
    text.includes('nut bread') ||
    text.includes('apple bread') ||
    (text.includes('banana') && text.includes('bread'))
  ) {
    return 'https://images.unsplash.com/photo-1606851094655-b2593a9af63f?auto=format&fit=crop&w=800&q=80';
  }

  // 2. French Toast / Avocado Toast / Toast / Sourdough / Bagel
  if (text.includes('french toast')) {
    return 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('avocado toast')) {
    return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80';
  }
  if (
    text.includes('bread') ||
    text.includes('loaf') ||
    text.includes('toast') ||
    text.includes('sourdough') ||
    text.includes('bagel') ||
    text.includes('brioche') ||
    text.includes('garlic bread') ||
    text.includes('flatbread')
  ) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80';
  }

  // 3. Muffins, Scones, Croissants & Bakery Pastries
  if (
    text.includes('muffin') ||
    text.includes('scone') ||
    text.includes('croissant') ||
    text.includes('pastry') ||
    text.includes('danish')
  ) {
    return 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=800&q=80';
  }

  // 4. Pancakes, Waffles & Crepes
  if (
    text.includes('pancake') ||
    text.includes('waffle') ||
    text.includes('crepe') ||
    text.includes('crêpe')
  ) {
    return 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80';
  }

  // 5. Cakes, Pies, Cookies, Brownies & Desserts
  if (
    text.includes('brownie') ||
    text.includes('cookie') ||
    text.includes('chocolate cake')
  ) {
    return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80';
  }
  if (
    text.includes('cheesecake') ||
    text.includes('cupcake') ||
    text.includes('cake') ||
    text.includes('pie') ||
    text.includes('tart') ||
    text.includes('tiramisu') ||
    text.includes('dessert') ||
    text.includes('ice cream') ||
    text.includes('pudding')
  ) {
    return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80';
  }

  // 6. Oatmeal, Porridge, Granola & Breakfast Bowls
  if (
    text.includes('oatmeal') ||
    text.includes('porridge') ||
    text.includes('granola') ||
    text.includes('parfait') ||
    text.includes('chia') ||
    text.includes('overnight oats')
  ) {
    return 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=800&q=80';
  }

  // 7. Eggs, Omelets, Frittatas & Quiches
  if (
    text.includes('omelet') ||
    text.includes('omelette') ||
    text.includes('frittata') ||
    text.includes('quiche') ||
    text.includes('benedict') ||
    text.includes('scrambled egg') ||
    text.includes('egg')
  ) {
    return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80';
  }

  // 8. Pizza & Flatbreads
  if (
    text.includes('pizza') ||
    text.includes('margherita') ||
    text.includes('pepperoni') ||
    text.includes('calzone')
  ) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80';
  }

  // 9. Burgers & Sliders
  if (text.includes('burger') || text.includes('slider') || text.includes('cheeseburger')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
  }

  // 10. Sandwiches, Wraps & Paninis
  if (
    text.includes('sandwich') ||
    text.includes('wrap') ||
    text.includes('panini') ||
    text.includes('sub') ||
    text.includes('club sandwich')
  ) {
    return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80';
  }

  // 11. Tacos, Burritos, Quesadillas, Enchiladas & Mexican
  if (
    text.includes('taco') ||
    text.includes('burrito') ||
    text.includes('quesadilla') ||
    text.includes('fajita') ||
    text.includes('enchilada') ||
    text.includes('mexican') ||
    text.includes('nacho') ||
    text.includes('empanada')
  ) {
    return 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80';
  }

  // 12. Lasagna & Italian Pasta
  if (text.includes('lasagna')) {
    return 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('ramen') || text.includes('udon') || text.includes('pho')) {
    return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80';
  }
  if (
    text.includes('pasta') ||
    text.includes('spaghetti') ||
    text.includes('penne') ||
    text.includes('noodle') ||
    text.includes('carbonara') ||
    text.includes('macaroni') ||
    text.includes('fettuccine') ||
    text.includes('pad thai') ||
    text.includes('gnocchi') ||
    text.includes('ravioli')
  ) {
    return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281273?auto=format&fit=crop&w=800&q=80';
  }

  // 13. Curries, Tikka Masala & Stews
  if (
    text.includes('curry') ||
    text.includes('tikka') ||
    text.includes('masala') ||
    text.includes('dal') ||
    text.includes('korma') ||
    text.includes('butter chicken')
  ) {
    return 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80';
  }

  // 14. Salads & Greens
  if (
    text.includes('salad') ||
    text.includes('greens') ||
    text.includes('caesar') ||
    text.includes('kale') ||
    text.includes('slaw') ||
    text.includes('spinach') ||
    text.includes('cobb')
  ) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80';
  }

  // 15. Steak, Beef, Pork & Lamb
  if (
    text.includes('steak') ||
    text.includes('ribeye') ||
    text.includes('sirloin') ||
    text.includes('beef') ||
    text.includes('meatball') ||
    text.includes('brisket') ||
    text.includes('ribs') ||
    text.includes('pork') ||
    text.includes('lamb')
  ) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
  }

  // 16. Chicken & Wings
  if (text.includes('wings') || text.includes('buffalo wings')) {
    return 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80';
  }
  if (
    text.includes('chicken') ||
    text.includes('poultry') ||
    text.includes('turkey') ||
    text.includes('roast chicken') ||
    text.includes('thigh') ||
    text.includes('breast')
  ) {
    return 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80';
  }

  // 17. Salmon, Fish, Shrimp & Seafood
  if (
    text.includes('sushi') ||
    text.includes('sashimi') ||
    text.includes('poke') ||
    text.includes('poké')
  ) {
    return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80';
  }
  if (
    text.includes('salmon') ||
    text.includes('fish') ||
    text.includes('seafood') ||
    text.includes('shrimp') ||
    text.includes('prawn') ||
    text.includes('tuna') ||
    text.includes('cod') ||
    text.includes('trout') ||
    text.includes('crab') ||
    text.includes('lobster')
  ) {
    return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80';
  }

  // 18. Soups, Broth, Chowder & Chili
  if (
    text.includes('soup') ||
    text.includes('broth') ||
    text.includes('chowder') ||
    text.includes('bisque') ||
    text.includes('chili') ||
    text.includes('stew')
  ) {
    return 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80';
  }

  // 19. Smoothies, Shakes & Juices
  if (
    text.includes('smoothie') ||
    text.includes('juice') ||
    text.includes('shake') ||
    text.includes('acai')
  ) {
    return 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80';
  }

  // 20. Explicit Grain / Buddha / Quinoa Bowls
  if (
    text.includes('buddha bowl') ||
    text.includes('grain bowl') ||
    text.includes('quinoa bowl') ||
    text.includes('rice bowl') ||
    text.includes('poke bowl')
  ) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
  }

  // 21. Stir-fry & Skillet
  if (text.includes('stir fry') || text.includes('stir-fry') || text.includes('teriyaki')) {
    return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80';
  }

  // 22. Dynamic Fallback per Title
  const cleanTitle = (title || 'delicious food').replace(/[^a-zA-Z0-9 ]/g, '');
  return `https://image.pollinations.ai/prompt/${encodeURIComponent('photo of delicious cooked ' + cleanTitle + ' food dish, restaurant style presentation')}?width=800&height=600&nologo=true`;
}

// 3. Image Generation for Saved Recipe
app.post('/api/recipe/generate-image', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const cleanTitle = (title || 'delicious food').replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'food dish';
    const seed = Math.floor(Math.random() * 100000);
    const promptTitle = encodeURIComponent(`photo of delicious ${cleanTitle}, gourmet food photography, restaurant presentation`);
    const imageUrl = `https://image.pollinations.ai/prompt/${promptTitle}?width=800&height=600&nologo=true&seed=${seed}`;

    return res.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error('API /api/recipe/generate-image error:', error);
    return res.json({
      success: true,
      imageUrl: getFoodPhotoFallback(req.body?.title || '', req.body?.description || '')
    });
  }
});

// 4. Macro Calculation Endpoint
app.post('/api/recipe/parse-macro', async (req, res) => {
  try {
    const { ingredientsText } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Calculate exact per-serving macro and micro nutritional breakdown for the following ingredient list:
${ingredientsText}

Respond ONLY with JSON schema:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "fiber": number,
  "sodium": number,
  "sugar": number
}`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, nutritionMacros: parsed });
  } catch (error: any) {
    console.error('API /api/recipe/parse-macro error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Vite Middleware for development / Static file serving for production
// Vite Middleware for development / Static file serving for production
async function setupApp() {
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(path.join(process.cwd(), 'dist/index.html'));

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true, 
        allowedHosts: [
          "pantry-pal-204324115968.us-west1.run.app",
          ".run.app",
        ],
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`[PantryPal Server] Serving production static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[PantryPal Server] Server running on http://0.0.0.0:${port}`);
  });
}

setupApp().catch((err) => {
  console.error("Failed to start server:", err);
});