import { db } from "../firebase";
import { 
    collection, 
    addDoc, 
    serverTimestamp,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    doc
} from "firebase/firestore";

const TRANSACTIONS_COLLECTION = "feed"; // Usamos feed para evitar errores de permisos de nueva colección
const TICKET_ACTION = "admin_ticket";

/**
 * Crea un ticket de transacción para ser gestionado por administradores
 * y actualiza el estado de la publicación a pending_admin automáticamente
 */
export const createTransactionTicket = async (data) => {
    try {
        await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
            ...data,
            action: TICKET_ACTION,
            status: data.status || "pending",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            timestamp: serverTimestamp(), // Requerido por el listener del feed
        });

        // Marcar la publicación como "En tratos" inmediatamente
        if (data.listingId) {
            const listingRef = doc(db, "listings", data.listingId);
            await updateDoc(listingRef, {
                status: "pending_admin",
                updatedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error creating transaction ticket:", error);
        throw error;
    }
};

/**
 * Escucha las transacciones (para administradores)
 */
export const listenAllTransactions = (callback) => {
    const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where("action", "==", TICKET_ACTION),
        orderBy("timestamp", "desc")
    );
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
        console.warn("Permisos insuficientes para ver tickets globales.");
        callback([]);
    });
};

/**
 * Actualiza el estado de una transacción y opcionalmente de la publicación
 */
export const updateTransactionStatus = async (ticketId, status, listingId = null) => {
    try {
        const ticketRef = doc(db, TRANSACTIONS_COLLECTION, ticketId);
        await updateDoc(ticketRef, {
            status,
            updatedAt: serverTimestamp()
        });

        if (listingId) {
            const listingRef = doc(db, "listings", listingId);
            // Si el admin concreta la venta, la publicación se marca como vendida (o se borra si prefieres)
            // Aquí la marcaremos con un status especial
            await updateDoc(listingRef, {
                status: status === "completed" ? "sold" : (status === "cancelled" ? "available" : "pending_admin")
            });
        }
    } catch (error) {
        console.error("Error updating transaction status:", error);
        throw error;
    }
};

/**
 * Escucha las transacciones de un usuario específico (comprador o vendedor)
 */
export const listenUserTransactions = (userId, callback) => {
    const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where("participants", "array-contains", userId),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};
