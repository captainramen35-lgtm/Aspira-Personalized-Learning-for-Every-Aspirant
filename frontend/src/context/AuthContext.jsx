import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up a new user and register role in Firestore + Backend
  async function register(email, password, name, role) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user metadata in client Firestore collection "users"
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      name,
      email,
      role,
      enrolled: role === "student" ? "Not Enrolled" : "JEE/NEET Morning Batch",
      joined_date: "July 2026"
    });

    // Notify FastAPI backend of new user registration
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
    await axios.post(`${backendUrl}/api/auth/register`, {
      uid: user.uid,
      name,
      email,
      role
    });

    setUserRole(role);
    return user;
  }

  // Login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout
  function logout() {
    setUserRole(null);
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Fetch role from backend /api/auth/me
        try {
          const token = await user.getIdToken();
          const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
          const res = await axios.get(`${backendUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserRole(res.data.role);
        } catch (e) {
          console.error("Error fetching user role from backend:", e);
          setUserRole("student");
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    register,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
