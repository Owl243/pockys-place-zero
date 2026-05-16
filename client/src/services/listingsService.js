import { db } from "../firebase";
import {
    addDoc,
    collection,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from "firebase/firestore";
import { isPro } from "./chatService";

const LISTINGS_COLLECTION = "listings";

const normalizeListingPayload = (user, card, overrides = {}) => {
    const title = overrides.title || card.customName || card.name || "Articulo";
    const priceMxn = overrides.priceMxn ?? card.customPriceMxn ?? null;

    return {
        ownerId: user.uid,
        ownerName: user.displayName || user.email.split("@")[0],
        ownerPhoto: user.photoURL || "",
        userId: user.uid,
        userName: user.displayName || user.email.split("@")[0],
        userPhoto: user.photoURL || "",
        isPro: isPro(user),
        inventoryCardId: card.id,
        title,
        customName: title,
        priceMxn: priceMxn === "" ? null : priceMxn,
        customPriceMxn: priceMxn === "" ? null : priceMxn,
        cardName: card.name || "",
        cardNumber: card.number || "",
        cardRarity: card.rarity || "",
        cardSetName: card.set?.name || card.setName || "",
        cardImage: card.images?.small || card.image || card.cardImage || "",
        cardPriceData: card.tcgplayer || card.cardPriceData || null,
        deliveryPrefs: overrides.deliveryPrefs || card.deliveryPrefs || [],
        status: overrides.status || "active",
        updatedAt: serverTimestamp(),
        createdAt: overrides.createdAt || serverTimestamp()
    };
};

export const createListing = async (user, card, overrides = {}) => {
    const payload = normalizeListingPayload(user, card, overrides);
    const existingQuery = query(
        collection(db, LISTINGS_COLLECTION),
        where("ownerId", "==", user.uid),
        where("inventoryCardId", "==", card.id),
        where("status", "==", "active"),
        limit(1)
    );
    const existing = await getDocs(existingQuery);

    if (!existing.empty) {
        const listingRef = doc(db, LISTINGS_COLLECTION, existing.docs[0].id);
        await updateDoc(listingRef, {
            ...payload,
            createdAt: existing.docs[0].data().createdAt || serverTimestamp()
        });
        return { id: existing.docs[0].id, ...existing.docs[0].data(), ...payload };
    }

    const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), payload);
    return { id: docRef.id, ...payload };
};

export const closeListingByInventoryCard = async (ownerId, inventoryCardId) => {
    const q = query(
        collection(db, LISTINGS_COLLECTION),
        where("ownerId", "==", ownerId),
        where("inventoryCardId", "==", inventoryCardId),
        where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map((listingDoc) => updateDoc(doc(db, LISTINGS_COLLECTION, listingDoc.id), {
        status: "closed",
        updatedAt: serverTimestamp()
    })));
};

export const updateListingFromInventoryCard = async (ownerId, card) => {
    const q = query(
        collection(db, LISTINGS_COLLECTION),
        where("ownerId", "==", ownerId),
        where("inventoryCardId", "==", card.id),
        where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map((listingDoc) => updateDoc(doc(db, LISTINGS_COLLECTION, listingDoc.id), {
        title: card.customName || card.name || "Articulo",
        customName: card.customName || card.name || "Articulo",
        priceMxn: card.customPriceMxn ?? null,
        customPriceMxn: card.customPriceMxn ?? null,
        cardName: card.name || "",
        cardNumber: card.number || "",
        cardRarity: card.rarity || "",
        cardSetName: card.setName || card.set?.name || "",
        cardImage: card.image || card.images?.small || "",
        cardPriceData: card.tcgplayer || card.cardPriceData || null,
        deliveryPrefs: card.deliveryPrefs || [],
        updatedAt: serverTimestamp()
    })));
};

export const listenActiveListings = (callback) => {
    const q = query(
        collection(db, LISTINGS_COLLECTION),
        where("status", "in", ["active", "pending_admin"]),
        orderBy("updatedAt", "desc"),
        limit(40)
    );

    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((listingDoc) => ({
            id: listingDoc.id,
            ...listingDoc.data()
        })));
    });
};

export const listenUserListings = (ownerId, callback) => {
    const q = query(
        collection(db, LISTINGS_COLLECTION),
        where("ownerId", "==", ownerId),
        orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((listingDoc) => ({
            id: listingDoc.id,
            ...listingDoc.data()
        })));
    });
};
