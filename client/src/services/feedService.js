import { db } from "../firebase";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    where,
    writeBatch
} from "firebase/firestore";
import { notifyWishlistUsers } from "./notificationService";
import { isPro } from "./chatService";
import { getDisplayName, getDisplayPriceMxn } from "../utils/cardUtils";

const FEED_COLLECTION = "feed";

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

export const postToFeed = async (userId, userName, userPhoto, action, card, userObj = null, extras = {}) => {
    try {
        if (action === "sale") {
            const q = query(
                collection(db, FEED_COLLECTION),
                where("userId", "==", userId),
                where("action", "==", "sale"),
                where("cardId", "==", card.id)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                const batch = writeBatch(db);
                snap.forEach((feedDoc) => {
                    batch.update(doc(db, FEED_COLLECTION, feedDoc.id), {
                        listingId: extras.listingId || card.listingId || null,
                        cardName: getDisplayName(card),
                        customName: card.customName || null,
                        cardNumber: card.number || "",
                        cardRarity: card.rarity || "",
                        cardSetName: card.set?.name || card.setName || "",
                        cardImage: card.images?.small || card.image || card.cardImage || null,
                        cardPriceData: card.tcgplayer || card.cardPriceData || null,
                        customPriceMxn: getDisplayPriceMxn(card),
                        message: `ha puesto en venta a ${getDisplayName(card)}!`,
                        timestamp: serverTimestamp()
                    });
                });
                await batch.commit();
                await notifyWishlistUsers(userId, card);
                return;
            }
        }

        if (action === "sale_finished") {
            const q = query(
                collection(db, FEED_COLLECTION),
                where("userId", "==", userId),
                where("action", "==", "sale"),
                where("cardId", "==", card.id)
            );
            const snap = await getDocs(q);
            const batch = writeBatch(db);
            snap.forEach((feedDoc) => batch.delete(doc(db, FEED_COLLECTION, feedDoc.id)));
            await batch.commit();
        }

        let deliveryPrefs = [];
        try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                deliveryPrefs = userDoc.data().deliveryPrefs || [];
            }
        } catch (error) {
            console.error("Error fetching delivery prefs:", error);
        }

        await addDoc(collection(db, FEED_COLLECTION), {
            userId,
            userName: userName || "Coleccionista",
            userPhoto: userPhoto || `https://ui-avatars.com/api/?name=${userName}&background=random`,
            isPro: userObj ? isPro(userObj) : false,
            deliveryPrefs,
            action,
            listingId: extras.listingId || card.listingId || null,
            cardId: card.id,
            cardName: getDisplayName(card),
            customName: card.customName || null,
            cardNumber: card.number || "",
            cardRarity: card.rarity || "",
            cardSetName: card.set?.name || card.setName || "",
            cardImage: card.images?.small || card.image || card.cardImage || null,
            cardPriceData: card.tcgplayer || card.cardPriceData || null,
            customPriceMxn: getDisplayPriceMxn(card),
            timestamp: serverTimestamp(),
            message: action === "sale"
                ? `ha puesto en venta a ${getDisplayName(card)}!`
                : action === "sale_finished"
                    ? `ha finalizado la venta de ${getDisplayName(card)}`
                    : null
        });

        if (action === "sale") {
            await notifyWishlistUsers(userId, card);
        }
    } catch (error) {
        console.error("Error posting to feed:", error);
    }
};

export const syncSaleFeedPost = async (userId, card, extras = {}) => {
    await postToFeed(userId, extras.userName, extras.userPhoto, "sale", card, extras.userObj || null, extras);
};

export const subscribeToFeed = (callback) => {
    const q = query(
        collection(db, FEED_COLLECTION),
        orderBy("timestamp", "desc"),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((feedDoc) => ({
            id: feedDoc.id,
            ...feedDoc.data()
        }));
        callback(items);
    });
};

export const sendFeedMessage = async (userId, userName, userPhoto, text) => {
    try {
        await addDoc(collection(db, FEED_COLLECTION), {
            userId,
            userName: userName || "Coleccionista",
            userPhoto: userPhoto || `https://ui-avatars.com/api/?name=${userName}&background=random`,
            action: "message",
            message: text,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending message to feed:", error);
    }
};

export const postWishlistPublic = async (userId, userName, userPhoto, card) => {
    try {
        const existing = query(
            collection(db, FEED_COLLECTION),
            where("userId", "==", userId),
            where("action", "==", "wishlist_public"),
            where("cardId", "==", card.id)
        );
        const snap = await getDocs(existing);
        if (!snap.empty) return;

        await addDoc(collection(db, FEED_COLLECTION), {
            userId,
            userName: userName || "Coleccionista",
            userPhoto: userPhoto || `https://ui-avatars.com/api/?name=${userName}&background=random`,
            action: "wishlist_public",
            message: `esta buscando a ${getDisplayName(card)}`,
            cardId: card.id,
            cardName: getDisplayName(card),
            customName: card.customName || null,
            cardNumber: card.number || "",
            cardRarity: card.rarity || "",
            cardSetName: card.set?.name || card.setName || "",
            cardImage: card.images?.small || card.image || card.cardImage || null,
            cardPriceData: card.tcgplayer || card.cardPriceData || null,
            customPriceMxn: getDisplayPriceMxn(card),
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error posting wishlist to feed:", error);
    }
};

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
        snap.forEach((feedDoc) => batch.delete(doc(db, FEED_COLLECTION, feedDoc.id)));
        await batch.commit();
    } catch (error) {
        console.error("Error removing wishlist from feed:", error);
    }
};
