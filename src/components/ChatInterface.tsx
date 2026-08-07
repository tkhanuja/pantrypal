import React from 'react';
import { ChatMessage, UserProfile, AdHocOverride, Recipe } from '../types';
import { sendRecipeChatMessage } from '../services/api';
import { RecipeCardView } from './RecipeCardView';
import { getFoodPhotoFallback } from '../lib/foodPhotos';
import { DEFAULT_PROFILES } from '../data/initialData';
import { Sparkles, Send, SlidersHorizontal, Loader2, Bot, User, RefreshCw, ChefHat, AlertCircle } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface Props {
  userProfile: UserProfile;
  adHocOverride: AdHocOverride;
  onOpenAdHocModal: () => void;
  onSaveRecipe: (recipe: Recipe) => void;
  savedRecipes: Recipe[];
  onAddToMealPlan: (recipe: Recipe) => void;
  onScheduleRecipe?: (recipe: Recipe, selectedDays: string[], mealType: string) => void;
  authUser?: FirebaseUser | null;
  onOpenAuthModal?: () => void;
}

const STARTER_PROMPTS = [
  '⚡ High-protein dinner under 500 kcal with under 20 mins cook time',
  '🥑 Craft a meal using Avocados, Wild Salmon, and Broccolini',
  '🌱 Plant-based gourmet meal prep with high fiber and low sodium',
  '🍳 Quick Keto breakfast egg skillet under 10g net carbs',
];

