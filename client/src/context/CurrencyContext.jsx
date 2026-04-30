import React, { createContext, useContext, useState } from "react";

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState(() => {
        return localStorage.getItem("user_currency") || "USD";
    });

    const exchangeRate = 18.50; // Tipo de cambio aproximado

    const formatPrice = (usdAmount) => {
        if (!usdAmount) return null;
        if (currency === "MXN") {
            return `$${(usdAmount * exchangeRate).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
        }
        return `$${usdAmount.toFixed(2)} USD`;
    };

    const toggleCurrency = () => {
        const next = currency === "USD" ? "MXN" : "USD";
        setCurrency(next);
        localStorage.setItem("user_currency", next);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, toggleCurrency, formatPrice }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);
