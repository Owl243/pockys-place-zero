import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";

import { auth } from "../firebase";

// 📝 Registro
export const register = async (email, password) => {
    return await createUserWithEmailAndPassword(auth, email, password);
};

// 🔐 Login
export const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
};

// 🚪 Logout
export const logout = async () => {
    return await signOut(auth);
};