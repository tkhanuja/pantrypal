import React from 'react';
import { MealPlanEntry, Recipe } from '../types';
import { getFoodPhotoFallback } from '../lib/foodPhotos';
import { Calendar, ShoppingBag, Plus, Trash2, CheckCircle2, Flame, Sparkles, X, ChevronRight, LogIn, Lock } from 'lucide-react';
import { User } from 'firebase/auth';

interface Props {
  mealPlan: MealPlanEntry[];
  savedRecipes: Recipe[];
  onAddMealPlanEntry: (entry: MealPlanEntry) => void;
  onRemoveMealPlanEntry: (entryId: string) => void;
  authUser: User | null;
  onOpenAuthModal: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

interface GroceryItem {
  item: string;
  totalAmount: number;
  unit: string;
}

export const MealPlanner: React.FC<Props> = ({
  mealPlan,
  savedRecipes,
  onAddMealPlanEntry,
  onRemoveMealPlanEntry,
  authUser,
  onOpenAuthModal,
}) => {
  const [selectedDay, setSelectedDay] = React.useState<typeof DAYS_OF_WEEK[number]>('Monday');
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [modalMealType, setModalMealType] = React.useState<typeof MEAL_TYPES[number]>('Breakfast');
  const [shoppingListChecked, setShoppingListChecked] = React.useState<Record<string, boolean>>({});

  const handleOpenAdd = (day: typeof DAYS_OF_WEEK[number], type: typeof MEAL_TYPES[number]) => {
    if (!authUser) {
      onOpenAuthModal();
      return;
    }
    setSelectedDay(day);
    setModalMealType(type);
    setAddModalOpen(true);
  };

  const handleSelectRecipeForPlan = (recipe: Recipe) => {
    const entry: MealPlanEntry = {
      id: `mp-${Date.now()}`,
      dayOfWeek: selectedDay,
      mealType: modalMealType,
      recipe,
    };
    onAddMealPlanEntry(entry);
    setAddModalOpen(false);
  };

  // Consolidated Grocery List Calculation
  const groceryListByCategory = React.useMemo<Record<string, GroceryItem[]>>(() => {
    const categories: Record<string, GroceryItem[]> = {};

    mealPlan.forEach((mp) => {
      (mp.recipe.ingredients || []).forEach((ing) => {
        const cat = ing.category || 'Pantry & Spices';
        if (!categories[cat]) categories[cat] = [];

        const existing = categories[cat].find(
          (i) => i.item.toLowerCase() === ing.item.toLowerCase() && i.unit === ing.unit
        );
        if (existing) {
          existing.totalAmount += ing.amount || 1;
        } else {
          categories[cat].push({
            item: ing.item,
            totalAmount: ing.amount || 1,
            unit: ing.unit || '',
          });
        }
      });
    });

    return categories;
  }, [mealPlan]);

  // Weekly Total Macros
  const weeklyTotals = React.useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;

    mealPlan.forEach((mp) => {
      calories += mp.recipe.nutritionMacros?.calories || 0;
      protein += mp.recipe.nutritionMacros?.protein || 0;
      carbs += mp.recipe.nutritionMacros?.carbs || 0;
      fats += mp.recipe.nutritionMacros?.fats || 0;
    });

    return {
      calories,
      protein,
      carbs,
      fats,
      avgDailyCal: Math.round(calories / 7),
      avgDailyProtein: Math.round(protein / 7),
    };
  }, [mealPlan]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {!authUser && (
        <div className="bg-[#FAF9F5] border border-[#D47A5F]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#D47A5F]/10 rounded-xl text-[#D47A5F]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#1C1C1C]">Authentication Required for Meal Planning:</span>
              <span className="text-[#575752] ml-1">Sign in or create an account to schedule meals and sync your weekly plan with Cloud Firestore.</span>
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
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="serif-heading text-2xl font-bold tracking-tight">Automated Weekly Meal Planner</h2>
              <p className="text-xs text-[#E8E6DC] font-sans">
                Coordinate weekly macro distributions & generate consolidated grocery lists
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/15 px-4 py-2 rounded-2xl border border-white/20 text-xs font-bold">
            <div>
              <span className="text-amber-200 block text-[10px] uppercase">Weekly Avg</span>
              <span className="text-white font-extrabold text-sm">{weeklyTotals.avgDailyCal} kcal / day</span>
            </div>
            <div className="border-l border-white/20 pl-3">
              <span className="text-amber-200 block text-[10px] uppercase">Protein</span>
              <span className="text-amber-200 font-extrabold text-sm">{weeklyTotals.avgDailyProtein}g / day</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 7-Day Meal Plan Grid */}
        <div className="lg:col-span-2 space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayEntries = mealPlan.filter((mp) => mp.dayOfWeek === day);

            return (
              <div key={day} className="bg-white rounded-3xl border border-[#E5E3D8] shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E3D8]">
                  <h3 className="serif-heading text-base font-bold text-[#1C1C1C] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5A5A40]"></span>
                    {day}
                  </h3>
                  <span className="text-xs font-bold text-[#575752]">
                    {dayEntries.reduce((sum, e) => sum + (e.recipe.nutritionMacros?.calories || 0), 0)} kcal
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {MEAL_TYPES.map((type) => {
                    const entry = dayEntries.find((e) => e.mealType === type);

                    return (
                      <div
                        key={type}
                        className={`p-3 rounded-2xl border transition flex flex-col justify-between min-h-[90px] ${
                          entry
                            ? 'bg-[#FAF9F5] border-[#5A5A40]/30 text-[#1C1C1C]'
                            : 'bg-[#F5F5F0] border-dashed border-[#E5E3D8] text-[#88886C] hover:border-[#5A5A40]/50 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#88886C] uppercase">
                          <span>{type}</span>
                          {entry && (
                            <button
                              onClick={() => onRemoveMealPlanEntry(entry.id)}
                              className="text-[#88886C] hover:text-[#D47A5F] transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {entry ? (
                          <div className="mt-1.5">
                            <p className="text-xs font-bold text-[#1C1C1C] line-clamp-1">{entry.recipe.title}</p>
                            <span className="text-[10px] text-[#5A5A40] font-semibold block mt-0.5">
                              {entry.recipe.nutritionMacros?.calories} kcal | {entry.recipe.nutritionMacros?.protein}g protein
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAdd(day, type)}
                            className="mt-2 text-xs font-semibold text-[#5A5A40] hover:text-[#42422F] flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Meal
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Consolidated Grocery Shopping List */}
        <div className="bg-white rounded-3xl border border-[#E5E3D8] shadow-xs p-5 space-y-4 self-start">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E3D8]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#5A5A40]" />
              <div>
                <h3 className="serif-heading text-base font-bold text-[#1C1C1C]">
                  Consolidated Grocery List
                </h3>
                <p className="text-[11px] text-[#575752]">Auto-aggregated from weekly planned meals</p>
              </div>
            </div>
          </div>

          {Object.keys(groceryListByCategory).length === 0 ? (
            <div className="text-center py-8 text-[#88886C] space-y-2">
              <ShoppingBag className="w-8 h-8 mx-auto" />
              <p className="text-xs">Add recipes to your weekly calendar to auto-generate a shopping list!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {(Object.entries(groceryListByCategory) as [string, GroceryItem[]][]).map(([cat, items]) => (
                <div key={cat} className="space-y-2">
                  <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider bg-[#5A5A40]/10 px-2.5 py-1 rounded-lg">
                    {cat}
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#575752]">
                    {items.map((ing, idx) => {
                      const itemKey = `${cat}-${ing.item}`;
                      const isChecked = !!shoppingListChecked[itemKey];

                      return (
                        <li
                          key={idx}
                          onClick={() =>
                            setShoppingListChecked((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }))
                          }
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                            isChecked ? 'bg-[#F5F5F0] text-[#88886C] line-through' : 'bg-white border-[#E5E3D8] hover:bg-[#FAF9F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              className={`w-4 h-4 ${isChecked ? 'text-[#5A5A40] fill-[#5A5A40]/20' : 'text-[#88886C]'}`}
                            />
                            <span className="font-semibold text-[#1C1C1C]">{ing.item}</span>
                          </div>
                          <span className="font-bold text-[#5A5A40]">
                            {Math.round(ing.totalAmount * 10) / 10} {ing.unit}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Select Recipe Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  Add Recipe to {selectedDay} ({modalMealType})
                </h3>
                <p className="text-xs text-slate-400">Choose from your personal Recipe Book</p>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2">
              {savedRecipes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No saved recipes in your book yet. Save some recipes from AI Chef Chat first!
                </p>
              ) : (
                savedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => handleSelectRecipeForPlan(recipe)}
                    className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={(recipe.imageUrl && !recipe.imageUrl.includes('photo-1546069901-ba9599a7e63c')) ? recipe.imageUrl : getFoodPhotoFallback(recipe.title, recipe.description)}
                        alt={recipe.title}
                        className="w-10 h-10 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          const fallback = getFoodPhotoFallback(recipe.title, recipe.description);
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{recipe.title}</h4>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          {recipe.nutritionMacros?.calories} kcal | {recipe.nutritionMacros?.protein}g protein
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-600" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
