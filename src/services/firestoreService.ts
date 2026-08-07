import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile, Recipe, MealPlanEntry, PantryItem, AdHocOverride } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function verifyAuthUser(userId: string) {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('User is not authenticated. Operation intercepted.');
  }
}

// User Profile & System Prompts Settings: users/{userId}/profile/settings
export const saveUserProfileToFirestore = async (userId: string, profile: UserProfile) => {
  verifyAuthUser(userId);
  const path = `users/${userId}/profile/settings`;
  try {
    const settingsRef = doc(db, 'users', userId, 'profile', 'settings');
    await setDoc(settingsRef, { ...profile, userId, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const getUserProfileFromFirestore = async (userId: string): Promise<UserProfile | null> => {
  verifyAuthUser(userId);
  const path = `users/${userId}/profile/settings`;
  try {
    const settingsRef = doc(db, 'users', userId, 'profile', 'settings');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
  return null;
};

// Saved Recipes: users/{userId}/saved_recipes/{recipeId}
export const subscribeToUserRecipes = (
  userId: string,
  callback: (recipes: Recipe[]) => void
) => {
  verifyAuthUser(userId);
  const path = `users/${userId}/saved_recipes`;
  const recipesRef = collection(db, 'users', userId, 'saved_recipes');
  return onSnapshot(recipesRef, (snapshot) => {
    const recipes: Recipe[] = [];
    snapshot.forEach((docSnap) => {
      recipes.push({ ...(docSnap.data() as Recipe), id: docSnap.id });
    });
    callback(recipes);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, path);
  });
};

export const saveRecipeToFirestore = async (userId: string, recipe: Recipe) => {
  verifyAuthUser(userId);
  if (!auth.currentUser) {
    console.error("Firestore write failed: No authenticated user");
    throw new Error('User is not authenticated.');
  }
  const path = `users/${auth.currentUser.uid}/saved_recipes/${recipe.id}`;
  try {
    const recipeRef = doc(db, 'users', auth.currentUser.uid, 'saved_recipes', recipe.id);
    await setDoc(recipeRef, { ...recipe, userId: auth.currentUser.uid, updatedAt: new Date().toISOString() }, { merge: true });
    console.log("Firestore write succeeded for user:", auth.currentUser.uid);
  } catch (error) {
    console.error("Firestore write failed:", error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteRecipeFromFirestore = async (userId: string, recipeId: string) => {
  verifyAuthUser(userId);
  const path = `users/${userId}/saved_recipes/${recipeId}`;
  try {
    const recipeRef = doc(db, 'users', userId, 'saved_recipes', recipeId);
    await deleteDoc(recipeRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

// Meal Plans: users/{userId}/meal_plans/{planId}
export const subscribeToMealPlan = (
  userId: string,
  callback: (entries: MealPlanEntry[]) => void
) => {
  verifyAuthUser(userId);
  const path = `users/${userId}/meal_plans`;
  const mealPlanRef = collection(db, 'users', userId, 'meal_plans');
  return onSnapshot(mealPlanRef, (snapshot) => {
    const entries: MealPlanEntry[] = [];
    snapshot.forEach((docSnap) => {
      entries.push({ ...(docSnap.data() as MealPlanEntry), id: docSnap.id });
    });
    callback(entries);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, path);
  });
};

export const saveMealPlanEntryToFirestore = async (userId: string, entry: MealPlanEntry) => {
  verifyAuthUser(userId);
  if (!auth.currentUser) {
    console.error("Firestore write failed: No authenticated user");
    throw new Error('User is not authenticated.');
  }
  const path = `users/${auth.currentUser.uid}/meal_plans/${entry.id}`;
  try {
    const entryRef = doc(db, 'users', auth.currentUser.uid, 'meal_plans', entry.id);
    await setDoc(entryRef, entry, { merge: true });
    console.log("Firestore write succeeded for user:", auth.currentUser.uid);
  } catch (error) {
    console.error("Firestore write failed:", error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteMealPlanEntryFromFirestore = async (userId: string, entryId: string) => {
  verifyAuthUser(userId);
  const path = `users/${userId}/meal_plans/${entryId}`;
  try {
    const entryRef = doc(db, 'users', userId, 'meal_plans', entryId);
    await deleteDoc(entryRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

// Pantry Items: users/{userId}/pantry_items/{itemId}
export const subscribeToPantryItems = (
  userId: string,
  callback: (items: PantryItem[]) => void
) => {
  verifyAuthUser(userId);
  const path = `users/${userId}/pantry_items`;
  const pantryRef = collection(db, 'users', userId, 'pantry_items');
  return onSnapshot(pantryRef, (snapshot) => {
    const items: PantryItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ ...(docSnap.data() as PantryItem), id: docSnap.id });
    });
    callback(items);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, path);
  });
};

export const savePantryItemToFirestore = async (userId: string, item: PantryItem) => {
  verifyAuthUser(userId);
  if (!auth.currentUser) {
    console.error("Firestore write failed: No authenticated user");
    throw new Error('User is not authenticated.');
  }
  const path = `users/${auth.currentUser.uid}/pantry_items/${item.id}`;
  try {
    const itemRef = doc(db, 'users', auth.currentUser.uid, 'pantry_items', item.id);
    await setDoc(itemRef, item, { merge: true });
    console.log("Firestore write succeeded for user:", auth.currentUser.uid);
  } catch (error) {
    console.error("Firestore write failed:", error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deletePantryItemFromFirestore = async (userId: string, itemId: string) => {
  verifyAuthUser(userId);
  const path = `users/${userId}/pantry_items/${itemId}`;
  try {
    const itemRef = doc(db, 'users', userId, 'pantry_items', itemId);
    await deleteDoc(itemRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

// AdHoc Override / System Prompt overrides: users/{userId}/profile/adhoc
export const saveAdHocOverrideToFirestore = async (userId: string, override: AdHocOverride) => {
  verifyAuthUser(userId);
  const path = `users/${userId}/profile/adhoc`;
  try {
    const overrideRef = doc(db, 'users', userId, 'profile', 'adhoc');
    await setDoc(overrideRef, override, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const getAdHocOverrideFromFirestore = async (userId: string): Promise<AdHocOverride | null> => {
  verifyAuthUser(userId);
  const path = `users/${userId}/profile/adhoc`;
  try {
    const overrideRef = doc(db, 'users', userId, 'profile', 'adhoc');
    const snap = await getDoc(overrideRef);
    if (snap.exists()) {
      return snap.data() as AdHocOverride;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
  return null;
};
