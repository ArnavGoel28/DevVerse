import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Public Firebase web config. These values are safe to expose in the browser.
// Set them in .env.local (see .env.example) and in App Hosting (apphosting.yaml).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let auth: Auth | null = null;

/** Returns Firebase Auth, or null when the Firebase env vars are missing. */
export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured) return null;
  if (!auth) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
  return auth;
}
