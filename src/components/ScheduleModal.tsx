import React, { useState } from 'react';
import { Recipe } from '../types';
import { getFoodPhotoFallback } from '../lib/foodPhotos';
import { Calendar, CalendarPlus, Check, Clock, Flame, X, LogIn, Sparkles } from 'lucide-react';
import { User } from 'firebase/auth';

interface Props {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSchedule: (recipe: Recipe, selectedDays: string[], mealType: string) => void;
  authUser: User | null;
  onOpenAuthModal?: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export const ScheduleModal: React.FC<Props> = ({
  recipe,
  isOpen,
  onClose,
  onConfirmSchedule,
  authUser,
  onOpenAuthModal,
}) => {
  const [selectedMealType, setSelectedMealType] = useState<string>('Dinner');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday']);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  if (!isOpen || !recipe) return null;

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSelectQuick = (preset: 'weekdays' | 'weekend' | 'all' | 'clear') => {
    if (preset === 'weekdays') {
      setSelectedDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    } else if (preset === 'weekend') {
      setSelectedDays(['Saturday', 'Sunday']);
    } else if (preset === 'all') {
      setSelectedDays([...DAYS_OF_WEEK]);
    } else if (preset === 'clear') {
      setSelectedDays([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }

    if (selectedDays.length === 0) return;

    onConfirmSchedule(recipe, selectedDays, selectedMealType);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#E5E3D8] transition-all">
        {/* Header Banner */}
        <div className="bg-[#5A5A40] text-white p-5 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl text-amber-200">
              <CalendarPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="serif-heading font-bold text-xl tracking-tight">Schedule Recipe</h3>
              <p className="text-xs text-[#E8E6DC] font-sans">
                Assign meal to your weekly planner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipe Summary Bar */}
        <div className="p-4 bg-[#FAF9F5] border-b border-[#E5E3D8] flex items-center gap-3.5">
          <img
            src={(recipe.imageUrl && !recipe.imageUrl.includes('photo-1546069901-ba9599a7e63c')) ? recipe.imageUrl : getFoodPhotoFallback(recipe.title, recipe.description)}
            alt={recipe.title}
            className="w-16 h-16 rounded-2xl object-cover border border-[#E5E3D8] shadow-2xs"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              const fallback = getFoodPhotoFallback(recipe.title, recipe.description);
              if (target.src !== fallback) {
                target.src = fallback;
              }
            }}
          />
          <div className="flex-1 min-w-0">
            <h4 className="serif-heading font-bold text-[#1C1C1C] text-sm truncate">{recipe.title}</h4>
            <div className="flex items-center gap-3 text-xs text-[#575752] mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#5A5A40]" />
                {(recipe.prepTime || 10) + (recipe.cookTime || 15)} mins
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#D47A5F]" />
                {recipe.nutritionMacros?.calories || 450} kcal
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {!authUser ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-[#D47A5F]/10 text-[#D47A5F] rounded-2xl flex items-center justify-center mx-auto border border-[#D47A5F]/20 shadow-xs">
              <LogIn className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="serif-heading font-bold text-lg text-[#1C1C1C]">Sign Up to Schedule Meals</h4>
              <p className="text-xs text-[#575752] max-w-xs mx-auto">
                Logged in users can schedule recipes across multiple days and sync them to Firestore.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                if (onOpenAuthModal) onOpenAuthModal();
              }}
              className="w-full py-3 bg-[#D47A5F] hover:bg-[#B55F46] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-amber-200" />
              Sign Up or Log In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {/* Meal Type Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#88886C] block mb-2">
                1. Select Meal Slot
              </label>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPES.map(meal => {
                  const isSelected = selectedMealType === meal;
                  return (
                    <button
                      type="button"
                      key={meal}
                      onClick={() => setSelectedMealType(meal)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition ${
                        isSelected
                          ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs'
                          : 'bg-[#FAF9F5] text-[#575752] border-[#E5E3D8] hover:bg-white'
                      }`}
                    >
                      {meal}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Multiple Days */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#88886C]">
                  2. Select Days to Schedule ({selectedDays.length} Selected)
                </label>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5A5A40]">
                  <button
                    type="button"
                    onClick={() => handleSelectQuick('weekdays')}
                    className="hover:underline text-[#D47A5F]"
                  >
                    Weekdays
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectQuick('weekend')}
                    className="hover:underline text-[#D47A5F]"
                  >
                    Weekend
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectQuick('all')}
                    className="hover:underline text-[#D47A5F]"
                  >
                    All
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectQuick('clear')}
                    className="hover:underline text-gray-400"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DAYS_OF_WEEK.map(day => {
                  const isChecked = selectedDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-between transition ${
                        isChecked
                          ? 'bg-[#D47A5F] text-white border-[#D47A5F] shadow-xs'
                          : 'bg-[#FAF9F5] text-[#1C1C1C] border-[#E5E3D8] hover:border-[#5A5A40]'
                      }`}
                    >
                      <span>{day}</span>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center transition ${
                          isChecked ? 'bg-white text-[#D47A5F]' : 'border border-[#E5E3D8]'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Success Toast */}
            {showSuccessToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600" />
                Successfully scheduled for {selectedDays.length} day(s) as {selectedMealType}!
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#E5E3D8] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-[#575752] hover:bg-[#F5F5F0] rounded-xl border border-[#E5E3D8] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedDays.length === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition ${
                  selectedDays.length > 0
                    ? 'bg-[#D47A5F] hover:bg-[#B55F46]'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <CalendarPlus className="w-4 h-4 text-amber-200" />
                Schedule for {selectedDays.length} {selectedDays.length === 1 ? 'Day' : 'Days'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
