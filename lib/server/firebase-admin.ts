import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Server access to Firebase. Bypasses security rules — only use from server routes.
// Locally: FIREBASE_SERVICE_ACCOUNT = the service-account JSON on one line.
// On Firebase App Hosting: credentials are automatic (no env var needed).

function getAdminApp(): App | null {
  const existing = getApps()[0];
  if (existing) return existing;
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) return initializeApp({ credential: cert(JSON.parse(sa)) });
  if (process.env.K_SERVICE || process.env.FIREBASE_CONFIG) return initializeApp();
  return null;
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.K_SERVICE || process.env.FIREBASE_CONFIG);
}

export function adminAuth(): Auth {
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin is not configured (FIREBASE_SERVICE_ACCOUNT).");
  return getAuth(app);
}

let db: Firestore | null = null;

export function adminDb(): Firestore {
  if (db) return db;
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin is not configured (FIREBASE_SERVICE_ACCOUNT).");
  db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true }); // optional fields may be undefined
  return db;
}
