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


// Read configuration securely from Vite build environment variables
declare global {
  interface Window {
    __FIREBASE_CONFIG__?: {
      apiKey?: string;
      authDomain?: string;
      projectId?: string;
      storageBucket?: string;
      messagingSenderId?: string;
      appId?: string;
    };
  }
}

const firebaseConfig = {
  apiKey:
    window.__FIREBASE_CONFIG__?.apiKey ||
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyAO3xx6mnITcD9h6GDk7qhzpQMvSiswSVk",
  authDomain:
    window.__FIREBASE_CONFIG__?.authDomain ||
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "pantry-pal-66ed8.firebaseapp.com",
  projectId:
    window.__FIREBASE_CONFIG__?.projectId ||
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    "pantry-pal-66ed8",
  storageBucket:
    window.__FIREBASE_CONFIG__?.storageBucket ||
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "pantry-pal-66ed8.firebasestorage.app",
  messagingSenderId:
    window.__FIREBASE_CONFIG__?.messagingSenderId ||
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    "557285061653",
  appId:
    window.__FIREBASE_CONFIG__?.appId ||
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:557285061653:web:d777e9405d61032bab8a1c",
};

export { firebaseConfig };
console.log("DEBUG API KEY:", import.meta.env.VITE_FIREBASE_API_KEY);
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
