import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  updatePassword
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Full Firestore profile
  const [loading, setLoading] = useState(true);
  const idleTimerRef = useRef(null);

  // ─── Inactivity Timer ──────────────────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      console.warn("Session expired due to inactivity.");
      signOut(auth);
    }, IDLE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  // ─── Fetch Profile from Backend ───────────────────────────────────────────
  async function fetchUserProfile(firebaseUser) {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (e) {
      console.error("Error fetching profile from backend:", e);
      // Fallback: read Firestore directly
      try {
        const docRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data();
      } catch (_) {}
      return { role: "student", status: "active" };
    }
  }

  // ─── Auth State Listener ──────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        resetIdleTimer();
        const profile = await fetchUserProfile(user);
        localStorage.setItem("aspira_profile", JSON.stringify(profile));
        setUserRole(profile.role || "student");
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserProfile(null);
        localStorage.removeItem("aspira_profile");
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [resetIdleTimer]);

  // ─── Student Registration ─────────────────────────────────────────────────
  async function register(email, password, name) {
    // Validate password strength
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    if (!/\d/.test(password)) throw new Error("Password must contain at least one number.");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send email verification
    await firebaseSendEmailVerification(user);

    // Register in backend (Firestore)
    await axios.post(`${BACKEND_URL}/api/auth/register`, {
      uid: user.uid,
      name,
      email,
      role: "student"
    });

    setUserRole("student");
    setUserProfile({ role: "student", status: "pending_survey", name, email });
    return user;
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred;
  }

  // ─── Password Reset ───────────────────────────────────────────────────────
  async function sendPasswordReset(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // ─── Change Password (for teacher forced reset) ───────────────────────────
  async function changePassword(newPassword) {
    if (!currentUser) throw new Error("Not authenticated.");
    if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
    if (!/\d/.test(newPassword)) throw new Error("Password must contain at least one number.");
    return updatePassword(currentUser, newPassword);
  }

  // ─── Resend Email Verification ────────────────────────────────────────────
  async function resendEmailVerification() {
    if (!currentUser) throw new Error("Not authenticated.");
    return firebaseSendEmailVerification(currentUser);
  }

  // ─── Mark Email Verified in Backend ──────────────────────────────────────
  async function markEmailVerified() {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      await axios.patch(
        `${BACKEND_URL}/api/auth/me/email-verified`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh local profile
      const profile = await fetchUserProfile(currentUser);
      localStorage.setItem("aspira_profile", JSON.stringify(profile));
      setUserProfile(profile);
    } catch (e) {
      console.error("Could not mark email verified:", e);
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  function logout() {
    setUserRole(null);
    setUserProfile(null);
    localStorage.removeItem("aspira_profile");
    return signOut(auth);
  }

  // ─── Refresh Profile ──────────────────────────────────────────────────────
  async function refreshProfile() {
    if (!currentUser) return;
    try {
      const profile = await fetchUserProfile(currentUser);
      localStorage.setItem("aspira_profile", JSON.stringify(profile));
      setUserProfile(profile);
      setUserRole(profile.role || "student");
    } catch (e) {
      console.error("Could not refresh profile:", e);
    }
  }

  // ─── Get Auth Token ───────────────────────────────────────────────────────
  async function getToken() {
    if (!currentUser) return null;
    return currentUser.getIdToken();
  }

  const value = {
    currentUser,
    userRole,
    userProfile,
    loading,
    register,
    login,
    logout,
    sendPasswordReset,
    changePassword,
    resendEmailVerification,
    markEmailVerified,
    getToken,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
