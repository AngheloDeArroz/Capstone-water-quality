
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
// To enable Authentication or Storage, uncomment the imports and exports below
// import { getAuth } from 'firebase/auth';
// import { getStorage } from 'firebase/storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

// Attempt to enable offline persistence
if (typeof window !== 'undefined') { // Ensure this only runs in the browser
  enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED })
    .then(() => {
      console.log("Firestore offline persistence enabled successfully.");
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // This can happen if multiple tabs are open, as persistence can only be enabled in one tab at a time.
        console.warn("Firestore offline persistence failed: Multiple tabs open or other precondition not met. App will still work online, but offline capabilities might be limited.");
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence.
        console.warn("Firestore offline persistence failed: Browser does not support required features. App will still work online, but offline capabilities might be limited.");
      } else {
        console.error("Firestore offline persistence failed with error: ", err);
      }
    });
}

// const auth = getAuth(app);
// const storage = getStorage(app);

export { app, db /*, auth, storage */ };
