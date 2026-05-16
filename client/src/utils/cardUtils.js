/**
 * Obtiene el precio de mercado de una carta de forma segura.
 */
export const getPriceRaw = (card) => {
    if (!card) return null;
    
    // 1. Intentar rutas estándar de TCGPlayer
    const tcg = card.tcgplayer?.prices || card.cardPriceData?.prices || card.prices;
    
    if (tcg) {
        const standardTypes = ['holofoil', 'normal', 'reverseHolofoil', 'unlimitedHolofoil'];
        for (const type of standardTypes) {
            if (tcg[type]?.market) return tcg[type].market;
        }

        // Buscar cualquier valor numérico que parezca un precio si no hay 'market'
        for (const key in tcg) {
            if (tcg[key]?.market) return tcg[key].market;
            if (tcg[key]?.directLow) return tcg[key].directLow;
            if (tcg[key]?.low) return tcg[key].low;
        }
    }

    // 2. Fallback a Cardmarket
    const cm = card.cardmarket?.prices;
    if (cm) {
        return cm.averageSellPrice || cm.lowPrice || cm.trendPrice || null;
    }

    return null;
};

export const getDisplayName = (card) => {
    if (!card) return "";
    return card.customName || card.cardName || card.name || "";
};

export const getDisplayPriceMxn = (card) => {
    if (!card) return null;
    if (typeof card.customPriceMxn === "number") return card.customPriceMxn;
    if (typeof card.priceMxn === "number") return card.priceMxn;
    return null;
};

/**
 * Normaliza un número de carta para ordenamiento natural.
 */
export const normalizeCardNumber = (num) => {
    if (!num) return "00000";
    const match = num.match(/\d+/);
    return match ? match[0].padStart(5, '0') : num.padStart(5, '0');
};
