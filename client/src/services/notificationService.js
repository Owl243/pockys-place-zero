import { db } from "../firebase";
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy
} from "firebase/firestore";

// ➕ crear notificación
export const addNotification = async (userId, data) => {
    await addDoc(collection(db, "notifications", userId, "items"), {
        ...data,
        createdAt: new Date(),
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
    });
};