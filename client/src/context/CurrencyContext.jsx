import React, { createContext, useContext, useState } from "react";

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    const [currency] = useState("MXN");

    const formatPrice = (mxnAmount) => {
        if (mxnAmount === null || mxnAmount === undefined || Number.isNaN(Number(mxnAmount))) {
            return null;
        }
        return `$${Number(mxnAmount).toLocaleString("es-MX", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} MXN`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, formatPrice }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);
