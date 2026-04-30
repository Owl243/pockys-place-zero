import { db } from "../firebase";
import {
    doc,
    setDoc,
    deleteDoc,
    collection,
    getDocs,
} from "firebase/firestore";

// ➕ agregar o actualizar carta
export const saveCard = async (userId, card, data) => {
    const ref = doc(db, "inventory", userId, "cards", card.id);

    await setDoc(ref, {
        name: card.name,
        image: card.images.small,
        ...data,
    });
};

// ❌ eliminar carta
export const removeCard = async (userId, cardId) => {
    await deleteDoc(doc(db, "inventory", userId, "cards", cardId));
};

// 📦 obtener inventario
export const getInventory = async (userId) => {
    const snapshot = await getDocs(
        collection(db, "inventory", userId, "cards")
    );

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
};