import { db } from "../firebase";
import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    limit, 
    onSnapshot,
    serverTimestamp,
    where,
    getDocs,
    getDoc,
    writeBatch,
    doc
} from "firebase/firestore";
import { notifyWishlistUsers } from "./notificationService";
import { isPro } from "./chatService";

const FEED_COLLECTION = "feed";

// 🔄 Actualizar nombre y foto de un usuario en todos sus posts del feed
export const updateUserInFeed = async (userId, updates) => {
    try {
        const q = query(collection(db, FEED_COLLECTION), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        querySnapshot.forEach((document) => {
            const docRef = doc(db, FEED_COLLECTION, document.id);
            batch.update(docRef, updates);
        });
        
        await batch.commit();
    } catch (error) {
        console.error("Error updating user in feed:", error);
    }
};

// 📝 Crear una publicación en el feed
export const postToFeed = async (userId, userName, userPhoto, action, card, userObj = null) => {
    try {
        let deliveryPrefs = [];
        try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                deliveryPrefs = userDoc.data().deliveryPrefs || [];
            }
        } catch (e) {
            console.error("Error fetching delivery prefs:", e);
        }

        await addDoc(collection(db, FEED_COLLECTION), {
            userId,
            userName: userName || "Coleccionista",
            userPhoto: userPhoto || `https://ui-avatars.com/api/?name=${userName}&background=random`,
            isPro: userObj ? isPro(userObj) : false,
            deliveryPrefs,
            action,
            cardName: card?.name || null,
            cardNumber: card?.number || "",
            cardRarity: card?.rarity || "",
            cardSetName: card?.set?.name || card?.setName || "",
            cardImage: card?.images?.small || card?.image || null,
            cardPriceData: card?.tcgplayer || null,
            timestamp: serverTimestamp(),
            message: action === 'sale' ? `ha puesto en venta a ${card.name}!` : 
                     action === 'sale_finished' ? `ha finalizado la venta de ${card.name}` : null
        });

        if (action === 'sale') {
            await notifyWishlistUsers(userId, card);
        }
    } catch (error) {
        console.error("Error posting to feed:", error);
    }
};

// 📡 Escuchar cambios en el feed (tiempo real)
export const subscribeToFeed = (callback) => {
    const q = query(
        collection(db, FEED_COLLECTION), 
        orderBy("timestamp", "desc"), 
        limit(50)
    );
    
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(items);
    });
};

// 💬 Enviar un mensaje al feed (Chat global)
export const sendFeedMessage = async (userId, userName, userPhoto, text) => {
    try {
        await addDoc(collection(db, FEED_COLLECTION), {
            userId,
            userName: userName || "Coleccionista",
            userPhoto: userPhoto || `https://ui-avatars.com/api/?name=${userName}&background=random`,
            action: 'message',
            message: text,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending message to feed:", error);
    }
};

// 💗 Publicar wishlist al feed comunitario
export const postWishlistPublic = async (userId, userName, userPhoto, card) => {
    try {
        // Evitar duplicados: verificar si ya existe para este userId + cardId
        const existing = query(
            collection(db, FEED_COLLECTION),
            where("userId", "==", userId),
            where("action", "==", "wishlist_public"),
            where("cardId", "==", card.id)
        );
        const snap = await getDocs(existing);
        if (!snap.empty) return; // ya está publicado

        await addDoc(collection(db, FEED_COLLECTION), {
            userId,
            userName: userName || "Coleccionista",
            userPhoto: userPhoto || `https://ui-avatars.com/api/?name=${userName}&background=random`,
            action: "wishlist_public",
            cardId: card.id,
            cardName: card.name || null,
            cardNumber: card.number || "",
            cardRarity: card.rarity || "",
            cardSetName: card.set?.name || card.setName || "",
            cardImage: card.images?.small || card.image || null,
            cardPriceData: card.tcgplayer || null,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error posting wishlist to feed:", error);
    }
};

// 🗑️ Retirar wishlist del feed comunitario
export const removeWishlistPublic = async (userId, cardId) => {
    try {
        const q = query(
            collection(db, FEED_COLLECTION),
            where("userId", "==", userId),
            where("action", "==", "wishlist_public"),
            where("cardId", "==", cardId)
        );
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.forEach(d => batch.delete(doc(db, FEED_COLLECTION, d.id)));
        await batch.commit();
    } catch (error) {
        console.error("Error removing wishlist from feed:", error);
    }
};
