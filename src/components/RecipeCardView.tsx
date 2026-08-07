import React from 'react';
import { Recipe, UserProfile, Ingredient } from '../types';
import { getFoodPhotoFallback } from '../lib/foodPhotos';
import { ScheduleModal } from './ScheduleModal';
import { Clock, Flame, Users, Heart, BookmarkCheck, CalendarPlus, Sparkles, Image as ImageIcon, CheckCircle, ChevronRight, Printer, Upload } from 'lucide-react';
import { User } from 'firebase/auth';

interface Props {
  recipe: Recipe;
  userProfile?: UserProfile;
  isSaved?: boolean;
  onSave?: (recipe: Recipe) => void;
  onAddToMealPlan?: (recipe: Recipe) => void;
  onScheduleRecipe?: (recipe: Recipe, selectedDays: string[], mealType: string) => void;
  onRefinePrompt?: (promptText: string) => void;
  authUser?: User | null;
  onOpenAuthModal?: () => void;
}

export const RecipeCardView: React.FC<Props> = ({
  recipe,
  userProfile,
  isSaved = false,
  onSave,
  onAddToMealPlan,
  onScheduleRecipe,
  onRefinePrompt,
  authUser,
  onOpenAuthModal,
}) => {
  const [servings, setServings] = React.useState<number>(recipe.servings || 2);
  const [completedSteps, setCompletedSteps] = React.useState<Record<number, boolean>>({});
  
  // Ensure every recipe card has a valid image representing the item presented
  const initialImg = recipe.imageUrl || getFoodPhotoFallback(recipe.title, recipe.description);
  const [imageUrl, setImageUrl] = React.useState<string>(initialImg);
  const [savedLocally, setSavedLocally] = React.useState<boolean>(isSaved);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState<boolean>(false);
  const [uploadSuccessToast, setUploadSuccessToast] = React.useState<boolean>(false);
  
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync image URL & fallback if recipe object updates
  React.useEffect(() => {
    const photo = getFoodPhotoFallback(recipe.title, recipe.description);
    if (!recipe.imageUrl || recipe.imageUrl.includes('photo-1546069901-ba9599a7e63c')) {
      setImageUrl(photo);
      recipe.imageUrl = photo;
    } else {
      setImageUrl(recipe.imageUrl);
    }
    setServings(recipe.servings || 2);
    setSavedLocally(isSaved);
  }, [recipe, isSaved]);

  const scaleFactor = servings / (recipe.servings || 1);

  const handleUploadClick = () => {
    if (!authUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

          setImageUrl(dataUrl);
          recipe.imageUrl = dataUrl;

          if (onSave) {
            onSave({ ...recipe, servings, imageUrl: dataUrl });
            setSavedLocally(true);
          }

          setUploadSuccessToast(true);
          setTimeout(() => setUploadSuccessToast(false), 4000);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleStep = (index: number) => {
    setCompletedSteps(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSaveClick = () => {
    if (!authUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    setSavedLocally(true);
    if (onSave) {
      onSave({ ...recipe, servings, imageUrl });
    }
  };

  const handleScheduleClick = () => {
    if (!authUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    setIsScheduleModalOpen(true);
  };

  const macros = recipe.nutritionMacros || {
    calories: 450,
    protein: 35,
    carbs: 40,
    fats: 15,
    fiber: 6,
    sodium: 400,
    sugar: 4
  };

  // Group ingredients by category
  const ingredientsByCategory = React.useMemo(() => {
    const groups: Record<string, Ingredient[]> = {};
    (recipe.ingredients || []).forEach(ing => {
      const cat = ing.category || 'Pantry & Spices';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ing);
    });
    return groups;
  }, [recipe.ingredients]);

  return (
    <div className="bg-white rounded-3xl border border-[#E5E3D8] shadow-sm overflow-hidden my-3 transition-all duration-300">
      {/* Recipe Header Banner */}
      <div className="relative h-64 sm:h-72 w-full bg-[#42422F] group">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              const fallback = getFoodPhotoFallback(recipe.title, recipe.description);
              if (target.src !== fallback) {
                target.src = fallback;
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-[#5A5A40] flex flex-col items-center justify-center p-6 text-center">
            <Sparkles className="w-12 h-12 text-amber-200 mb-2 animate-pulse" />
            <p className="serif-heading text-white font-bold text-xl">{recipe.title}</p>
            <button
              onClick={handleUploadClick}
              className="mt-3 px-4 py-2 bg-[#D47A5F] hover:bg-[#B55F46] text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition"
            >
              <Upload className="w-4 h-4 text-amber-200" />
              {authUser ? 'Upload Custom Recipe Photo' : 'Sign In to Upload Photo'}
            </button>
          </div>
        )}

        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/40 to-transparent" />

        {/* Success Toast Banner */}
        {uploadSuccessToast && (
          <div className="absolute top-16 left-4 right-4 z-10 bg-[#5A5A40] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg border border-amber-200/30 flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-amber-200" />
            <span>Custom photo uploaded & saved under your account!</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(recipe.dietaryTags || []).map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-white/90 backdrop-blur-md text-[#5A5A40] text-[11px] font-bold rounded-lg shadow-xs"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUploadClick}
              className="px-3 py-1.5 bg-[#1C1C1C]/80 backdrop-blur-md text-amber-200 hover:text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 border border-white/20 transition hover:scale-105"
              title={authUser ? "Upload a custom photo saved to your account" : "Sign in to upload a custom photo"}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{authUser ? 'Upload Photo' : 'Sign In to Upload Photo'}</span>
            </button>

            <button
              onClick={handleSaveClick}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 backdrop-blur-md transition ${
                savedLocally
                  ? 'bg-[#5A5A40] text-white ring-2 ring-amber-200/50'
                  : 'bg-white/90 text-[#1C1C1C] hover:bg-white'
              }`}
            >
              {savedLocally ? (
                <>
                  <BookmarkCheck className="w-4 h-4" /> Saved to Book
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 text-[#D47A5F] fill-[#D47A5F]" /> Save Recipe
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Title Info */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="serif-heading text-2xl sm:text-3xl font-bold tracking-tight drop-shadow-md">
            {recipe.title}
          </h3>
          <p className="text-xs sm:text-sm text-[#E8E6DC] line-clamp-2 mt-1 drop-shadow-sm font-sans">
            {recipe.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-medium text-amber-100 font-sans">
            <span className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
              <Clock className="w-3.5 h-3.5 text-amber-200" />
              Prep: {recipe.prepTime || 10}m | Cook: {recipe.cookTime || 15}m
            </span>
            <span className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
              <Flame className="w-3.5 h-3.5 text-[#D47A5F]" />
              {Math.round(macros.calories * scaleFactor)} kcal / serving
            </span>
            <span className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
              <Users className="w-3.5 h-3.5 text-amber-200" />
              {servings} Servings
            </span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Real-time Macro Nutritional Profile */}
        <div className="bg-[#FAF9F5] border border-[#E5E3D8] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#88886C]">
                Nutritional Breakdown (Per Serving)
              </h4>
              <p className="text-[11px] text-[#575752]">Scaled for {servings} servings</p>
            </div>
            {/* Servings Scaler */}
            <div className="flex items-center gap-2 bg-white border border-[#E5E3D8] rounded-xl px-2 py-1 shadow-2xs">
              <span className="text-xs font-semibold text-[#575752]">Servings:</span>
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="w-5 h-5 flex items-center justify-center rounded bg-[#F5F5F0] font-bold hover:bg-[#E8E6DC] text-[#1C1C1C]"
              >
                -
              </button>
              <span className="text-xs font-bold text-[#1C1C1C] px-1">{servings}</span>
              <button
                onClick={() => setServings(servings + 1)}
                className="w-5 h-5 flex items-center justify-center rounded bg-[#F5F5F0] font-bold hover:bg-[#E8E6DC] text-[#1C1C1C]"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-[#E5E3D8] text-center shadow-2xs">
              <span className="text-[10px] font-bold text-[#88886C] uppercase block">Calories</span>
              <span className="text-lg font-extrabold text-[#1C1C1C]">{Math.round(macros.calories)}</span>
              <span className="text-[10px] font-semibold text-[#D47A5F] block">kcal</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E5E3D8] text-center shadow-2xs">
              <span className="text-[10px] font-bold text-[#88886C] uppercase block">Protein</span>
              <span className="text-lg font-extrabold text-[#5A5A40]">{Math.round(macros.protein)}g</span>
              <span className="text-[10px] font-semibold text-[#575752] block">
                {userProfile?.macroTargets ? `${Math.round((macros.protein / userProfile.macroTargets.protein) * 100)}% of daily` : 'High protein'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E5E3D8] text-center shadow-2xs">
              <span className="text-[10px] font-bold text-[#88886C] uppercase block">Carbs</span>
              <span className="text-lg font-extrabold text-[#5A5A40]">{Math.round(macros.carbs)}g</span>
              <span className="text-[10px] font-semibold text-[#575752] block">Fiber: {Math.round(macros.fiber)}g</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E5E3D8] text-center shadow-2xs">
              <span className="text-[10px] font-bold text-[#88886C] uppercase block">Fats</span>
              <span className="text-lg font-extrabold text-[#D47A5F]">{Math.round(macros.fats)}g</span>
              <span className="text-[10px] font-semibold text-[#575752] block">Sodium: {Math.round(macros.sodium)}mg</span>
            </div>
          </div>
        </div>

        {/* Ingredients List */}
        <div>
          <h4 className="serif-heading text-lg font-bold text-[#1C1C1C] tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5A5A40]"></span>
            Ingredients ({recipe.ingredients?.length || 0})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.entries(ingredientsByCategory) as [string, Ingredient[]][]).map(([category, items]) => (
              <div key={category} className="bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#E5E3D8]">
                <span className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider block mb-2">
                  {category}
                </span>
                <ul className="space-y-1.5 text-xs text-[#1C1C1C]">
                  {items.map((ing, i) => {
                    const scaledAmount = Math.round((ing.amount * scaleFactor) * 10) / 10;
                    return (
                      <li key={i} className="flex items-start justify-between py-0.5 border-b border-[#E5E3D8]/50 last:border-0">
                        <span className="font-medium text-[#1C1C1C]">{ing.item}</span>
                        <span className="font-bold text-[#5A5A40] whitespace-nowrap ml-2">
                          {scaledAmount} {ing.unit} {ing.notes ? `(${ing.notes})` : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div>
          <h4 className="serif-heading text-lg font-bold text-[#1C1C1C] tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D47A5F]"></span>
            Cooking Instructions
          </h4>
          <div className="space-y-2.5">
            {(recipe.instructions || []).map((step, idx) => {
              const isChecked = !!completedSteps[idx];
              return (
                <div
                  key={idx}
                  onClick={() => handleToggleStep(idx)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    isChecked
                      ? 'bg-[#F5F5F0] border-[#E5E3D8] text-[#88886C] line-through'
                      : 'bg-white border-[#E5E3D8] hover:border-[#5A5A40] text-[#1C1C1C]'
                  }`}
                >
                  <button
                    type="button"
                    className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                      isChecked ? 'bg-[#5A5A40] text-white' : 'border border-[#E5E3D8] text-transparent hover:border-[#5A5A40]'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <div className="text-xs sm:text-sm font-medium leading-relaxed">
                    <span className="font-bold text-[#5A5A40] mr-1.5">Step {idx + 1}:</span>
                    {step}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chef Tips */}
        {recipe.chefTips && recipe.chefTips.length > 0 && (
          <div className="bg-[#FAF9F5] border border-[#D47A5F]/30 rounded-2xl p-4">
            <h5 className="text-xs font-bold text-[#B55F46] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D47A5F]" />
              PantryPal Chef Pro Tips
            </h5>
            <ul className="space-y-1.5 text-xs text-[#1C1C1C] font-medium">
              {recipe.chefTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#D47A5F] font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recipe Actions Footer */}
        <div className="pt-3 border-t border-[#E5E3D8] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveClick}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition ${
                savedLocally
                  ? 'bg-[#5A5A40] text-white'
                  : 'bg-[#F5F5F0] text-[#5A5A40] hover:bg-[#E8E6DC] border border-[#E5E3D8]'
              }`}
            >
              <Heart className={`w-4 h-4 ${savedLocally ? 'fill-white' : 'text-[#D47A5F]'}`} />
              {savedLocally ? 'Saved to Recipe Book' : 'Save to Recipe Book'}
            </button>

            <button
              onClick={handleScheduleClick}
              className="px-4 py-2 bg-[#D47A5F] hover:bg-[#B55F46] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
            >
              <CalendarPlus className="w-4 h-4 text-amber-200" />
              Schedule Recipe
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-[#575752] hover:text-[#1C1C1C] bg-[#F5F5F0] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-[#E5E3D8]"
          >
            <Printer className="w-4 h-4" />
            Print Recipe
          </button>
        </div>

        {/* Multi-Day Schedule Modal */}
        <ScheduleModal
          recipe={recipe}
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          authUser={authUser || null}
          onOpenAuthModal={onOpenAuthModal}
          onConfirmSchedule={(rec, days, mealType) => {
            if (onScheduleRecipe) {
              onScheduleRecipe(rec, days, mealType);
            } else if (onAddToMealPlan) {
              days.forEach(() => onAddToMealPlan(rec));
            }
          }}
        />

        {/* Action Refinement Quick Chips */}
        {onRefinePrompt && (
          <div className="pt-2 border-t border-[#E5E3D8]">
            <span className="text-[11px] font-bold text-[#88886C] uppercase tracking-wider block mb-2">
              Refine This Recipe via AI Chat:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                `Lower calories under 400 for ${recipe.title}`,
                `Make ${recipe.title} under 15 minutes`,
                `Substitute protein with tofu or plant option`,
                `Double the protein content to 50g+`,
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => onRefinePrompt(chip)}
                  className="px-3 py-1 bg-[#F5F5F0] hover:bg-[#5A5A40] text-[#1C1C1C] hover:text-white border border-[#E5E3D8] rounded-lg text-xs font-medium transition flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-[#D47A5F]" />
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
