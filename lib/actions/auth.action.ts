// lib/actions/auth.action.ts - COMPLETE FULL CODE
"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Check if Firebase Admin is available
function isFirebaseAvailable() {
  return !!(auth && db);
}

// Set session cookie
export async function setSessionCookie(idToken: string) {
  try {
    if (!isFirebaseAvailable()) return;

    const cookieStore = await cookies();
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION * 1000,
    });

    cookieStore.set("session", sessionCookie, {
      maxAge: SESSION_DURATION,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
  } catch {
    // Ignore errors
  }
}

export async function signUp(params: any) {
  try {
    if (!isFirebaseAvailable()) {
      return { success: false, message: "System error" };
    }

    const { uid, name, email } = params;
    const userRecord = await db.collection("users").doc(uid).get();

    if (userRecord.exists) {
      return { success: false, message: "User already exists" };
    }

    await db.collection("users").doc(uid).set({
      name,
      email,
      createdAt: new Date().toISOString(),
    });

    return { success: true, message: "Account created" };
  } catch {
    return { success: false, message: "Failed to create account" };
  }
}

export async function signIn(params: any) {
  try {
    if (!isFirebaseAvailable()) {
      return { success: false, message: "System error" };
    }

    const { email, idToken } = params;
    const userRecord = await auth.getUserByEmail(email);

    if (!userRecord) {
      return { success: false, message: "User does not exist" };
    }

    await setSessionCookie(idToken);
    return { success: true, message: "Signed in", userId: userRecord.uid };
  } catch {
    return { success: false, message: "Failed to sign in" };
  }
}

export async function signOut() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
  } catch {
    // Ignore
  }
}

// Get current user from session cookie
export async function getCurrentUser() {
  try {
    if (!isFirebaseAvailable()) return null;

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) return null;

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const userRecord = await db.collection("users").doc(decodedClaims.uid).get();

    if (!userRecord.exists) {
      // Create user record if missing
      await db.collection("users").doc(decodedClaims.uid).set({
        name: decodedClaims.name || "User",
        email: decodedClaims.email || "",
        createdAt: new Date().toISOString(),
      });

      const newRecord = await db.collection("users").doc(decodedClaims.uid).get();
      return { id: newRecord.id, ...newRecord.data() };
    }

    return { id: userRecord.id, ...userRecord.data() };
  } catch {
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated() {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch {
    return false;
  }
}

// Alternative simple auth check
export async function checkAuthSimple() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    return !!sessionCookie;
  } catch {
    return false;
  }
}

export async function getInterviewById(id: string) {
  try {
    if (!isFirebaseAvailable()) return null;

    const interview = await db.collection("interviews").doc(id).get();
    return interview.exists ? interview.data() : null;
  } catch {
    return null;
  }
}

export async function getFeedbackByInterviewId(params: any) {
  try {
    if (!isFirebaseAvailable()) return null;

    const { interviewId, userId } = params;
    const querySnapshot = await db.collection("feedback")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch {
    return null;
  }
}

export async function getInterviewsByUserId(userId?: string) {
  try {
    if (!userId || !isFirebaseAvailable()) return [];

    const interviews = await db.collection("interviews")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return interviews.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch {
    return [];
  }
}

export async function getLatestInterviews(params: any) {
  try {
    const { userId, limit = 20 } = params;
    if (!userId || !isFirebaseAvailable()) return [];

    const interviews = await db.collection("interviews")
      .where("finalized", "==", true)
      .where("userId", "!=", userId)
      .orderBy("userId")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return interviews.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch {
    return [];
  }
}