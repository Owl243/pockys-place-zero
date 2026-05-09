export const ROLE_THEMES = {
    inventory: {
        primary: "#3b82f6",
        primaryDark: "#2563eb",
        rgb: "59, 130, 246",
    },
    sell: {
        primary: "#10b981",
        primaryDark: "#059669",
        rgb: "16, 185, 129",
    },
    buy: {
        primary: "#f59e0b",
        primaryDark: "#d97706",
        rgb: "245, 158, 11",
    },
};

export const DEFAULT_ROLE = "sell";

export function getThemeByRole(role) {
    return ROLE_THEMES[role] || ROLE_THEMES[DEFAULT_ROLE];
}

export function applyTheme(role) {
    if (typeof document === "undefined") return;

    const theme = getThemeByRole(role);

    document.documentElement.style.setProperty("--pocky-primary", theme.primary);
    document.documentElement.style.setProperty("--pocky-primary-dark", theme.primaryDark);
    document.documentElement.style.setProperty("--pocky-primary-rgb", theme.rgb);
    document.documentElement.style.setProperty("--pocky-glow", `rgba(${theme.rgb}, 0.35)`);
}
