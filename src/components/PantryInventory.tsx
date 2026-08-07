import React from "react";
import { PantryItem } from "../types";
import {
  Package,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  LogIn,
  Lock,
} from "lucide-react";
import { User } from "firebase/auth";

interface Props {
  items: PantryItem[];
  onAddItem: (item: PantryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onCookWithPantry: (selectedIngredients: string[]) => void;
  authUser: User | null;
  onOpenAuthModal: () => void;
}

const CATEGORIES: PantryItem["category"][] = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Pantry & Spices",
  "Baking",
  "Other",
];

export const PantryInventory: React.FC<Props> = ({
  items,
  onAddItem,
  onDeleteItem,
  onCookWithPantry,
  authUser,
  onOpenAuthModal,
}) => {
  const [selectedItemIds, setSelectedItemIds] = React.useState<
    Record<string, boolean>
  >({});
  const [newItemName, setNewItemName] = React.useState("");
  const [newItemQty, setNewItemQty] = React.useState("");
  const [newItemCat, setNewItemCat] =
    React.useState<PantryItem["category"]>("Produce");
  const [expiryDays, setExpiryDays] = React.useState<string>("5");

  // Select all items by default on initial render
  React.useEffect(() => {
    const initial: Record<string, boolean> = {};
    items.forEach((item) => (initial[item.id] = true));
    setSelectedItemIds(initial);
  }, [items]);

  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddPantryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      onOpenAuthModal();
      return;
    }
    if (!newItemName.trim()) return;

    const newItem: PantryItem = {
      id: `p-${Date.now()}`,
      name: newItemName.trim(),
      quantity: newItemQty.trim() || "1 item",
      category: newItemCat,
      expiryDays: parseInt(expiryDays) || undefined,
    };

    onAddItem(newItem);
    setNewItemName("");
    setNewItemQty("");
  };

  const handleTriggerCook = () => {
    const selectedNames = items
      .filter((i) => selectedItemIds[i.id])
      .map((i) => `${i.name} (${i.quantity})`);

    onCookWithPantry(selectedNames);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {!authUser && (
        <div className="bg-[#FAF9F5] border border-[#D47A5F]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#D47A5F]/10 rounded-xl text-[#D47A5F]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#1C1C1C]">
                Authentication Required for Smart Pantry Sync:
              </span>
              <span className="text-[#575752] ml-1">
                Sign in or create an account to save pantry items and
                synchronize inventory with Cloud Firestore.
              </span>
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
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="serif-heading text-2xl font-bold tracking-tight">
                Smart Pantry & Fridge Inventory
              </h2>
              <p className="text-xs text-[#E8E6DC] font-sans">
                Log available ingredients to generate zero-waste personalized
                recipes
              </p>
            </div>
          </div>

          <button
            onClick={handleTriggerCook}
            className="px-5 py-2.5 bg-[#D47A5F] hover:bg-[#B55F46] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            Cook with Pantry Ingredients
          </button>
        </div>
      </div>

      {/* Add New Item Form */}
      <div className="bg-white p-5 rounded-3xl border border-[#E5E3D8] shadow-xs">
        <h3 className="serif-heading text-sm font-bold uppercase tracking-wider text-[#1C1C1C] mb-3">
          Add Ingredient to Pantry
        </h3>
        <form
          onSubmit={handleAddPantryItem}
          className="grid grid-cols-1 sm:grid-cols-5 gap-3"
        >
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Ingredient name (e.g. Avocado)"
            className="sm:col-span-2 px-3.5 py-2 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
            required
          />

          <input
            type="text"
            value={newItemQty}
            onChange={(e) => setNewItemQty(e.target.value)}
            placeholder="Quantity (e.g. 500g, 4 items)"
            className="px-3.5 py-2 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
          />

          <select
            value={newItemCat}
            onChange={(e) => setNewItemCat(e.target.value as any)}
            className="px-3 py-2 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-xs font-semibold text-[#1C1C1C]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-[#5A5A40] hover:bg-[#42422F] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </form>
      </div>

      {/* Pantry Inventory List */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5E3D8] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E3D8]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#88886C]">
            Available Kitchen Stock ({items.length} items)
          </span>

          <button
            onClick={handleTriggerCook}
            className="text-xs font-bold text-[#5A5A40] hover:text-[#42422F] flex items-center gap-1"
          >
            Generate Recipe from Selected (
            {Object.values(selectedItemIds).filter(Boolean).length}) →
          </button>
        </div>

        {items.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3 bg-[#FAF9F5] border border-dashed border-[#E5E3D8] rounded-2xl">
            <div className="w-12 h-12 bg-[#5A5A40]/10 text-[#5A5A40] rounded-2xl flex items-center justify-center mx-auto border border-[#5A5A40]/20 shadow-xs">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="serif-heading font-bold text-base text-[#1C1C1C]">
              Your Smart Pantry is Fresh & Empty
            </h4>
            <p className="text-xs text-[#575752] max-w-sm mx-auto leading-relaxed">
              Start fresh! Add your available ingredients above. Any items you
              add will be saved{" "}
              {authUser ? "to your account" : "in your browser storage"}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => {
              const isSelected = !!selectedItemIds[item.id];
              const isExpiringSoon = item.expiryDays && item.expiryDays <= 3;

              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleSelect(item.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? "bg-[#FAF9F5] border-[#5A5A40] text-[#1C1C1C] shadow-2xs"
                      : "bg-[#F5F5F0] border-[#E5E3D8] text-[#575752] hover:border-[#5A5A40]/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                        isSelected
                          ? "bg-[#5A5A40] text-white"
                          : "border border-[#E5E3D8] bg-white"
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1C1C1C]">
                        {item.name}
                      </h4>
                      <span className="text-[11px] font-semibold text-[#5A5A40] block">
                        {item.quantity}
                      </span>
                      {isExpiringSoon && (
                        <span className="text-[10px] font-bold text-[#D47A5F] flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> Expires in{" "}
                          {item.expiryDays} days
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="p-1.5 text-[#88886C] hover:text-[#D47A5F] transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
