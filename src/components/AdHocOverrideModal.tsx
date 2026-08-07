import React from 'react';
import { AdHocOverride } from '../types';
import { Sparkles, Users, Clock, AlertCircle, X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  override: AdHocOverride;
  onSave: (updated: AdHocOverride) => void;
}

const PRESET_SCENARIOS = [
  { name: 'Dinner Party for 6', guests: 6, time: 60, notes: 'Impressive plating, crowd-pleasing flavors' },
  { name: 'Post-Workout High Carb', guests: 1, time: 20, notes: 'Fast digesting carbs, >40g high quality protein' },
  { name: 'Quick 15-Min Workday Lunch', guests: 1, time: 15, notes: 'Minimal cleanup, no baking required' },
  { name: 'No Oven / Stove-Only', guests: 2, time: 25, notes: 'Only stovetop skillet or raw prep allowed' },
  { name: 'Kid-Friendly Mild Flavors', guests: 4, time: 30, notes: 'No spicy peppers, hidden veggies preferred' },
];

export const AdHocOverrideModal: React.FC<Props> = ({ isOpen, onClose, override, onSave }) => {
  const [formData, setFormData] = React.useState<AdHocOverride>({ ...override });

  React.useEffect(() => {
    setFormData({ ...override });
  }, [override, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setFormData({
      ...formData,
      active: true,
      scenario: preset.name,
      guestCount: preset.guests,
      cookingTimeLimit: preset.time,
      customNotes: preset.notes,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1C1C]/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-[#E5E3D8] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#5A5A40] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-2xl backdrop-blur-xs">
              <Sparkles className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="serif-heading text-xl font-bold tracking-tight">Ad-Hoc Scenario Override</h2>
              <p className="text-xs text-[#E8E6DC] font-sans">Temporary prompt context without altering your global profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-[#575752]">
          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#FAF9F5] rounded-2xl border border-[#E5E3D8]">
            <div>
              <span className="font-semibold text-[#1C1C1C] text-sm block">Enable Scenario Override</span>
              <span className="text-xs text-[#575752]">Inject these temporary parameters into your next chat generation</span>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, active: !formData.active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.active ? 'bg-[#5A5A40]' : 'bg-[#E5E3D8]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#88886C] block mb-2">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_SCENARIOS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-3 py-1.5 text-xs font-medium bg-[#5A5A40]/10 text-[#5A5A40] border border-[#5A5A40]/20 rounded-xl hover:bg-[#5A5A40]/20 transition"
                >
                  + {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Name */}
          <div>
            <label className="text-sm font-semibold text-[#1C1C1C] block mb-1">Scenario Title</label>
            <input
              type="text"
              value={formData.scenario}
              onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
              placeholder="e.g. Cooking for a dinner party of 6"
              className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
              required
            />
          </div>

          {/* Guest Count & Time Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-[#1C1C1C] flex items-center gap-1.5 mb-1">
                <Users className="w-4 h-4 text-[#5A5A40]" />
                Target Servings
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={formData.guestCount}
                onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-[#1C1C1C] flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-[#5A5A40]" />
                Max Prep Time (mins)
              </label>
              <input
                type="number"
                min={5}
                max={240}
                value={formData.cookingTimeLimit}
                onChange={(e) => setFormData({ ...formData, cookingTimeLimit: parseInt(e.target.value) || 30 })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
              />
            </div>
          </div>

          {/* Custom Notes / Constraints */}
          <div>
            <label className="text-sm font-semibold text-[#1C1C1C] block mb-1">
              Custom Scenario Notes & Instructions
            </label>
            <textarea
              rows={3}
              value={formData.customNotes}
              onChange={(e) => setFormData({ ...formData, customNotes: e.target.value })}
              placeholder="e.g. Make it low carb, extra spicy, or use air fryer only"
              className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 resize-none"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E3D8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#575752] hover:bg-[#F5F5F0] rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-[#5A5A40] hover:bg-[#42422F] rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-amber-200" />
              Apply Scenario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
