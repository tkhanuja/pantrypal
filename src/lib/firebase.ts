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
    window.__FIREBASE_CONFIG__?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:
    window.__FIREBASE_CONFIG__?.authDomain ||
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:
    window.__FIREBASE_CONFIG__?.projectId ||
    import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:
    window.__FIREBASE_CONFIG__?.storageBucket ||
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    window.__FIREBASE_CONFIG__?.messagingSenderId ||
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:
    window.__FIREBASE_CONFIG__?.appId || import.meta.env.VITE_FIREBASE_APP_ID,
};
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
