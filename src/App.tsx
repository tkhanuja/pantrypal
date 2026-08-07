import React, { useEffect, useState } from "react";
import {
  UserProfile,
  AdHocOverride,
  Recipe,
  MealPlanEntry,
  PantryItem,
} from "./types";
import {
  DEFAULT_PROFILES,
  INITIAL_AD_HOC_OVERRIDE,
  INITIAL_SAVED_RECIPES,
  INITIAL_PANTRY_ITEMS,
  INITIAL_MEAL_PLAN,
} from "./data/initialData";
import { Navbar, ActiveTab } from "./components/Navbar";
import { ChatInterface } from "./components/ChatInterface";
import { ProfileSettings } from "./components/ProfileSettings";
import { RecipeBook } from "./components/RecipeBook";
import { MealPlanner } from "./components/MealPlanner";
import { PantryInventory } from "./components/PantryInventory";
import { AdHocOverrideModal } from "./components/AdHocOverrideModal";
import { AuthModal } from "./components/AuthModal";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  subscribeToUserRecipes,
  saveRecipeToFirestore,
  deleteRecipeFromFirestore,
  subscribeToMealPlan,
  saveMealPlanEntryToFirestore,
  deleteMealPlanEntryFromFirestore,
  subscribeToPantryItems,
  savePantryItemToFirestore,
  deletePantryItemFromFirestore,
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  saveAdHocOverrideToFirestore,
  getAdHocOverrideFromFirestore,
} from "./services/firestoreService";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // User-scoped state initialized without localStorage reliance
  const [profiles, setProfiles] = useState<UserProfile[]>(DEFAULT_PROFILES);
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(
    DEFAULT_PROFILES[0],
  );
  const [adHocOverride, setAdHocOverride] = useState<AdHocOverride>(
    INITIAL_AD_HOC_OVERRIDE,
  );
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [isAdHocModalOpen, setIsAdHocModalOpen] = useState(false);

  // Handle Firebase Auth state changes & real-time Firestore sync
  useEffect(() => {
    let unsubRecipes: (() => void) | null = null;
    let unsubMealPlan: (() => void) | null = null;
    let unsubPantry: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);

      // Clean up prior subscriptions
      if (unsubRecipes) {
        unsubRecipes();
        unsubRecipes = null;
      }
      if (unsubMealPlan) {
        unsubMealPlan();
        unsubMealPlan = null;
      }
      if (unsubPantry) {
        unsubPantry();
        unsubPantry = null;
      }

      if (user) {
        // Synchronize Firestore data for the logged-in user under users/{user.uid}/...
        const firestoreProfile = await getUserProfileFromFirestore(user.uid);
        if (firestoreProfile) {
          setCurrentProfile(firestoreProfile);
        } else {
          // Initialize and save profile settings under users/{user.uid}/profile/settings
          const defaultProf =
            profiles.find((p) => p.name === "Balanced") ||
            profiles[0] ||
            DEFAULT_PROFILES[0];
          const initialUserProf: UserProfile = {
            ...defaultProf,
            id: user.uid,
            email: user.email || "user@pantrypal.app",
          };
          saveUserProfileToFirestore(user.uid, initialUserProf);
          setCurrentProfile(initialUserProf);
        }

        const firestoreAdHoc = await getAdHocOverrideFromFirestore(user.uid);
        if (firestoreAdHoc) {
          setAdHocOverride(firestoreAdHoc);
        }

        // Real-time Firestore subscriptions for recipes, meal plans, and pantry items
        unsubRecipes = subscribeToUserRecipes(user.uid, (recipes) => {
          setSavedRecipes(recipes);
        });

        unsubMealPlan = subscribeToMealPlan(user.uid, (entries) => {
          setMealPlan(entries);
        });

        unsubPantry = subscribeToPantryItems(user.uid, (items) => {
          setPantryItems(items);
        });
      } else {
        // Unauthenticated visitor: reset user state (no local storage persistence for recipes, pantry, meal plans)
        setSavedRecipes([]);
        setMealPlan([]);
        setPantryItems([]);
        setCurrentProfile(DEFAULT_PROFILES[0]);
        setAdHocOverride(INITIAL_AD_HOC_OVERRIDE);
      }
    });

    return () => {
      if (unsubRecipes) unsubRecipes();
      if (unsubMealPlan) unsubMealPlan();
      if (unsubPantry) unsubPantry();
      unsubscribeAuth();
    };
  }, []);

  // Handlers with strict authentication checks
  const handleSaveRecipe = (recipe: Recipe) => {
    // Intercept action if user is not signed in
    if (!auth.currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const currentUserId = auth.currentUser.uid;
    // Save directly to Cloud Firestore: users/${currentUserId}/saved_recipes/${recipe.id}
    saveRecipeToFirestore(currentUserId, recipe);

    setSavedRecipes((prev) => {
      const exists = prev.some(
        (r) => r.id === recipe.id || r.title === recipe.title,
      );
      if (exists) {
        return prev.map((r) =>
          r.id === recipe.id || r.title === recipe.title ? recipe : r,
        );
      }
      return [recipe, ...prev];
    });
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (!auth.currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const currentUserId = auth.currentUser.uid;
    deleteRecipeFromFirestore(currentUserId, recipeId);
    setSavedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    if (!auth.currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const currentUserId = auth.currentUser.uid;
    setProfiles((prev) =>
      prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p)),
    );
    setCurrentProfile(updatedProfile);
    saveUserProfileToFirestore(currentUserId, updatedProfile);
  };

  const handleCreateProfile = (newProfile: UserProfile) => {
    if (!auth.currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const currentUserId = auth.currentUser.uid;
    setProfiles((prev) => [...prev, newProfile]);
    setCurrentProfile(newProfile);
    saveUserProfileToFirestore(currentUserId, newProfile);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (!auth.currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (profiles.length <= 1) return;
    setProfiles((prev) => {
      const updated = prev.filter((p) => p.id !== profileId);
      if (currentProfile.id === profileId && updated.length > 0) {
        setCurrentProfile(updated[0]);
      }
      return updated;
    });
  };

  const handleAddMealPlanEntry = (entry: MealPlanEntry) => {
    if (!auth.currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const currentUserId = auth.currentUser.uid;
    setMealPlan((prev) => [...prev, entry]);
    saveMealPlanEntryToFirestore(currentUserId, entry);
  };

  const handleScheduleRecipe = (
    recipe: Recipe,
    selectedDays: string[],
    mealType: string,
  ) => {
    if (!auth.currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const currentUserId = auth.currentUser.uid;
    const newEntries: MealPlanEntry[] = [];
    selectedDays.forEach((day, index) => {
      const entry: MealPlanEntry = {
        id: `mp-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        dayOfWeek: day as any,
        mealType: mealType as any,
        recipe,
      };
      newEntries.push(entry);
      saveMealPlanEntryToFirestore(currentUserId, entry);
    });
    setMealPlan((prev) => [...prev, ...newEntries]);
  };

  const handleRemoveMealPlanEntry = (entryId: string) => {
    if (!auth.currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const currentUserId = auth.currentUser.uid;
    setMealPlan((prev) => prev.filter((e) => e.id !== entryId));
    deleteMealPlanEntryFromFirestore(currentUserId, entryId);
  };

  const handleAddPantryItem = (item: PantryItem) => {
    if (!auth.currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const currentUserId = auth.currentUser.uid;
    setPantryItems((prev) => [item, ...prev]);
    savePantryItemToFirestore(currentUserId, item);
  };

  const handleDeletePantryItem = (itemId: string) => {
    if (!auth.currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const currentUserId = auth.currentUser.uid;
    setPantryItems((prev) => prev.filter((i) => i.id !== itemId));
    deletePantryItemFromFirestore(currentUserId, itemId);
  };

  const handleSaveAdHocOverride = (updated: AdHocOverride) => {
    if (!auth.currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const currentUserId = auth.currentUser.uid;
    setAdHocOverride(updated);
    saveAdHocOverrideToFirestore(currentUserId, updated);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAuthUser(null);
  };

  const handleCookWithPantry = (selectedIngredients: string[]) => {
    setActiveTab("chat");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans text-[#1C1C1C] antialiased selection:bg-[#5A5A40] selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profiles={profiles}
        currentProfile={currentProfile}
        setCurrentProfile={setCurrentProfile}
        adHocOverride={adHocOverride}
        onOpenAdHocModal={() => setIsAdHocModalOpen(true)}
        savedRecipesCount={savedRecipes.length}
        authUser={authUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Tab Content */}
      <main className="pb-12">
        {activeTab === "chat" && (
          <ChatInterface
            userProfile={currentProfile}
            adHocOverride={adHocOverride}
            onOpenAdHocModal={() => setIsAdHocModalOpen(true)}
            onSaveRecipe={handleSaveRecipe}
            savedRecipes={savedRecipes}
            onAddToMealPlan={(rec) => {
              handleScheduleRecipe(rec, ["Monday"], "Dinner");
            }}
            onScheduleRecipe={handleScheduleRecipe}
            authUser={authUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === "recipe_book" && (
          <RecipeBook
            recipes={savedRecipes}
            userProfile={currentProfile}
            onDeleteRecipe={handleDeleteRecipe}
            onSaveRecipe={handleSaveRecipe}
            onAddToMealPlan={(rec) => {
              handleScheduleRecipe(rec, ["Monday"], "Dinner");
            }}
            onScheduleRecipe={handleScheduleRecipe}
            authUser={authUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === "profile" && (
          <ProfileSettings
            profiles={profiles}
            currentProfile={currentProfile}
            onUpdateProfile={handleUpdateProfile}
            onCreateProfile={handleCreateProfile}
            onSelectProfile={setCurrentProfile}
            onDeleteProfile={handleDeleteProfile}
            authUser={authUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === "planner" && (
          <MealPlanner
            mealPlan={mealPlan}
            savedRecipes={savedRecipes}
            onAddMealPlanEntry={handleAddMealPlanEntry}
            onRemoveMealPlanEntry={handleRemoveMealPlanEntry}
            authUser={authUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === "pantry" && (
          <PantryInventory
            items={pantryItems}
            onAddItem={handleAddPantryItem}
            onDeleteItem={handleDeletePantryItem}
            onCookWithPantry={handleCookWithPantry}
            authUser={authUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Ad-Hoc Scenario Override Modal */}
      <AdHocOverrideModal
        isOpen={isAdHocModalOpen}
        onClose={() => setIsAdHocModalOpen(false)}
        override={adHocOverride}
        onSave={handleSaveAdHocOverride}
      />

      {/* Auth Modal for Sign In / Registration */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
