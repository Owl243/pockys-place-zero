import { db } from "../firebase";
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    serverTimestamp,
    setDoc,
    doc,
    getDoc
} from "firebase/firestore";

/**
 * Genera un ID único para un chat entre dos usuarios (ordenado alfabéticamente)
 */
const getChatId = (uid1, uid2) => {
    return [uid1, uid2].sort().join("_");
};

/**
 * Inicia un chat o recupera uno existente y envía un mensaje inicial si es necesario
 */
export const startChat = async (currentUser, targetUser, initialMessage = "") => {
    if (!currentUser?.uid || !targetUser?.id) {
        throw new Error("UID de usuario actual o destino no proporcionado");
    }

    if (currentUser.uid === targetUser.id) {
        console.warn("No puedes iniciar un chat contigo mismo");
        return null;
    }

    try {
        const chatId = getChatId(currentUser.uid, targetUser.id);
        const chatRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);

        // Si el chat no existe, lo creamos
        if (!chatSnap.exists()) {
            await setDoc(chatRef, {
                participants: [currentUser.uid, targetUser.id],
                participantData: {
                    [currentUser.uid]: {
                        name: currentUser.displayName || currentUser.email.split("@")[0],
                        photo: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'U'}&background=random`
                    },
                    [targetUser.id]: {
                        name: targetUser.name || "Usuario",
                        photo: targetUser.photo || `https://ui-avatars.com/api/?name=${targetUser.name || 'U'}&background=random`
                    }
                },
                lastMessage: initialMessage,
                lastUpdate: serverTimestamp(),
                unread: {
                    [targetUser.id]: true
                }
            });
        }

        // Si hay un mensaje inicial, lo añadimos a la subcolección
        if (initialMessage) {
            await addDoc(collection(chatRef, "messages"), {
                senderId: currentUser.uid,
                text: initialMessage,
                timestamp: serverTimestamp()
            });
            
            // Actualizamos el último mensaje en el doc principal
            await setDoc(chatRef, { 
                lastMessage: initialMessage, 
                lastUpdate: serverTimestamp() 
            }, { merge: true });
        }

        return chatId;
    } catch (error) {
        console.error("Error en startChat:", error);
        throw error;
    }
};

/**
 * Lista de emails de admin en memoria (se carga una vez desde Firestore)
 */
let _dynamicAdminEmails = new Set();

/**
 * Carga la lista de admins dinámicos desde Firestore
 * Llama esta función al inicio de la app
 */
export const loadDynamicAdmins = async () => {
    try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("../firebase");
        const snap = await getDoc(doc(db, "config", "admins"));
        if (snap.exists()) {
            _dynamicAdminEmails = new Set(snap.data().emails || []);
        }
    } catch (e) {
        // silencioso si no hay permisos
    }
};

/**
 * Verifica si un usuario es administrador
 * (email hardcodeado como master admin, o admin dinámico desde Firestore)
 */
export const isAdmin = (user) => {
    if (!user?.email) return false;
    return user.email === "iaan@gmail.com" || _dynamicAdminEmails.has(user.email);
};

/**
 * Verifica si un usuario es PRO
 * (admin también es PRO por defecto)
 */
export const isPro = (user) => {
    return isAdmin(user);
};

/**
 * Escucha la lista de chats de un usuario
 */
export const listenUserChats = (user, callback) => {
    if (!user?.uid) {
        callback([]);
        return () => {};
    }

    const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid)
    );

    return onSnapshot(q, (snapshot) => {
        const chats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // ORDENAMIENTO LOCAL (Evita el requerimiento de Índice Compuesto en Firebase)
        chats.sort((a, b) => {
            const timeA = a.lastUpdate?.toMillis ? a.lastUpdate.toMillis() : 0;
            const timeB = b.lastUpdate?.toMillis ? b.lastUpdate.toMillis() : 0;
            return timeB - timeA;
        });

        callback(chats);
    }, (error) => {
        console.error("Error escuchando chats:", error);
        callback([]);
    });
};

/**
 * Envía un mensaje en un chat específico
 */
export const sendMessage = async (chatId, senderId, text) => {
    const chatRef = doc(db, "chats", chatId);
    
    await addDoc(collection(chatRef, "messages"), {
        senderId,
        text,
        timestamp: serverTimestamp()
    });

    await setDoc(chatRef, {
        lastMessage: text,
        lastUpdate: serverTimestamp()
    }, { merge: true });
};

/**
 * Escucha los mensajes de un chat
 */
export const listenMessages = (chatId, callback) => {
    const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    });
};