export const ChatInterface: React.FC<Props> = ({
  userProfile,
  adHocOverride,
  onOpenAdHocModal,
  onSaveRecipe,
  savedRecipes,
  onAddToMealPlan,
  onScheduleRecipe,
  authUser,
  onOpenAuthModal,
}) => {
  const getActivePrompt = () => {
    const isUserAccountName = authUser && (
      userProfile.name === authUser.displayName ||
      userProfile.name === authUser.email?.split('@')[0] ||
      userProfile.name === 'My Account' ||
      userProfile.name === authUser.email
    );

    if (isUserAccountName || !userProfile.name) {
      return DEFAULT_PROFILES[0];
    }
    return userProfile;
  };

  const getInitialWelcomeText = () => {
    if (authUser) {
      const activePrompt = getActivePrompt();
      const userName = authUser.displayName || authUser.email?.split('@')[0] || 'there';
      const promptSummary = activePrompt.globalSystemPrompt || (activePrompt.dietaryRestrictions.length > 0 ? activePrompt.dietaryRestrictions.join(', ') : 'no specific dietary restrictions');
      return `Hello ${userName}! Currently using the "${activePrompt.name}" system prompt (${promptSummary}). What would you like to cook today?`;
    }
    return `Hello! What would you like to cook today?`;
  };

  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: getInitialWelcomeText(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowUps: [
        'Suggest a 20-min dinner based on my macros',
        'What can I cook with ingredients in my fridge?',
        'High-protein meal prep for the week'
      ]
    }
  ]);

  React.useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-1') {
        return [
          {
            ...prev[0],
            content: getInitialWelcomeText(),
          }
        ];
      }
      return prev;
    });
  }, [authUser, userProfile.name]);

  const [inputPrompt, setInputPrompt] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendPrompt = async (textToSend?: string) => {
    const promptText = textToSend || inputPrompt;
    if (!promptText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    // Call API
    const response = await sendRecipeChatMessage({
      prompt: promptText,
      history: newMessages,
      globalProfile: userProfile,
      adHocOverride,
    });

    setIsLoading(false);

    if (response.success && response.data) {
      const { message, recipe, suggestedFollowUps } = response.data;
      
      let generatedRecipe: Recipe | undefined = undefined;
      if (recipe && recipe.title) {
        generatedRecipe = {
          id: `rec-${Date.now()}`,
          userId: userProfile.id,
          title: recipe.title || 'Custom PantryPal Creation',
          description: recipe.description || 'Custom generated recipe',
          prepTime: recipe.prepTime || 15,
          cookTime: recipe.cookTime || 20,
          servings: recipe.servings || (adHocOverride.active ? adHocOverride.guestCount : 2),
          difficulty: recipe.difficulty || 'Easy',
          dietaryTags: recipe.dietaryTags || userProfile.dietaryRestrictions,
          ingredients: recipe.ingredients || [],
          instructions: recipe.instructions || [],
          nutritionMacros: recipe.nutritionMacros || {
            calories: 500,
            protein: 40,
            carbs: 45,
            fats: 18,
            fiber: 6,
            sodium: 400,
            sugar: 3
          },
          imageUrl: recipe.imageUrl || getFoodPhotoFallback(recipe.title, recipe.description),
          createdAt: new Date().toISOString(),
          chefTips: recipe.chefTips || [],
        };
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generatedRecipe,
        suggestedFollowUps,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } else {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an issue generating your recipe: ${response.error || 'Server connection error'}. Please try again or rephrase your request.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] max-w-5xl mx-auto px-4 py-4">
      {/* Top Banner: Ad-Hoc Override Context Indicator */}
      <div className="mb-3 bg-[#5A5A40] text-white rounded-2xl p-3.5 px-4 shadow-sm flex items-center justify-between border border-[#5A5A40]/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/15 rounded-xl text-amber-200">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">Active System Prompt Context</span>
              {adHocOverride.active && (
                <span className="px-2 py-0.5 bg-[#D47A5F] text-white text-[10px] font-bold rounded-full shadow-2xs">
                  Ad-Hoc Scenario Enabled
                </span>
              )}
            </div>
            <p className="text-xs text-[#E8E6DC] font-medium">
              Profile: <span className="text-white font-bold">{userProfile.name}</span> | Limits: {userProfile.dietaryRestrictions.join(', ') || 'Standard'} | Unit: {userProfile.measurementUnit}
              {adHocOverride.active && ` | Override: "${adHocOverride.scenario}" (${adHocOverride.guestCount} guests, <${adHocOverride.cookingTimeLimit}m)`}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAdHocModal}
          className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center gap-1.5"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-200" />
          {adHocOverride.active ? 'Edit Scenario' : 'Inject Scenario'}
        </button>
      </div>

      {/* Chat Thread Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scroll-smooth">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-[#5A5A40] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div className={`max-w-[90%] sm:max-w-[80%] space-y-2`}>
                <div
                  className={`p-4 shadow-2xs text-sm leading-relaxed ${
                    isUser
                      ? 'chat-bubble-user'
                      : 'chat-bubble-ai text-[#1C1C1C]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <span className={`text-[10px] mt-1.5 block font-medium ${isUser ? 'text-[#E8E6DC] text-right' : 'text-[#88886C]'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* Render Interactive Generated Recipe Card */}
                {msg.generatedRecipe && (
                  <RecipeCardView
                    recipe={msg.generatedRecipe}
                    userProfile={userProfile}
                    isSaved={savedRecipes.some(r => r.title === msg.generatedRecipe?.title)}
                    onSave={onSaveRecipe}
                    onAddToMealPlan={onAddToMealPlan}
                    onScheduleRecipe={onScheduleRecipe}
                    onRefinePrompt={(text) => handleSendPrompt(text)}
                    authUser={authUser}
                    onOpenAuthModal={onOpenAuthModal}
                  />
                )}

                {/* Suggested Follow-up Chips */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedFollowUps.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendPrompt(chip)}
                        className="px-3.5 py-1 bg-white hover:bg-[#5A5A40] text-[#5A5A40] hover:text-white border border-[#5A5A40]/30 rounded-full text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3 text-[#D47A5F]" />
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#5A5A40]/30 shadow-2xs"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          );
        })}

        {/* Thinking / Loading Spinner */}
        {isLoading && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[#5A5A40] text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 animate-spin" />
            </div>
            <div className="p-4 bg-white border border-[#E5E3D8] rounded-2xl rounded-tl-xs shadow-xs text-xs font-semibold text-[#575752] flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#5A5A40] animate-spin" />
              PantryPal Chef is calculating macros & engineering recipe...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts Bar (when few messages) */}
      {messages.length <= 2 && (
        <div className="py-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#88886C] block mb-1.5">
            Suggested Prompts:
          </span>
          <div className="flex overflow-x-auto gap-2 no-scrollbar py-1">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(prompt)}
                className="px-3.5 py-1.5 bg-white hover:bg-[#F5F5F0] text-[#1C1C1C] border border-[#E5E3D8] rounded-xl text-xs font-semibold whitespace-nowrap shadow-2xs transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Input Footer */}
      <div className="mt-3 bg-white p-2 sm:p-3 rounded-2xl border border-[#E5E3D8] shadow-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="Ask PantryPal: e.g. 'Make a 30-min high protein dinner' or 'Substitute salmon for tofu'..."
            className="flex-1 px-4 py-2.5 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-xs sm:text-sm text-[#1C1C1C] placeholder-[#88886C] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
          />

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-2 ${
              inputPrompt.trim() && !isLoading
                ? 'bg-[#5A5A40] text-white hover:bg-[#42422F]'
                : 'bg-[#E8E6DC] text-[#88886C] cursor-not-allowed'
            }`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
