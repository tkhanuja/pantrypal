import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { getFoodPhotoFallback as getFoodPhotoFallbackLib } from "./src/lib/foodPhotos";
import fs from "fs";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 8080;

// Resolve distribution path safely
const possibleDistPaths = [
  path.join(process.cwd(), "dist"),
  path.join(__dirname, "dist"),
  path.join(__dirname, "../dist"),
];
const distPath =
  possibleDistPaths.find((p) => fs.existsSync(p)) ||
  path.join(process.cwd(), "dist");
const indexPath = path.join(distPath, "index.html");

app.use(express.json({ limit: "10mb" }));

// Lazy initializer for Gemini client to prevent crash if key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not set in Secrets.",
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "PantryPal Express API",
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// 2. Chat & Recipe Engineering Endpoint
app.post("/api/chat/recipe", async (req, res) => {
  try {
    const { prompt, history = [], globalProfile, adHocOverride } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGeminiClient();

    let systemInstruction = `You are PantryPal, an expert AI master chef, culinary scientist, and precision nutritionist.
Your goal is to engineer personalized recipes and engage in interactive culinary dialogue.

USER GLOBAL SYSTEM PROMPT & PREFERENCES:
- User Custom Instructions: ${globalProfile?.globalSystemPrompt || "High quality macro-balanced meal prep"}
- Dietary Restrictions: ${(globalProfile?.dietaryRestrictions || []).join(", ") || "None"}
- Allergies / Exclusions: ${(globalProfile?.allergies || []).join(", ") || "None"}
- Preferred Measurement Units: ${globalProfile?.measurementUnit || "metric"} (ALWAYS output ingredient measurements in this unit system)
- Preferred Cuisines: ${(globalProfile?.preferredCuisines || []).join(", ") || "Any"}
- Available Kitchen Appliances / Equipment: ${(globalProfile?.appliances || []).join(", ") || "Standard Kitchen (Oven, Stove)"}
- Meal Prep Style: ${globalProfile?.mealPrepStyle || "high_macro_density"}
- Target Macros Goal: Calories ${globalProfile?.macroTargets?.calories || 2000} kcal, Protein ${globalProfile?.macroTargets?.protein || 140}g, Carbs ${globalProfile?.macroTargets?.carbs || 180}g, Fats ${globalProfile?.macroTargets?.fats || 65}g
`;

    if (adHocOverride && adHocOverride.active) {
      systemInstruction += `\n*** ACTIVE AD-HOC SCENARIO OVERRIDE ***
Note: The user has applied a temporary scenario override for this session. Override global settings as specified:
- Scenario Name: ${adHocOverride.scenario}
- Target Guest / Portion Count: ${adHocOverride.guestCount} servings
- Maximum Cook Time: ${adHocOverride.cookingTimeLimit} minutes
- Equipment Constraints: ${(adHocOverride.equipmentConstraints || []).join(", ") || "Standard kitchen equipment"}
- Special Scenario Notes: ${adHocOverride.customNotes || "N/A"}
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
   - "nutritionMacros": object { "calories": number, "protein": number, "carbs": number, "fats": number, "fiber": number, "sodium": number, "sugar": number }
   - "chefTips": array of 2-3 culinary tips or substitution hacks
3. "suggestedFollowUps": array of 3 short, actionable refinement prompts.
`;

    const contents: any[] = [];
    for (const msg of history) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [
          {
            text:
              typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content),
          },
        ],
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
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
                  items: { type: Type.STRING },
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
                      notes: { type: Type.STRING },
                    },
                    required: ["item", "amount", "unit"],
                  },
                },
                instructions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
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
                    sugar: { type: Type.NUMBER },
                  },
                  required: ["calories", "protein", "carbs", "fats", "fiber"],
                },
                chefTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                "title",
                "description",
                "prepTime",
                "cookTime",
                "servings",
                "ingredients",
                "instructions",
                "nutritionMacros",
              ],
            },
          },
          required: ["message"],
        },
      },
    });

    const jsonText = geminiResponse.text?.trim() || "{}";
    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonText);
      if (parsedResult.recipe) {
        const title = parsedResult.recipe.title || "Delicious Meal";
        const cleanTitle =
          title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "food dish";
        const promptTitle = encodeURIComponent(
          `photo of delicious ${cleanTitle}, gourmet food photography, restaurant presentation`,
        );
        parsedResult.recipe.imageUrl = `https://image.pollinations.ai/prompt/${promptTitle}?width=800&height=600&nologo=true`;
      }
    } catch (e) {
      console.error("Failed to parse Gemini JSON output:", jsonText);
      parsedResult = {
        message:
          geminiResponse.text || "Here is a recipe tailored to your request.",
        suggestedFollowUps: [
          "Make it under 20 minutes",
          "Increase protein",
          "Make it low carb",
        ],
      };
    }

    return res.json({ success: true, data: parsedResult });
  } catch (error: any) {
    console.error("API /api/chat/recipe error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate recipe response",
    });
  }
});

