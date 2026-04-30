const KEY = "tcg_data";
const REQUESTS_KEY = "tcg_requests";
const CHAT_KEY = "tcg_chat";

export const getChats = () => {
    return JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
};

export const addMessage = (cardName, message) => {
    let chats = getChats();

    chats.push({
        cardName,
        message,
        date: new Date().toISOString(),
    });

    localStorage.setItem(CHAT_KEY, JSON.stringify(chats));
};

export const getRequests = () => {
    return JSON.parse(localStorage.getItem(REQUESTS_KEY)) || [];
};

export const addRequest = (name) => {
    let requests = getRequests();

    // evitar duplicados recientes
    const exists = requests.find((r) => r.name === name);

    if (!exists) {
        requests.push({
            name,
            date: new Date().toISOString(),
        });
    }

    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
};

export const getData = () => {
    return JSON.parse(localStorage.getItem(KEY)) || [];
};

export const saveData = (data) => {
    localStorage.setItem(KEY, JSON.stringify(data));
};

export const toggleCard = (card, type) => {
    let data = getData();

    const index = data.findIndex((c) => c.id === card.id);

    if (index === -1) {
        data.push({
            id: card.id,
            name: card.name,
            image: card.images.small,
            inInventory: type === "inventory",
            inWishlist: type === "wishlist",
            forSale: false,
        });
    } else {
        if (type === "inventory") {
            data[index].inInventory = !data[index].inInventory;
        }

        if (type === "wishlist") {
            data[index].inWishlist = !data[index].inWishlist;
        }

        if (type === "sale") {
            data[index].forSale = !data[index].forSale;
        }
    }

    saveData(data);
    return data;
};