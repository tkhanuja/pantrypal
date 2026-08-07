import React from 'react';
import { UserProfile, MeasurementUnit, MealPrepStyle } from '../types';
import { Settings, User as UserIcon, Sparkles, Check, Plus, Trash2, Flame, ShieldAlert, Scale, UtensilsCrossed, Dumbbell, Lock, Info, ChefHat } from 'lucide-react';
import { User } from 'firebase/auth';

interface Props {
  profiles: UserProfile[];
  currentProfile: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onCreateProfile: (newProfile: UserProfile) => void;
  onSelectProfile: (profile: UserProfile) => void;
  onDeleteProfile?: (profileId: string) => void;
  authUser: User | null;
  onOpenAuthModal: () => void;
}

const DIETARY_OPTIONS = [
  'High-Protein',
  'Keto',
  'Low-Carb',
  'Gluten-Free',
  'Vegan',
  'Vegetarian',
  'Dairy-Free',
  'Low-Sodium',
  'Paleo',
  'Halal',
  'Kosher',
];

const COMMON_ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Shellfish',
  'Soy',
  'Eggs',
  'Lactose',
  'Sesame',
];

const CUISINES = [
  'Mediterranean',
  'Japanese',
  'Mexican',
  'Italian',
  'Indian',
  'Thai',
  'Middle Eastern',
  'American',
  'Korean',
  'French',
];

const COMMON_APPLIANCES = [
  'Oven',
  'Stove / Cooktop',
  'Air Fryer',
  'Pressure Cooker / Instant Pot',
  'Slow Cooker / Crockpot',
  'Microwave',
  'Blender / Food Processor',
  'Grill / Outdoor BBQ',
  'Toaster / Toaster Oven',
  'Sous Vide',
  'Waffle Maker / Panini Press',
];

