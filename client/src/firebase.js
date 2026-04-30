import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyALwmlxnPaOBx9qNayYD37GNBmRsZmLDTA",
    authDomain: "tcg-marketplace-66c61.firebaseapp.com",
    projectId: "tcg-marketplace-66c61",
    storageBucket: "tcg-marketplace-66c61.appspot.com",
    messagingSenderId: "81930694811",
    appId: "1:81930694811:web:77d985c36548131b32963e",
    measurementId: "G-9LBJRWF4ZF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);