import express from "express";
import path from "path";
import dotenv from "dotenv";
import { Type } from "@google/genai";
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

async function getGeminiClient() {
  return {
    models: {
      generateContent: async (params: {
        model: string;
        contents: any;
        config?: any;
      }) => {
        const apiKey =
          process.env.GEMINI_API_KEY ||
          "AQ.Ab8RN6I3-2mRXPRkuhGNhldpHSzQVP7TggaiO1MxdQZqSBA4Ig";

        let payloadContents = params.contents;
        if (params.config?.systemInstruction) {
          payloadContents = [
            {
              role: "user",
              parts: [
                {
                  text: `[System Instruction]\n${params.config.systemInstruction}`,
                },
              ],
            },
            ...params.contents,
          ];
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              contents: payloadContents,
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Gemini API error (${response.status}): ${errorText}`,
          );
        }

        const data = await response.json();
        return {
          text: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
        };
      },
    },
  };
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

    const ai = await getGeminiClient();

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
      },
    });

    const jsonText = geminiResponse.text?.trim() || "{}";
    let parsedResult;
    try {
      const cleanJson = jsonText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "");
      parsedResult = JSON.parse(cleanJson);
      if (parsedResult.recipe) {
        const title = parsedResult.recipe.title || "Delicious Meal";
        const cleanTitle =
          title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "food dish";
        const promptTitle = encodeURIComponent(
          `photo of delicious ${cleanTitle}, gourmet food photography, restaurant presentation`,
        );
        parsedResult.recipe.imageUrl = `[https://image.pollinations.ai/prompt/$](https://image.pollinations.ai/prompt/$){promptTitle}?width=800&height=600&nologo=true`;
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
    const imageUrl = `[https://image.pollinations.ai/prompt/$](https://image.pollinations.ai/prompt/$){promptTitle}?width=800&height=600&nologo=true&seed=${seed}`;

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
    const ai = await getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Calculate exact per-serving macro and micro nutritional breakdown for the following ingredient list:\n${ingredientsText}\n\nRespond ONLY with JSON schema:\n{\n  "calories": number,\n  "protein": number,\n  "carbs": number,\n  "fats": number,\n  "fiber": number,\n  "sodium": number,\n  "sugar": number\}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const cleanJson = (response.text || "{}")
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "");
    const parsed = JSON.parse(cleanJson);
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

    app.use(express.static(distPath, { index: false }));

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

        console.log(
          "[Server Debug] Injecting API Key:",
          process.env.VITE_FIREBASE_API_KEY ? "Present" : "MISSING",
        );

        html = html
          .replace(
            /%VITE_FIREBASE_API_KEY%/g,
            process.env.VITE_FIREBASE_API_KEY ||
              "AIzaSyAO3xx6mnITcD9h6GDk7qhzpQMvSiswSVk",
          )
          .replace(
            /%VITE_FIREBASE_AUTH_DOMAIN%/g,
            process.env.VITE_FIREBASE_AUTH_DOMAIN ||
              "pantry-pal-66ed8.firebaseapp.com",
          )
          .replace(
            /%VITE_FIREBASE_PROJECT_ID%/g,
            process.env.VITE_FIREBASE_PROJECT_ID || "pantry-pal-66ed8",
          )
          .replace(
            /%VITE_FIREBASE_STORAGE_BUCKET%/g,
            process.env.VITE_FIREBASE_STORAGE_BUCKET ||
              "pantry-pal-66ed8.firebasestorage.app",
          )
          .replace(
            /%VITE_FIREBASE_MESSAGING_SENDER_ID%/g,
            process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "557285061653",
          )
          .replace(
            /%VITE_FIREBASE_APP_ID%/g,
            process.env.VITE_FIREBASE_APP_ID ||
              "1:557285061653:web:d777e9405d61032bab8a1c",
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
