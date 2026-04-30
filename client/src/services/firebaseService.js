import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { addNotification } from "./notificationService";

export const processRequest = async (cardName, currentUserId) => {
    const inventorySnapshot = await getDocs(collection(db, "inventory"));

    for (const userDoc of inventorySnapshot.docs) {
        const userId = userDoc.id;

        if (userId === currentUserId) continue;

        const cardsSnapshot = await getDocs(
            collection(db, "inventory", userId, "cards")
        );

        cardsSnapshot.forEach(async (doc) => {
            const card = doc.data();

            if (card.name.toLowerCase() === cardName.toLowerCase() && card.inInventory) {
                await addNotification(userId, {
                    type: "match",
                    message: `Alguien busca ${card.name}`,
                    cardName,
                });
            }
        });
    }
};

// guardar request (búsqueda)
export const addRequest = async (name) => {
    await addDoc(collection(db, "requests"), {
        name,
        createdAt: new Date(),
    });
};