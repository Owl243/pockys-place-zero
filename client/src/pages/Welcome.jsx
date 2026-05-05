import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

// ─── Config de opciones ──────────────────────────────────────────────────────
const OPTIONS = [
    {
        id: "inventory",
        icon: "bi-box-seam-fill",
        emoji: "📦",
        title: "Gestionar mi colección",
        subtitle: "Coleccionista",
        description: "Registra las cartas que tienes, arma tu wishlist y lleva el control de tu colección.",
        benefits: ["Busca cualquier carta del TCG", "Agrégala a tu inventario", "Márcalas como en venta"],
        color: "#10b981",
        colorRgb: "16,185,129",
        route: "/search",
        tabParam: null
    },
    {
        id: "sell",
        icon: "bi-tag-fill",
        emoji: "💰",
        title: "Quiero vender cartas",
        subtitle: "Vendedor",
        description: "Encuentra compradores potenciales viendo lo que la comunidad está buscando activamente.",
        benefits: ["Ve la demanda en tiempo real", "Contacta compradores interesados", "Publica tu inventario"],
        color: "#f59e0b",
        colorRgb: "245,158,11",
        route: "/?tab=tendencias",
        tabParam: "tendencias"
    },
    {
        id: "buy",
        icon: "bi-bag-heart-fill",
        emoji: "🛒",
        title: "Quiero conseguir cartas",
        subtitle: "Comprador",
        description: "Explora lo que otros coleccionistas están poniendo en venta hoy mismo.",
        benefits: ["Feed de ventas actualizado", "Vendedores verificados primero", "Chat directo sin intermediarios"],
        color: "#ff4b91",
        colorRgb: "255,75,145",
        route: "/?tab=ventas",
        tabParam: "ventas"
    }
];

// ─── Tarjeta de opción ────────────────────────────────────────────────────────
function OptionCard({ opt, index, selected, onSelect }) {
    const isSelected = selected === opt.id;
    const delay = `${index * 0.12}s`;

    return (
        <button
            className="btn text-start w-100 p-0 border-0"
            style={{ animationDelay: delay, animationFillMode: "both" }}
            onClick={() => onSelect(opt.id)}
        >
            <div
                className="rounded-4 p-4 h-100 position-relative overflow-hidden"
                style={{
                    background: isSelected
                        ? `rgba(${opt.colorRgb},0.12)`
                        : "rgba(255,255,255,0.03)",
                    border: isSelected
                        ? `1.5px solid rgba(${opt.colorRgb},0.5)`
                        : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isSelected
                        ? `0 0 30px rgba(${opt.colorRgb},0.15), 0 8px 30px rgba(0,0,0,0.2)`
                        : "0 4px 20px rgba(0,0,0,0.1)",
                    transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                    cursor: "pointer"
                }}
            >
                {/* Glow de fondo cuando seleccionado */}
                {isSelected && (
                    <div className="position-absolute" style={{
                        width: "150px", height: "150px",
                        background: `radial-gradient(circle, rgba(${opt.colorRgb},0.2) 0%, transparent 70%)`,
                        top: "-30px", right: "-30px", pointerEvents: "none"
                    }} />
                )}

                <div className="d-flex align-items-start gap-3 position-relative">
                    {/* Icono */}
                    <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                        style={{
                            width: "52px", height: "52px",
                            background: `rgba(${opt.colorRgb},${isSelected ? "0.2" : "0.08"})`,
                            border: `1px solid rgba(${opt.colorRgb},${isSelected ? "0.4" : "0.2"})`,
                            transition: "all 0.25s"
                        }}>
                        <i className={`bi ${opt.icon}`} style={{ color: opt.color, fontSize: "1.4rem" }} />
                    </div>

                    <div className="flex-grow-1 min-w-0">
                        {/* Badge de tipo */}
                        <span className="badge rounded-pill mb-1 d-inline-block"
                            style={{
                                background: `rgba(${opt.colorRgb},0.15)`,
                                color: opt.color,
                                border: `1px solid rgba(${opt.colorRgb},0.3)`,
                                fontSize: "0.6rem", letterSpacing: "0.5px", fontWeight: 700
                            }}>
                            {opt.subtitle.toUpperCase()}
                        </span>

                        <p className="fw-bold text-white mb-1" style={{ fontSize: "1rem", lineHeight: 1.3 }}>
                            {opt.title}
                        </p>
                        <p className="mb-3" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", lineHeight: 1.5 }}>
                            {opt.description}
                        </p>

                        {/* Lista de beneficios */}
                        <div className="d-flex flex-column gap-1">
                            {opt.benefits.map((b, i) => (
                                <div key={i} className="d-flex align-items-center gap-2">
                                    <div className="rounded-circle flex-shrink-0"
                                        style={{
                                            width: "5px", height: "5px",
                                            background: isSelected ? opt.color : "rgba(255,255,255,0.2)"
                                        }} />
                                    <span style={{
                                        fontSize: "0.75rem",
                                        color: isSelected ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)"
                                    }}>
                                        {b}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Check mark */}
                    <div className="flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                            width: "24px", height: "24px",
                            background: isSelected ? opt.color : "rgba(255,255,255,0.05)",
                            border: `1.5px solid ${isSelected ? opt.color : "rgba(255,255,255,0.1)"}`,
                            transition: "all 0.2s"
                        }}>
                        {isSelected && <i className="bi bi-check text-white" style={{ fontSize: "0.8rem", fontWeight: 800 }} />}
                    </div>
                </div>
            </div>
        </button>
    );
}

