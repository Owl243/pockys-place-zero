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
    writeBatch,
    doc
} from "firebase/firestore";

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
export const postToFeed = async (userId, userName, userPhoto, action, card) => {
    try {
        await addDoc(collection(db, FEED_COLLECTION), {
            userId,
            userName: userName || "Coleccionista",
            userPhoto: userPhoto || "https://via.placeholder.com/40",
            action, // 'sale', 'message', 'sale_finished', etc.
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
            userPhoto: userPhoto || "https://via.placeholder.com/40",
            action: 'message',
            message: text,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending message to feed:", error);
    }
};
