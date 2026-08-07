import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { initializeFirestore, getFirestore, memoryLocalCache } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Gracefully handle persistence across iframes / cross-origin published environments
setPersistence(auth, browserLocalPersistence).catch(() => {
  setPersistence(auth, browserSessionPersistence).catch(() => {
    setPersistence(auth, inMemoryPersistence).catch((err) => {
      console.warn('Auth persistence fallback warning:', err);
    });
  });
});

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    { localCache: memoryLocalCache() },
    firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
      ? firebaseConfig.firestoreDatabaseId
      : undefined
  );
} catch (e) {
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;