export const ProfileSettings: React.FC<Props> = ({
  profiles,
  currentProfile,
  onUpdateProfile,
  onCreateProfile,
  onSelectProfile,
  onDeleteProfile,
  authUser,
  onOpenAuthModal,
}) => {
  const [formData, setFormData] = React.useState<UserProfile>({ ...currentProfile });
  const [savedToast, setSavedToast] = React.useState(false);
  const [newAllergy, setNewAllergy] = React.useState('');
  const [newAppliance, setNewAppliance] = React.useState('');

  React.useEffect(() => {
    setFormData({ ...currentProfile });
  }, [currentProfile]);

  const handleToggleAppliance = (appliance: string) => {
    const list = formData.appliances || [];
    const exists = list.includes(appliance);
    const updated = exists ? list.filter((a) => a !== appliance) : [...list, appliance];
    setFormData({ ...formData, appliances: updated });
  };

  const handleAddCustomAppliance = (appliance: string) => {
    if (!appliance.trim()) return;
    const list = formData.appliances || [];
    if (!list.includes(appliance.trim())) {
      setFormData({ ...formData, appliances: [...list, appliance.trim()] });
    }
    setNewAppliance('');
  };

  const handleToggleDiet = (tag: string) => {
    const list = formData.dietaryRestrictions || [];
    const exists = list.includes(tag);
    const updated = exists ? list.filter((t) => t !== tag) : [...list, tag];
    setFormData({ ...formData, dietaryRestrictions: updated });
  };

  const handleToggleCuisine = (cuisine: string) => {
    const list = formData.preferredCuisines || [];
    const exists = list.includes(cuisine);
    const updated = exists ? list.filter((c) => c !== cuisine) : [...list, cuisine];
    setFormData({ ...formData, preferredCuisines: updated });
  };

  const handleAddAllergy = (allergy: string) => {
    if (!allergy.trim()) return;
    const list = formData.allergies || [];
    if (!list.includes(allergy.trim())) {
      setFormData({ ...formData, allergies: [...list, allergy.trim()] });
    }
    setNewAllergy('');
  };

  const handleRemoveAllergy = (allergy: string) => {
    setFormData({
      ...formData,
      allergies: (formData.allergies || []).filter((a) => a !== allergy),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData = {
      ...formData,
      ...(authUser?.email ? { email: authUser.email } : {}),
    };
    onUpdateProfile(updatedData);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  const handleCreateNew = () => {
    if (!authUser) {
      onOpenAuthModal();
      return;
    }

    const newProf: UserProfile = {
      id: `profile-custom-${Date.now()}`,
      name: 'Custom Profile',
      email: authUser.email || 'user@pantrypal.app',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      globalSystemPrompt: 'Focus on balanced whole food nutrition with precise macro breakdown.',
      dietaryRestrictions: ['High-Protein'],
      allergies: [],
      measurementUnit: 'metric',
      preferredCuisines: ['Mediterranean'],
      mealPrepStyle: 'quick_under_20',
      macroTargets: {
        calories: 2000,
        protein: 140,
        carbs: 180,
        fats: 65,
      },
    };
    onCreateProfile(newProf);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-[#5A5A40] text-white p-6 rounded-3xl shadow-sm border border-[#5A5A40]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 rounded-2xl text-amber-200">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="serif-heading text-2xl font-bold tracking-tight">System Prompt & Profile Settings</h2>
              <p className="text-xs text-[#E8E6DC] font-sans">
                Configure persistent LLM prompt instructions, dietary rules & macro targets
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-[#D47A5F] hover:bg-[#B55F46] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            {authUser ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-200" />}
            {authUser ? 'Create New Profile' : 'Sign In to Add Custom Profile'}
          </button>
        </div>

        {/* Profile Switcher Pills */}
        <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-amber-200 uppercase tracking-wider mr-1">System Diet Profiles:</span>
          {profiles.map((p) => {
            const isSelected = p.id === currentProfile.id;
            return (
              <div key={p.id} className="inline-flex items-center">
                <button
                  type="button"
                  onClick={() => onSelectProfile(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                    isSelected
                      ? 'bg-white text-[#5A5A40] font-bold shadow-xs'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <img src={p.avatarUrl} alt={p.name} className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                  {p.name}
                </button>
                {authUser && onDeleteProfile && profiles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteProfile(p.id)}
                    title={`Delete ${p.name} profile`}
                    className="ml-1 p-1 text-white/60 hover:text-white hover:bg-rose-600/50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Non-account User Browser Cookies / Local Storage Banner */}
      {!authUser && (
        <div className="bg-[#FAF9F5] border border-[#5A5A40]/30 p-4 rounded-2xl flex items-start gap-3 shadow-2xs">
          <Info className="w-5 h-5 text-[#5A5A40] shrink-0 mt-0.5" />
          <div className="text-xs text-[#575752] leading-relaxed">
            <span className="font-bold text-[#1C1C1C]">Guest Local Mode:</span> You are modifying system prompt settings locally stored in your browser cookies/storage. To permanently save profiles to cloud storage and create custom system profiles,{' '}
            <button
              onClick={onOpenAuthModal}
              className="text-[#5A5A40] font-bold underline hover:text-[#42422F]"
            >
              sign in or create an account
            </button>.
          </div>
        </div>
      )}

      {savedToast && (
        <div className="bg-[#5A5A40] text-white p-4 rounded-2xl shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 font-bold text-amber-200" />
            <span className="text-sm font-bold">
              {authUser
                ? 'System Prompt & Profile preferences saved permanently to your account!'
                : 'System Prompt & Profile preferences saved locally in browser storage! Sign in to sync across devices.'}
            </span>
          </div>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Info */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E3D8] shadow-xs space-y-4">
          <h3 className="serif-heading text-lg font-bold tracking-wide text-[#1C1C1C] flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#5A5A40]" />
            Profile Identity
          </h3>

          <div className={`grid grid-cols-1 ${authUser ? 'sm:grid-cols-2' : ''} gap-4`}>
            <div>
              <label className="text-xs font-semibold text-[#575752] block mb-1">Profile Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
                required
              />
            </div>
            {authUser && (
              <div>
                <label className="text-xs font-semibold text-[#575752] block mb-1">Associated Account Email</label>
                <input
                  type="email"
                  value={authUser.email || formData.email || ''}
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-[#F5F5F0] border border-[#E5E3D8] rounded-xl text-sm text-[#575752] cursor-not-allowed"
                />
              </div>
            )}
          </div>
        </div>

        {/* Global System Prompt Instructions (US-002) */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E3D8] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="serif-heading text-lg font-bold tracking-wide text-[#1C1C1C] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#5A5A40]" />
              Custom Persistent System Prompt
            </h3>
            <span className="text-[11px] font-bold text-[#5A5A40] bg-[#5A5A40]/10 px-2.5 py-0.5 rounded-full border border-[#5A5A40]/20">
              Injected into every Gemini LLM session
            </span>
          </div>
          <p className="text-xs text-[#575752]">
            Define your exact instructions for PantryPal. Specify cooking philosophy, flavor density, ingredient preferences, or prep guidelines.
          </p>

          <textarea
            rows={4}
            value={formData.globalSystemPrompt}
            onChange={(e) => setFormData({ ...formData, globalSystemPrompt: e.target.value })}
            placeholder="e.g. Focus on high-protein, clean whole foods with balanced healthy fats. Present metric measurements..."
            className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-xs sm:text-sm text-[#1C1C1C] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 font-mono resize-y"
          />
        </div>

        {/* Dietary Restrictions & Allergies */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E3D8] shadow-xs space-y-6">
          {/* Dietary Restrictions */}
          <div>
            <h3 className="serif-heading text-lg font-bold tracking-wide text-[#1C1C1C] flex items-center gap-2 mb-3">
              <UtensilsCrossed className="w-4 h-4 text-[#5A5A40]" />
              Dietary Restrictions & Protocols
            </h3>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((tag) => {
                const isSelected = (formData.dietaryRestrictions || []).includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleDiet(tag)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#5A5A40] text-white shadow-xs'
                        : 'bg-[#F5F5F0] text-[#575752] hover:bg-[#E8E6DC]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-amber-200" />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergies & Exclusions */}
          <div className="pt-4 border-t border-[#E5E3D8]">
            <h3 className="serif-heading text-lg font-bold tracking-wide text-[#1C1C1C] flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-[#D47A5F]" />
              Allergies & Strict Exclusions
            </h3>

            {/* Quick Allergies Pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_ALLERGIES.map((alg) => {
                const isSelected = (formData.allergies || []).includes(alg);
                return (
                  <button
                    key={alg}
                    type="button"
                    onClick={() => (isSelected ? handleRemoveAllergy(alg) : handleAddAllergy(alg))}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-[#D47A5F] text-white shadow-xs'
                        : 'bg-[#D47A5F]/10 text-[#B55F46] border border-[#D47A5F]/30 hover:bg-[#D47A5F]/20'
                    }`}
                  >
                    {isSelected ? `✓ Exclude ${alg}` : `+ Exclude ${alg}`}
                  </button>
                );
              })}
            </div>

            {/* Add Custom Allergy */}
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add custom allergy (e.g. Cilantro, Mushroom)"
                className="flex-1 px-3.5 py-2 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
              />
              <button
                type="button"
                onClick={() => handleAddAllergy(newAllergy)}
                className="px-3 py-2 bg-[#5A5A40] text-white text-xs font-bold rounded-xl hover:bg-[#42422F] transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Kitchen Appliances & Equipment Settings */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E3D8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="serif-heading text-lg font-bold tracking-wide text-[#1C1C1C] flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-[#5A5A40]" />
              Kitchen Appliances & Cooking Equipment
            </h3>
            <span className="text-[11px] font-bold text-[#5A5A40] bg-[#5A5A40]/10 px-2.5 py-0.5 rounded-full border border-[#5A5A40]/20">
              Recipe AI respects your available gear
            </span>
          </div>
          <p className="text-xs text-[#575752]">
            Select all appliances available in your kitchen. PantryPal will prioritize recipes and cooking techniques tailored to these tools (e.g. pressure cooker, air fryer, oven).
          </p>

          <div className="flex flex-wrap gap-2">
            {COMMON_APPLIANCES.map((appliance) => {
              const isSelected = (formData.appliances || []).includes(appliance);
              return (
                <button
                  key={appliance}
                  type="button"
                  onClick={() => handleToggleAppliance(appliance)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#5A5A40] text-white shadow-xs'
                      : 'bg-[#F5F5F0] text-[#575752] hover:bg-[#E8E6DC]'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-200" />}
                  {appliance}
                </button>
              );
            })}
          </div>

          {/* Add Custom Appliance */}
          <div className="pt-2 flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={newAppliance}
              onChange={(e) => setNewAppliance(e.target.value)}
              placeholder="Add custom equipment (e.g. Rice Cooker, Dehydrator)"
              className="flex-1 px-3.5 py-2 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
            />
            <button
              type="button"
              onClick={() => handleAddCustomAppliance(newAppliance)}
              className="px-3.5 py-2 bg-[#5A5A40] text-white text-xs font-bold rounded-xl hover:bg-[#42422F] transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Measurement Units & Cuisine Preferences */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E3D8] shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Measurement Unit */}
          <div>
            <h3 className="serif-heading text-lg font-bold tracking-wide text-[#1C1C1C] flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-[#5A5A40]" />
              Measurement System
            </h3>
            <div className="space-y-2">
              {[
                { id: 'metric', title: 'Metric System', desc: 'Grams (g), Milliliters (ml), Celsius (°C)' },
                { id: 'imperial', title: 'Imperial System', desc: 'Ounces (oz), Cups, Fahrenheit (°F)' },
                { id: 'grams_only', title: 'Grams Only (Precision Scale)', desc: '100% mass-based precise measurements' },
              ].map((unit) => (
                <label
                  key={unit.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                    formData.measurementUnit === unit.id
                      ? 'bg-[#FAF9F5] border-[#5A5A40] text-[#1C1C1C] font-semibold'
                      : 'bg-[#F5F5F0] border-[#E5E3D8] hover:border-[#5A5A40]/40 text-[#575752]'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{unit.title}</span>
                    <span className="text-[11px] text-[#575752]">{unit.desc}</span>
                  </div>
                  <input
                    type="radio"
                    name="measurementUnit"
                    value={unit.id}
                    checked={formData.measurementUnit === unit.id}
                    onChange={() => setFormData({ ...formData, measurementUnit: unit.id as MeasurementUnit })}
                    className="accent-[#5A5A40]"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Cuisines */}
          <div>
            <h3 className="serif-heading text-lg font-bold tracking-wide text-[#1C1C1C] flex items-center gap-2 mb-3">
              <UtensilsCrossed className="w-4 h-4 text-[#D47A5F]" />
              Preferred Culinary Flavors
            </h3>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((c) => {
                const isSelected = (formData.preferredCuisines || []).includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleToggleCuisine(c)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-[#D47A5F] text-white shadow-xs'
                        : 'bg-[#F5F5F0] text-[#575752] hover:bg-[#E8E6DC]'
                    }`}
                  >
                    {isSelected ? `✓ ${c}` : `+ ${c}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Target Daily Macro Goals */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E3D8] shadow-xs space-y-4">
          <h3 className="serif-heading text-lg font-bold tracking-wide text-[#1C1C1C] flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-[#5A5A40]" />
            Target Daily Macro Goals
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#E5E3D8]">
              <label className="text-xs font-bold text-[#88886C] block mb-1">Calories (kcal)</label>
              <input
                type="number"
                value={formData.macroTargets.calories}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    macroTargets: { ...formData.macroTargets, calories: parseInt(e.target.value) || 2000 },
                  })
                }
                className="w-full px-3 py-1.5 bg-white border border-[#E5E3D8] rounded-xl text-sm font-bold text-[#1C1C1C]"
              />
            </div>

            <div className="bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#E5E3D8]">
              <label className="text-xs font-bold text-[#5A5A40] block mb-1">Protein (g)</label>
              <input
                type="number"
                value={formData.macroTargets.protein}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    macroTargets: { ...formData.macroTargets, protein: parseInt(e.target.value) || 140 },
                  })
                }
                className="w-full px-3 py-1.5 bg-white border border-[#E5E3D8] rounded-xl text-sm font-bold text-[#5A5A40]"
              />
            </div>

            <div className="bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#E5E3D8]">
              <label className="text-xs font-bold text-[#5A5A40] block mb-1">Carbs (g)</label>
              <input
                type="number"
                value={formData.macroTargets.carbs}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    macroTargets: { ...formData.macroTargets, carbs: parseInt(e.target.value) || 180 },
                  })
                }
                className="w-full px-3 py-1.5 bg-white border border-[#E5E3D8] rounded-xl text-sm font-bold text-[#5A5A40]"
              />
            </div>

            <div className="bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#E5E3D8]">
              <label className="text-xs font-bold text-[#D47A5F] block mb-1">Fats (g)</label>
              <input
                type="number"
                value={formData.macroTargets.fats}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    macroTargets: { ...formData.macroTargets, fats: parseInt(e.target.value) || 65 },
                  })
                }
                className="w-full px-3 py-1.5 bg-white border border-[#E5E3D8] rounded-xl text-sm font-bold text-[#D47A5F]"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-[#5A5A40] hover:bg-[#42422F] text-white font-bold rounded-2xl shadow-md transition flex items-center gap-2"
          >
            <Check className="w-5 h-5 text-amber-200" />
            Save System Prompt & Profile Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
