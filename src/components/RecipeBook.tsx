import React from 'react';
import { Recipe, UserProfile } from '../types';
import { RecipeCardView } from './RecipeCardView';
import { getFoodPhotoFallback } from '../lib/foodPhotos';
import { ScheduleModal } from './ScheduleModal';
import { BookOpen, Search, Sparkles, Trash2, Eye, CalendarPlus, X, Filter, Lock, LogIn } from 'lucide-react';
import { User } from 'firebase/auth';

interface Props {
  recipes: Recipe[];
  userProfile: UserProfile;
  onDeleteRecipe: (recipeId: string) => void;
  onSaveRecipe: (recipe: Recipe) => void;
  onAddToMealPlan: (recipe: Recipe) => void;
  onScheduleRecipe?: (recipe: Recipe, selectedDays: string[], mealType: string) => void;
  authUser: User | null;
  onOpenAuthModal: () => void;
}

export const RecipeBook: React.FC<Props> = ({
  recipes,
  userProfile,
  onDeleteRecipe,
  onSaveRecipe,
  onAddToMealPlan,
  onScheduleRecipe,
  authUser,
  onOpenAuthModal,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTag, setSelectedTag] = React.useState<string>('All');
  const [maxCalories, setMaxCalories] = React.useState<number>(1000);
  const [minProtein, setMinProtein] = React.useState<number>(0);
  const [maxCookTime, setMaxCookTime] = React.useState<number>(90);
  const [sortBy, setSortBy] = React.useState<'newest' | 'protein' | 'calories' | 'time'>('newest');
  const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
  const [schedulingRecipe, setSchedulingRecipe] = React.useState<Recipe | null>(null);

  // Collect all unique tags
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => (r.dietaryTags || []).forEach((t) => set.add(t)));
    return ['All', ...Array.from(set)];
  }, [recipes]);

  // Filter & Sort Logic (Phase 2 Roadmap)
  const filteredRecipes = React.useMemo(() => {
    return recipes
      .filter((r) => {
        const matchesSearch =
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.ingredients || []).some((ing) => ing.item.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesTag = selectedTag === 'All' || (r.dietaryTags || []).includes(selectedTag);

        const calories = r.nutritionMacros?.calories || 0;
        const protein = r.nutritionMacros?.protein || 0;
        const totalTime = (r.prepTime || 0) + (r.cookTime || 0);

        const matchesCal = calories <= maxCalories;
        const matchesProt = protein >= minProtein;
        const matchesTime = totalTime <= maxCookTime;

        return matchesSearch && matchesTag && matchesCal && matchesProt && matchesTime;
      })
      .sort((a, b) => {
        if (sortBy === 'protein') {
          return (b.nutritionMacros?.protein || 0) - (a.nutritionMacros?.protein || 0);
        }
        if (sortBy === 'calories') {
          return (a.nutritionMacros?.calories || 0) - (b.nutritionMacros?.calories || 0);
        }
        if (sortBy === 'time') {
          return ((a.prepTime || 0) + (a.cookTime || 0)) - ((b.prepTime || 0) + (b.cookTime || 0));
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [recipes, searchQuery, selectedTag, maxCalories, minProtein, maxCookTime, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {!authUser && (
        <div className="bg-[#FAF9F5] border border-[#D47A5F]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#D47A5F]/10 rounded-xl text-[#D47A5F]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#1C1C1C]">Authentication Required for Recipe Book:</span>
              <span className="text-[#575752] ml-1">Sign in or create an account to save recipes, sync with Cloud Firestore, and build your personalized collection.</span>
            </div>
          </div>
          <button
            onClick={onOpenAuthModal}
            className="px-4 py-2 bg-[#D47A5F] hover:bg-[#B55F46] text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <LogIn className="w-3.5 h-3.5 text-amber-200" />
            Sign In or Create Account
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#5A5A40] text-white p-6 rounded-3xl shadow-sm border border-[#5A5A40]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 rounded-2xl text-amber-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="serif-heading text-2xl font-bold tracking-tight">Personal Saved Recipe Book</h2>
              <p className="text-xs text-[#E8E6DC] font-sans">
                Stored culinary collection with macro breakdowns & personalized filtering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/15 px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-bold text-amber-200 self-start sm:self-auto">
            <Sparkles className="w-4 h-4 text-amber-300" />
            {recipes.length} Saved Recipes
          </div>
        </div>

        {/* Search & Quick Tag Pills */}
        <div className="mt-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#88886C] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by recipe name, ingredient (e.g. salmon, tofu, broccolini)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white text-[#1C1C1C] border border-[#E5E3D8] rounded-xl text-xs sm:text-sm placeholder-[#88886C] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">Tag Filter:</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  selectedTag === tag
                    ? 'bg-white text-[#5A5A40] font-bold shadow-xs'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Phase 2 Filtering & Sorting Controls Bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#E5E3D8] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E3D8] pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1C1C1C] uppercase tracking-wider serif-heading">
            <Filter className="w-4 h-4 text-[#5A5A40]" />
            Macro & Time Threshold Filters
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#575752]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl font-bold text-[#1C1C1C] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
            >
              <option value="newest">Recently Saved</option>
              <option value="protein">Highest Protein (g)</option>
              <option value="calories">Lowest Calories (kcal)</option>
              <option value="time">Fastest Cook Time</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold text-[#575752] mb-1">
              <span>Max Calories:</span>
              <span className="font-bold text-[#5A5A40]">{maxCalories} kcal</span>
            </div>
            <input
              type="range"
              min={200}
              max={1200}
              step={50}
              value={maxCalories}
              onChange={(e) => setMaxCalories(parseInt(e.target.value))}
              className="w-full accent-[#5A5A40] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-[#575752] mb-1">
              <span>Min Protein:</span>
              <span className="font-bold text-[#5A5A40]">{minProtein}g+</span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              step={5}
              value={minProtein}
              onChange={(e) => setMinProtein(parseInt(e.target.value))}
              className="w-full accent-[#5A5A40] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-[#575752] mb-1">
              <span>Max Total Prep+Cook:</span>
              <span className="font-bold text-[#D47A5F]">{maxCookTime} mins</span>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={maxCookTime}
              onChange={(e) => setMaxCookTime(parseInt(e.target.value))}
              className="w-full accent-[#D47A5F] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Recipe Cards Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E3D8] shadow-xs space-y-4">
          <BookOpen className="w-12 h-12 text-[#88886C] mx-auto" />
          <h3 className="serif-heading text-xl font-bold text-[#1C1C1C]">
            {!authUser ? 'Sign In to View & Save Recipes' : 'No Saved Recipes Found'}
          </h3>
          <p className="text-xs text-[#575752] max-w-md mx-auto leading-relaxed">
            {!authUser
              ? 'Recipe saving and cloud synchronization require an authenticated account. Sign in or create an account to start saving recipes to Cloud Firestore.'
              : 'Try adjusting your search query or threshold filters above, or generate new recipes with the AI Chef Chat!'}
          </p>
          {!authUser && (
            <button
              onClick={onOpenAuthModal}
              className="px-6 py-2.5 bg-[#D47A5F] hover:bg-[#B55F46] text-white font-bold rounded-xl shadow-md transition inline-flex items-center gap-2 text-xs"
            >
              <LogIn className="w-4 h-4 text-amber-200" />
              Sign In / Create Account
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-3xl border border-[#E5E3D8] shadow-xs overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col group"
            >
              {/* Image Banner */}
              <div className="relative h-48 w-full bg-[#1C1C1C] overflow-hidden">
                <img
                  src={(rec.imageUrl && !rec.imageUrl.includes('photo-1546069901-ba9599a7e63c')) ? rec.imageUrl : getFoodPhotoFallback(rec.title, rec.description)}
                  alt={rec.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const fallback = getFoodPhotoFallback(rec.title, rec.description);
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Top Tags */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  {(rec.dietaryTags || []).slice(0, 2).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white/90 text-[#1C1C1C] text-[10px] font-bold rounded-md shadow-2xs">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Bottom Overlay Title */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="serif-heading font-bold text-lg leading-tight drop-shadow-md">{rec.title}</h3>
                </div>
              </div>

              {/* Body Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-[#575752] line-clamp-2 leading-relaxed">{rec.description}</p>

                {/* Macro Pills Bar */}
                <div className="grid grid-cols-3 gap-2 bg-[#FAF9F5] p-2.5 rounded-2xl border border-[#E5E3D8] text-center">
                  <div>
                    <span className="text-[10px] font-bold text-[#88886C] block uppercase">Cal</span>
                    <span className="text-xs font-extrabold text-[#1C1C1C]">{rec.nutritionMacros?.calories || 400}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#88886C] block uppercase">Protein</span>
                    <span className="text-xs font-extrabold text-[#5A5A40]">{rec.nutritionMacros?.protein || 30}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#88886C] block uppercase">Prep</span>
                    <span className="text-xs font-extrabold text-[#D47A5F]">{(rec.prepTime || 10) + (rec.cookTime || 15)}m</span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 border-t border-[#E5E3D8] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedRecipe(rec)}
                    className="flex-1 px-3 py-2 bg-[#5A5A40] hover:bg-[#42422F] text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </button>

                  <button
                    onClick={() => {
                      if (!authUser) {
                        onOpenAuthModal();
                        return;
                      }
                      setSchedulingRecipe(rec);
                    }}
                    className="p-2 text-[#D47A5F] bg-[#D47A5F]/10 hover:bg-[#D47A5F]/20 rounded-xl border border-[#D47A5F]/30 transition flex items-center gap-1 font-bold text-xs"
                    title="Schedule Recipe for Meal Plan"
                  >
                    <CalendarPlus className="w-4 h-4 text-[#D47A5F]" />
                  </button>

                  <button
                    onClick={() => {
                      if (!authUser) {
                        onOpenAuthModal();
                        return;
                      }
                      onDeleteRecipe(rec.id);
                    }}
                    className="p-2 text-[#D47A5F] hover:bg-[#D47A5F]/10 rounded-xl border border-[#D47A5F]/30 transition"
                    title="Delete saved recipe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Grid Schedule Modal */}
      <ScheduleModal
        recipe={schedulingRecipe}
        isOpen={!!schedulingRecipe}
        onClose={() => setSchedulingRecipe(null)}
        authUser={authUser}
        onOpenAuthModal={onOpenAuthModal}
        onConfirmSchedule={(rec, days, mealType) => {
          if (onScheduleRecipe) {
            onScheduleRecipe(rec, days, mealType);
          } else {
            days.forEach(() => onAddToMealPlan(rec));
          }
        }}
      />

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Recipe Book Card View
              </span>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6">
              <RecipeCardView
                recipe={selectedRecipe}
                userProfile={userProfile}
                isSaved={true}
                onSave={onSaveRecipe}
                onAddToMealPlan={onAddToMealPlan}
                onScheduleRecipe={onScheduleRecipe}
                authUser={authUser}
                onOpenAuthModal={onOpenAuthModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
