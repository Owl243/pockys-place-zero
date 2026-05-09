import { db } from "../firebase";
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    collectionGroup,
    where,
    getDocs,
    serverTimestamp,
    doc,
    updateDoc
} from "firebase/firestore";

// ➕ crear notificación
export const addNotification = async (userId, data) => {
    await addDoc(collection(db, "notifications", userId, "items"), {
        ...data,
        read: false,
        createdAt: serverTimestamp(),
    });
};

// 👂 escuchar en tiempo real
export const listenNotifications = (userId, callback) => {
    const q = query(
        collection(db, "notifications", userId, "items"),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        callback(data);
    }, (error) => {
        // Error de permisos
    });
};

// ✔️ Marcar como leída
export const markAsRead = async (userId, notifId) => {
    try {
        const notifRef = doc(db, "notifications", userId, "items", notifId);
        await updateDoc(notifRef, { read: true });
    } catch (error) {
        // Ignorar silenciosamente
    }
};

export const updateNotificationStatus = async (userId, notifId, data) => {
    const notifRef = doc(db, "notifications", userId, "items", notifId);
    await updateDoc(notifRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
};

export const createSaleOfferNotification = async (sellerId, { item, offerAmount, offerCurrency, offerUser }) => {
    const itemTitle = item.cardName || item.name || "Articulo";
    await addNotification(sellerId, {
        type: "sale_offer",
        title: "Nueva oferta",
        message: `Alguien ofrece ${offerAmount} ${offerCurrency} por tu publicacion: ${itemTitle}`,
        cardImage: item.cardImage || item.image || item.images?.small || "",
        link: "/activity",
        status: "pending",
        offerAmount,
        offerCurrency,
        offerFromId: offerUser.uid,
        offerFromName: offerUser.displayName || offerUser.email.split("@")[0],
        offerFromPhoto: offerUser.photoURL || "",
        listingOwnerId: sellerId,
        listingId: item.id || "",
        listingTitle: itemTitle
    });
};

export const createOfferAcceptedNotification = async (buyerId, { itemTitle, amount, currency, sellerUser, cardImage }) => {
    await addNotification(buyerId, {
        type: "sale_offer_accepted",
        title: "Oferta aceptada",
        message: `${sellerUser.displayName || sellerUser.email.split("@")[0]} acepto tu oferta de ${amount} ${currency} por: ${itemTitle}`,
        cardImage: cardImage || "",
        link: "/activity",
        status: "accepted",
        itemTitle,
        amount,
        currency,
        sellerId: sellerUser.uid,
        sellerName: sellerUser.displayName || sellerUser.email.split("@")[0],
        sellerPhoto: sellerUser.photoURL || ""
    });
};

export const createCounterOfferNotification = async (buyerId, { itemTitle, amount, currency, sellerUser, cardImage }) => {
    await addNotification(buyerId, {
        type: "sale_counter_offer",
        title: "Contraoferta recibida",
        message: `${sellerUser.displayName || sellerUser.email.split("@")[0]} envio una contraoferta de ${amount} ${currency} por: ${itemTitle}`,
        cardImage: cardImage || "",
        link: "/activity",
        status: "countered",
        itemTitle,
        amount,
        currency,
        sellerId: sellerUser.uid,
        sellerName: sellerUser.displayName || sellerUser.email.split("@")[0],
        sellerPhoto: sellerUser.photoURL || ""
    });
};

// 🔔 Notificar a usuarios con esta carta en su wishlist
export const notifyWishlistUsers = async (sellerId, card) => {
    try {
        // IMPORTANTE: Esto requiere un índice de 'collectionGroup' en Firebase Console.
        // Si ves un error con un link en la consola, HAZ CLIC en él para crear el índice.
        const q = query(
            collectionGroup(db, "cards"),
            where("inWishlist", "==", true),
            where("name", "==", card.name) 
        );

        const snapshot = await getDocs(q);
        
        const notifications = [];
        snapshot.forEach((docSnap) => {
            // El path es inventory/{userId}/cards/{cardId}
            const userId = docSnap.ref.parent.parent.id;
            
            // No notificarse a uno mismo
            if (userId !== sellerId) {
                notifications.push(addNotification(userId, {
                    type: 'wishlist_match',
                    title: '¡Deseo encontrado!',
                    message: `Alguien puso en venta a ${card.name}, ¡está en tu wishlist!`,
                    cardImage: card.images?.small || card.image || "",
                    cardId: card.id,
                    link: '/'
                }));
            }
        });

        await Promise.all(notifications);
    } catch (error) {
        // Ignorar o manejar silenciosamente
    }
};
