import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
} from "firebase/firestore";

// Read configuration from Vite environment variables (baked in at build time via Cloud Build)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "default",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Gracefully handle persistence across iframes / cross-origin published environments
setPersistence(auth, browserLocalPersistence).catch(() => {
  setPersistence(auth, browserSessionPersistence).catch(() => {
    setPersistence(auth, inMemoryPersistence).catch((err) => {
      console.warn("Auth persistence fallback warning:", err);
    });
  });
});

let firestoreInstance;
try {
  const dbId = firebaseConfig.firestoreDatabaseId;
  const validDbId = dbId && dbId !== "default" ? dbId : undefined;

  firestoreInstance = initializeFirestore(
    app,
    { localCache: memoryLocalCache() },
    validDbId,
  );
} catch (e) {
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;
