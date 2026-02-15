// firebase/admin.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// 🔥 MODULE LOADED DEBUG
console.log("🔥 Module loaded: firebase/admin.ts");

// Global flag to track initialization across module reloads
let isFirebaseInitialized = false;

// DEBUG: Check environment variables at the very start
console.log("🔍 DEBUG - FIREBASE_CONFIG exists?", process.env.FIREBASE_CONFIG ? "YES" : "NO");
console.log("🔍 DEBUG - FIREBASE_CONFIG length:", process.env.FIREBASE_CONFIG?.length || 0);

console.log("🔥 [Firebase Admin] Initializing Firebase Admin SDK...");

function initFirebaseAdmin() {
  // Check if already initialized globally
  if (isFirebaseInitialized) {
    console.log("⚠️ Firebase already initialized globally, skipping re-initialization...");
    const auth = getAuth();
    const db = getFirestore();
    return { auth, db };
  }

  const apps = getApps();

  if (!apps.length) {
    console.log("🔥 [Firebase Admin] No Firebase app found, initializing new one...");

    // Try single config first (for Vercel)
    const firebaseConfig = process.env.FIREBASE_CONFIG;

    if (firebaseConfig) {
      console.log("✅ Found FIREBASE_CONFIG, using single config approach...");

      try {
        const serviceAccount = JSON.parse(firebaseConfig);

        // CRITICAL FIX: Handle private key newlines properly
        if (serviceAccount.private_key) {
          console.log("🔧 Fixing private key newlines...");
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        console.log("✅ Successfully parsed service account JSON");
        console.log("   - Project ID:", serviceAccount.project_id);
        console.log("   - Client Email:", serviceAccount.client_email);
        console.log("   - Private Key exists:", !!serviceAccount.private_key);
        console.log("   - Private Key starts with:", serviceAccount.private_key?.substring(0, 30));

        initializeApp({
          credential: cert(serviceAccount),
        });
        console.log("✅ [Firebase Admin] Initialized with FIREBASE_CONFIG");
      } catch (error) {
        console.error("❌ Failed to parse FIREBASE_CONFIG:", error.message);
        console.error("❌ Error details:", error);
        throw error;
      }
    } else {
      // Fallback to individual env vars (for local development)
      console.log("Using individual env vars approach...");
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      console.log("🔥 [Firebase Admin] Environment check:");
      console.log("   - FIREBASE_PROJECT_ID:", projectId ? `✅ (${projectId.substring(0, 10)}...)` : "❌ MISSING");
      console.log("   - FIREBASE_CLIENT_EMAIL:", clientEmail ? `✅ (${clientEmail})` : "❌ MISSING");
      console.log("   - FIREBASE_PRIVATE_KEY:", privateKey ? "✅ SET" : "❌ MISSING");

      if (!projectId || !clientEmail || !privateKey) {
        console.error("❌ [Firebase Admin] Missing required environment variables!");
        throw new Error("Firebase Admin environment variables are not set");
      }

      try {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
          }),
        });
        console.log("✅ [Firebase Admin] Firebase Admin SDK initialized successfully");
      } catch (error) {
        console.error("❌ [Firebase Admin] Failed to initialize Firebase Admin SDK:", error);
        throw error;
      }
    }
  } else {
    console.log("✅ [Firebase Admin] Using existing Firebase app");
  }

  const auth = getAuth();
  const db = getFirestore();

  console.log("✅ [Firebase Admin] Auth service initialized");
  console.log("✅ [Firebase Admin] Firestore service initialized");

  // 🔍 ADD STACK TRACE TO SEE WHAT'S CALLING THIS
  console.log("🔍 About to call db.settings() - STACK TRACE:");
  console.log(new Error().stack);

  // Apply settings right away
  db.settings({ ignoreUndefinedProperties: true });
  console.log("✅ [Firebase Admin] ignoreUndefinedProperties enabled");

  // Mark as initialized globally
  isFirebaseInitialized = true;
  console.log("🔒 Firebase global initialization flag set");

  return { auth, db };
}

// Export db and auth
export const { auth, db } = initFirebaseAdmin();

// Helper function for backward compatibility
export function getDB() {
  return db;
}