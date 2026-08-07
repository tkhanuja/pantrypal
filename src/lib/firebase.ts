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
import localConfig from "../../firebase-applet-config.json";

// Merge JSON config with Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    localConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId,
  firestoreDatabaseId: localConfig.firestoreDatabaseId || "default",
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
  // If databaseId is 'default', pass undefined so Firestore uses the primary default instance safely
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