// ─── Pantalla de confirmación animada ─────────────────────────────────────────
function ConfirmScreen({ opt, onGo }) {
    const [count, setCount] = useState(3);

    useEffect(() => {
        if (count <= 0) { onGo(); return; }
        const t = setTimeout(() => setCount(c => c - 1), 700);
        return () => clearTimeout(t);
    }, [count]);

    const pct = ((3 - count) / 3) * 100;

    return (
        <div className="d-flex flex-column align-items-center justify-content-center text-center py-5"
            style={{ minHeight: "60vh" }}>

            {/* Icono animado */}
            <div className="position-relative mb-4">
                <div className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                        width: "100px", height: "100px",
                        background: `rgba(${opt.colorRgb},0.12)`,
                        border: `2px solid rgba(${opt.colorRgb},0.4)`,
                        boxShadow: `0 0 40px rgba(${opt.colorRgb},0.2)`
                    }}>
                    <i className={`bi ${opt.icon}`} style={{ color: opt.color, fontSize: "2.5rem" }} />
                </div>
                {/* Ring de progreso */}
                <svg className="position-absolute" style={{ top: "-4px", left: "-4px", width: "108px", height: "108px" }}>
                    <circle cx="54" cy="54" r="50"
                        fill="none"
                        stroke={opt.color}
                        strokeWidth="2"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                        strokeLinecap="round"
                        transform="rotate(-90 54 54)"
                        style={{ transition: "stroke-dashoffset 0.7s linear" }}
                    />
                </svg>
            </div>

            <div className="badge rounded-pill mb-3 px-3 py-2"
                style={{ background: `rgba(${opt.colorRgb},0.12)`, color: opt.color, border: `1px solid rgba(${opt.colorRgb},0.25)`, fontSize: "0.7rem" }}>
                {opt.subtitle.toUpperCase()}
            </div>

            <h3 className="fw-bold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
                {opt.title}
            </h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                Preparando tu experiencia...
            </p>

            <button
                className="btn mt-3 rounded-pill px-4 py-2 fw-bold text-white"
                style={{ background: opt.color, border: "none", fontSize: "0.85rem" }}
                onClick={onGo}
            >
                Ir ahora →
            </button>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Welcome() {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(null);
    const [confirmed, setConfirmed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Trigger entrada animada
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    const handleSelect = (id) => {
        setSelected(id);
    };

    const handleContinue = async () => {
        if (!selected) return;
        const opt = OPTIONS.find(o => o.id === selected);

        // Guardar intención en Firestore
        try {
            const user = auth.currentUser;
            if (user) {
                await updateDoc(doc(db, "users", user.uid), {
                    intentType: selected,
                    onboardingCompleted: true
                });
            }
        } catch (e) {
            // Si el doc no existe todavía, ignorar silenciosamente
        }

        setConfirmed(true);
    };

    const handleGo = () => {
        const opt = OPTIONS.find(o => o.id === selected);
        // Para rutas que van al feed (/, /?tab=...) pasamos fromWelcome
        navigate(opt.route, { state: { fromWelcome: true } });
    };

    const selectedOpt = OPTIONS.find(o => o.id === selected);

    return (
        <div style={{ minHeight: "85vh", padding: "0 1rem" }}>

            {/* Pantalla de confirmación */}
            {confirmed && selectedOpt ? (
                <ConfirmScreen opt={selectedOpt} onGo={handleGo} />
            ) : (
                <div
                    className="mx-auto"
                    style={{
                        maxWidth: "560px",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(16px)",
                        transition: "opacity 0.4s ease, transform 0.4s ease"
                    }}
                >
                    {/* Header */}
                    <div className="text-center py-4 mb-2">
                        <div className="d-inline-flex align-items-center gap-2 mb-3 px-3 py-1 rounded-pill"
                            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", fontSize: "0.75rem", color: "#10b981" }}>
                            <i className="bi bi-stars" />
                            Cuenta creada exitosamente
                        </div>
                        <h2 className="fw-bold text-white mb-1" style={{ fontSize: "clamp(1.4rem,4vw,1.9rem)", letterSpacing: "-0.025em" }}>
                            ¿Qué quieres hacer en{" "}
                            <span style={{ color: "#10b981" }}>Pocky's Place</span>?
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                            Elige tu perfil — puedes cambiarlo cuando quieras.
                        </p>
                    </div>

                    {/* Tarjetas */}
                    <div className="d-flex flex-column gap-3 mb-4">
                        {OPTIONS.map((opt, i) => (
                            <OptionCard
                                key={opt.id}
                                opt={opt}
                                index={i}
                                selected={selected}
                                onSelect={handleSelect}
                            />
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="d-flex align-items-center gap-3">
                        <button
                            className="btn rounded-pill py-3 fw-bold flex-grow-1 text-white"
                            style={{
                                background: selected
                                    ? `linear-gradient(135deg, ${selectedOpt?.color}, ${selected === "inventory" ? "#059669" : selected === "sell" ? "#d97706" : "#db2777"})`
                                    : "rgba(255,255,255,0.07)",
                                border: selected ? "none" : "1px solid rgba(255,255,255,0.1)",
                                boxShadow: selected ? `0 4px 20px rgba(${selectedOpt?.colorRgb},0.3)` : "none",
                                fontSize: "0.95rem",
                                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                                opacity: selected ? 1 : 0.5
                            }}
                            disabled={!selected}
                            onClick={handleContinue}
                        >
                            {selected
                                ? <><i className="bi bi-arrow-right-circle-fill me-2" />Continuar con: {selectedOpt?.subtitle}</>
                                : "Selecciona una opción"}
                        </button>

                        <button
                            className="btn rounded-pill py-3 px-4"
                            style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", border: "1px solid rgba(255,255,255,0.07)" }}
                            onClick={() => navigate("/")}
                            title="Explorar sin elegir"
                        >
                            Omitir
                        </button>
                    </div>

                    {/* Nota de privacidad */}
                    <p className="text-center mt-3" style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem" }}>
                        <i className="bi bi-shield-lock me-1" />
                        Tu preferencia se guarda de forma privada y puedes cambiarla desde tu perfil.
                    </p>

                </div>
            )}

            <style>{`
                .text-emerald { color: #10b981 !important; }

                @keyframes slide-up-fade {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