function getFoodPhotoFallback(title: string, description?: string): string {
  return getFoodPhotoFallbackLib(title, description);
}

// 3. Image Generation for Saved Recipe
app.post("/api/recipe/generate-image", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const cleanTitle =
      (title || "delicious food").replace(/[^a-zA-Z0-9 ]/g, "").trim() ||
      "food dish";
    const seed = Math.floor(Math.random() * 100000);
    const promptTitle = encodeURIComponent(
      `photo of delicious ${cleanTitle}, gourmet food photography, restaurant presentation`,
    );
    const imageUrl = `https://image.pollinations.ai/prompt/${promptTitle}?width=800&height=600&nologo=true&seed=${seed}`;

    return res.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error("API /api/recipe/generate-image error:", error);
    return res.json({
      success: true,
      imageUrl: getFoodPhotoFallback(
        req.body?.title || "",
        req.body?.description || "",
      ),
    });
  }
});

// 4. Macro Calculation Endpoint
app.post("/api/recipe/parse-macro", async (req, res) => {
  try {
    const { ingredientsText } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
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
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json({ success: true, nutritionMacros: parsed });
  } catch (error: any) {
    console.error("API /api/recipe/parse-macro error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Setup Application (Vite Dev Middleware vs Production Static Serving)
async function setupApp() {
  const isProduction =
    process.env.NODE_ENV === "production" || fs.existsSync(indexPath);

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: ["pantry-pal-204324115968.us-west1.run.app", ".run.app"],
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(
      `[PantryPal Server] Serving production static files from: ${distPath}`,
    );

    // Serve static assets normally without auto-serving index.html
    app.use(express.static(distPath, { index: false }));

    // Intercept client-side routing to inject runtime environment variables securely
    app.get("*", (req, res) => {
      if (!fs.existsSync(indexPath)) {
        return res
          .status(500)
          .send(
            `Build error: index.html not found at expected path: ${indexPath}`,
          );
      }

      try {
        let html = fs.readFileSync(indexPath, "utf8");

        // Replace placeholders with runtime Cloud Run environment variables
        html = html
          .replace(
            /%VITE_FIREBASE_API_KEY%/g,
            process.env.VITE_FIREBASE_API_KEY || "",
          )
          .replace(
            /%VITE_FIREBASE_AUTH_DOMAIN%/g,
            process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
          )
          .replace(
            /%VITE_FIREBASE_PROJECT_ID%/g,
            process.env.VITE_FIREBASE_PROJECT_ID || "",
          )
          .replace(
            /%VITE_FIREBASE_STORAGE_BUCKET%/g,
            process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
          )
          .replace(
            /%VITE_FIREBASE_MESSAGING_SENDER_ID%/g,
            process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
          )
          .replace(
            /%VITE_FIREBASE_APP_ID%/g,
            process.env.VITE_FIREBASE_APP_ID || "",
          );

        res.setHeader("Content-Type", "text/html");
        res.send(html);
      } catch (err: any) {
        res.status(500).send(`Error reading index.html: ${err.message}`);
      }
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`[PantryPal Server] Server running on http://0.0.0.0:${port}`);
  });
}

setupApp().catch((err) => {
  console.error("Failed to start server:", err);
});
