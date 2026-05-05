import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { db } from "../firebase";
import {
    collection, query, orderBy, limit, onSnapshot, where
} from "firebase/firestore";
import { getPriceRaw } from "../utils/cardUtils";
import { startChat } from "../services/chatService";

// ─── Auth Gate Modal ────────────────────────────────────────────────────────
function AuthGateModal({ onClose, onGoAuth }) {
    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 9999 }}
            onClick={onClose}
        >
            <div
                className="rounded-5 p-4 p-md-5 text-center position-relative overflow-hidden"
                style={{
                    maxWidth: "380px",
                    width: "90%",
                    background: "linear-gradient(145deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.98) 100%)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(16,185,129,0.08)"
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Glow */}
                <div className="position-absolute" style={{ width: "200px", height: "200px", background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)", top: "-50px", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />

                <div className="mb-4 position-relative">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{ width: "70px", height: "70px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
                        <i className="bi bi-lock-fill text-emerald fs-2" />
                    </div>
                    <h4 className="fw-bold text-white mb-2">Únete a Pocky's Place</h4>
                    <p className="text-white mb-0" style={{ opacity: 0.55, fontSize: "0.9rem", lineHeight: 1.6 }}>
                        Regístrate gratis para comprar, vender y conectar con coleccionistas.
                    </p>
                </div>

                <div className="d-flex flex-column gap-3">
                    <button
                        className="btn fw-bold rounded-pill py-3 text-white"
                        style={{
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
                            fontSize: "0.95rem"
                        }}
                        onClick={() => onGoAuth("register")}
                    >
                        <i className="bi bi-person-plus me-2" />
                        Crear cuenta gratis
                    </button>
                    <button
                        className="btn rounded-pill py-2 text-white"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontSize: "0.9rem" }}
                        onClick={() => onGoAuth("login")}
                    >
                        Ya tengo cuenta — Iniciar sesión
                    </button>
                </div>

                <button
                    className="position-absolute btn p-0 text-white"
                    style={{ top: "16px", right: "16px", opacity: 0.35, lineHeight: 1 }}
                    onClick={onClose}
                >
                    <i className="bi bi-x-lg" />
                </button>
            </div>
        </div>
    );
}

// ─── Card Sale Item ──────────────────────────────────────────────────────────
function SaleCard({ item, onInteract, user }) {
    const price = getPriceRaw(item.cardPriceData);

    const handleClaim = () => {
        if (!user) { onInteract(); return; }
        // logged user → start chat (handled by parent)
        onInteract(item, "claim");
    };

    return (
        <div
            className="rounded-4 overflow-hidden h-100"
            style={{
                background: "rgba(16,185,129,0.04)",
                border: "1px solid rgba(16,185,129,0.18)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.3), 0 0 20px rgba(16,185,129,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)"; }}
        >
            {/* Card image */}
            <div className="position-relative d-flex align-items-center justify-content-center p-3"
                style={{ background: "rgba(0,0,0,0.3)", minHeight: "180px" }}>
                <div className="position-absolute w-100 h-100" style={{ background: "radial-gradient(circle at center, rgba(16,185,129,0.08) 0%, transparent 70%)", top: 0, left: 0 }} />
                {item.cardImage
                    ? <img src={item.cardImage} alt={item.cardName}
                        style={{ height: "140px", objectFit: "contain", filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.5))" }}
                        className="position-relative" />
                    : <div className="text-white opacity-20"><i className="bi bi-image fs-1" /></div>
                }
                {/* PRO badge */}
                {item.isPro && (
                    <span className="position-absolute top-0 end-0 m-2 badge rounded-pill fw-bold"
                        style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", fontSize: "0.6rem", letterSpacing: "0.5px" }}>
                        ⭐ PRO
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="p-3 d-flex flex-column gap-2">
                <div>
                    <p className="fw-bold text-white mb-0 text-truncate" style={{ fontSize: "0.9rem" }}>{item.cardName}</p>
                    <p className="mb-0" style={{ fontSize: "0.65rem", color: "rgba(16,185,129,0.75)" }}>
                        #{item.cardNumber} · {item.cardSetName}
                    </p>
                </div>

                <div className="d-flex align-items-center justify-content-between gap-2">
                    {price
                        ? <span className="fw-bold" style={{ fontSize: "0.85rem", color: "#10b981" }}>
                            ${price.toFixed(2)} USD
                        </span>
                        : <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>Precio N/A</span>
                    }
                    <div className="d-flex align-items-center gap-1" style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)" }}>
                        <img
                            src={item.userPhoto && !item.userPhoto.includes("via.placeholder")
                                ? item.userPhoto
                                : `https://ui-avatars.com/api/?name=${item.userName || "U"}&background=random&size=24`}
                            style={{ width: "18px", height: "18px", borderRadius: "50%", objectFit: "cover" }}
                            alt=""
                        />
                        <span className="text-truncate" style={{ maxWidth: "70px" }}>{item.userName}</span>
                    </div>
                </div>

                {/* Preferencias de entrega */}
                {item.deliveryPrefs && item.deliveryPrefs.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mt-1">
                        {item.deliveryPrefs.map((pref, i) => {
                            let icon = "bi-geo-alt-fill";
                            if (pref === 'Envío') icon = "bi-box-seam";
                            if (pref === 'Metro (CDMX)') icon = "bi-train-front";
                            return (
                                <span key={i} className="badge rounded-pill d-flex align-items-center" 
                                    style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", fontSize: "0.55rem" }}>
                                    <i className={`bi ${icon} me-1`}></i>
                                    {pref}
                                </span>
                            );
                        })}
                    </div>
                )}

                <button
                    className="btn rounded-3 fw-bold w-100 py-2"
                    style={{
                        background: user
                            ? "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.3))"
                            : "rgba(255,255,255,0.06)",
                        border: `1px solid ${user ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)"}`,
                        color: user ? "#10b981" : "rgba(255,255,255,0.5)",
                        fontSize: "0.8rem"
                    }}
                    onClick={handleClaim}
                >
                    {user ? <><i className="bi bi-chat-fill me-2" />Contactar</> : <><i className="bi bi-lock-fill me-2" />Ver oferta</>}
                </button>
            </div>
        </div>
    );
}

// ─── Trending Item (wishlist demands) ────────────────────────────────────────
function TrendingCard({ item, onInteract, user }) {
    return (
        <div
            className="d-flex align-items-center gap-3 p-3 rounded-4"
            style={{
                background: "rgba(255,75,145,0.04)",
                border: "1px solid rgba(255,75,145,0.15)",
                transition: "background 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,75,145,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,75,145,0.04)"}
        >
            {item.cardImage
                ? <img src={item.cardImage} alt={item.cardName}
                    style={{ width: "50px", height: "70px", objectFit: "contain", flexShrink: 0 }} />
                : <div style={{ width: "50px", height: "70px", background: "rgba(255,75,145,0.1)", borderRadius: "6px", flexShrink: 0 }} className="d-flex align-items-center justify-content-center">
                    <i className="bi bi-heart-fill text-pink" style={{ fontSize: "1.2rem" }} />
                </div>
            }
            <div className="flex-grow-1 min-w-0">
                <p className="fw-bold text-white mb-0 text-truncate" style={{ fontSize: "0.85rem" }}>{item.cardName}</p>
                <p className="mb-1" style={{ fontSize: "0.65rem", color: "rgba(255,75,145,0.75)" }}>
                    {item.cardSetName}
                </p>
                <span className="badge rounded-pill" style={{ background: "rgba(255,75,145,0.15)", color: "#ff4b91", fontSize: "0.6rem", border: "1px solid rgba(255,75,145,0.25)" }}>
                    ♡ Buscado
                </span>
            </div>
            <button
                className="btn btn-sm rounded-3 fw-bold flex-shrink-0"
                style={{
                    background: "rgba(255,75,145,0.1)",
                    border: "1px solid rgba(255,75,145,0.25)",
                    color: "#ff4b91",
                    fontSize: "0.75rem",
                    whiteSpace: "nowrap"
                }}
                onClick={() => { if (!user) onInteract(); else onInteract(item, "wishlist"); }}
            >
                {user ? "Tengo esto" : "Ver"}
            </button>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PublicFeed({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Leer tab inicial desde URL (?tab=ventas | ?tab=tendencias)
    const initialTab = searchParams.get("tab") === "tendencias" ? "tendencias" : "ventas";

    const [activeTab, setActiveTab] = useState(initialTab);
    const [sales, setSales] = useState([]);
    const [wishlists, setWishlists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGate, setShowGate] = useState(false);
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(
        !!location.state?.fromWelcome
    );

    // Sync tab si cambia la URL externamente
    useEffect(() => {
        const t = searchParams.get("tab");
        if (t === "tendencias" || t === "ventas") setActiveTab(t);
    }, [searchParams]);

    // Auto-hide welcome banner after 5s
    useEffect(() => {
        if (!showWelcomeBanner) return;
        const t = setTimeout(() => setShowWelcomeBanner(false), 5000);
        return () => clearTimeout(t);
    }, [showWelcomeBanner]);

    // ── Fetch ventas en tiempo real ───────────────────────────────────────────
    useEffect(() => {
        const q = query(
            collection(db, "feed"),
            where("action", "==", "sale"),
            orderBy("timestamp", "desc"),
            limit(40)
        );
        const unsub = onSnapshot(q, snap => {
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Prioridad a usuarios PRO
            fetched.sort((a, b) => {
                if (a.isPro && !b.isPro) return -1;
                if (!a.isPro && b.isPro) return 1;
                return 0;
            });
            setSales(fetched);
            setLoading(false);
        }, err => {
            console.error("Feed error:", err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // ── Fetch wishlist pública (tendencias) ───────────────────────────────────
    useEffect(() => {
        if (activeTab !== "tendencias") return;
        const q = query(
            collection(db, "feed"),
            where("action", "==", "wishlist_public"),
            orderBy("timestamp", "desc"),
            limit(40)
        );
        const unsub = onSnapshot(q, snap => {
            setWishlists(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => setWishlists([]));
        return () => unsub();
    }, [activeTab]);

    const handleInteract = async (item, type) => {
        if (!user) { setShowGate(true); return; }
        if (type === "claim" && item) {
            const targetUser = { id: item.userId, name: item.userName, photo: item.userPhoto };
            const msg = `¡Hola! Me interesa tu carta ${item.cardName}`;
            await startChat(user, targetUser, msg);
            navigate("/chats");
        }
        if (type === "wishlist" && item) {
            if (item.userId === user.uid) return; // no chatear consigo mismo
            const targetUser = { id: item.userId, name: item.userName, photo: item.userPhoto };
            const msg = `¡Hola! Tengo la carta ${item.cardName} que estás buscando.`;
            await startChat(user, targetUser, msg);
            navigate("/chats");
        }
    };

    const goToAuth = (mode) => {
        navigate("/auth", { state: { mode } });
    };

    const displayItems = activeTab === "ventas" ? sales : wishlists;

    return (
        <div style={{ minHeight: "100vh", background: "transparent" }}>

            {/* ── Hero / Header ─────────────────────────────────────────────── */}
            <div className="text-center pt-5 pb-4 px-3 position-relative">
                {/* Ambient glow */}
                <div className="position-absolute" style={{ width: "600px", height: "300px", background: "radial-gradient(ellipse at center, rgba(16,185,129,0.07) 0%, transparent 70%)", top: 0, left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />

                <div className="d-inline-flex align-items-center gap-2 mb-3 px-3 py-1 rounded-pill"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", fontSize: "0.75rem", color: "#10b981" }}>
                    <span className="rounded-circle" style={{ width: "6px", height: "6px", background: "#10b981", animation: "pulse-dot 2s infinite" }} />
                    Marketplace en vivo
                </div>

                <h1 className="fw-bold text-white mb-2" style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", letterSpacing: "-0.03em" }}>
                    Pocky's <span style={{ color: "#10b981" }}>Place</span>
                </h1>
                <p className="mb-4" style={{ color: "rgba(255,255,255,0.45)", fontSize: "clamp(0.85rem, 2.5vw, 1rem)", maxWidth: "420px", margin: "0 auto 1.5rem" }}>
                    El marketplace TCG de la comunidad. Compra, vende y colecciona.
                </p>

                {!user && (
                    <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                        <button
                            className="btn rounded-pill px-4 py-2 fw-bold text-white"
                            style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.3)", fontSize: "0.9rem" }}
                            onClick={() => navigate("/auth", { state: { mode: "register" } })}
                        >
                            <i className="bi bi-person-plus me-2" />Unirme gratis
                        </button>
                        <button
                            className="btn rounded-pill px-4 py-2 text-white"
                            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", fontSize: "0.9rem" }}
                            onClick={() => navigate("/auth", { state: { mode: "login" } })}
                        >
                            Iniciar sesión
                        </button>
                    </div>
                )}
            </div>

            {/* ── Banner de bienvenida post-onboarding ────────────────── */}
            {showWelcomeBanner && user && (
                <div className="container mb-3" style={{ maxWidth: "960px" }}>
                    <div
                        className="d-flex align-items-center gap-3 p-3 rounded-4"
                        style={{
                            background: "rgba(16,185,129,0.08)",
                            border: "1px solid rgba(16,185,129,0.25)",
                            animation: "slide-down 0.4s ease"
                        }}
                    >
                        <i className="bi bi-check-circle-fill flex-shrink-0" style={{ color: "#10b981", fontSize: "1.2rem" }} />
                        <div className="flex-grow-1">
                            <p className="fw-bold text-white mb-0" style={{ fontSize: "0.9rem" }}>
                                ¡Bienvenido, {user.displayName || "coleccionista"}!
                            </p>
                            <p className="mb-0" style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem" }}>
                                {activeTab === "tendencias"
                                    ? "Ves lo que la comunidad está buscando — si tienes alguna, ¡contáctalos!"
                                    : "Explora las cartas disponibles y usa el chat para negociar directamente."}
                            </p>
                        </div>
                        <button
                            className="btn p-0 border-0"
                            style={{ color: "rgba(255,255,255,0.25)", lineHeight: 1 }}
                            onClick={() => setShowWelcomeBanner(false)}
                        >
                            <i className="bi bi-x-lg" style={{ fontSize: "0.85rem" }} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Stats Bar ─────────────────────────────────────────────────── */}
            <div className="d-flex justify-content-center gap-4 pb-4 flex-wrap px-3">
                {[
                    { icon: "bi-grid-3x3-gap-fill", label: "Cartas en venta", color: "#10b981" },
                    { icon: "bi-heart-fill", label: "Búsquedas activas", color: "#ff4b91" },
                    { icon: "bi-shield-check-fill", label: "Transacciones seguras", color: "#f59e0b" }
                ].map((s, i) => (
                    <div key={i} className="d-flex align-items-center gap-2" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                        <i className={`bi ${s.icon}`} style={{ color: s.color }} />
                        {s.label}
                    </div>
                ))}
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────────── */}
            <div className="container" style={{ maxWidth: "960px" }}>
                <div className="d-flex gap-2 mb-4 p-1 rounded-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", width: "fit-content" }}>
                    {[
                        { key: "ventas", label: "En Venta", icon: "bi-tag-fill", color: "#10b981" },
                        { key: "tendencias", label: "Tendencias", icon: "bi-heart-fill", color: "#ff4b91" }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className="btn rounded-3 fw-bold px-4 py-2"
                            style={{
                                background: activeTab === tab.key
                                    ? `rgba(${tab.key === "ventas" ? "16,185,129" : "255,75,145"},0.15)`
                                    : "transparent",
                                border: activeTab === tab.key
                                    ? `1px solid rgba(${tab.key === "ventas" ? "16,185,129" : "255,75,145"},0.35)`
                                    : "1px solid transparent",
                                color: activeTab === tab.key ? tab.color : "rgba(255,255,255,0.4)",
                                fontSize: "0.85rem",
                                transition: "all 0.2s"
                            }}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <i className={`bi ${tab.icon} me-2`} style={{ fontSize: "0.8rem" }} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Grid content ──────────────────────────────────────────── */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-grow" style={{ color: "#10b981" }} role="status" />
                        <p className="mt-3" style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", letterSpacing: "2px" }}>CARGANDO MERCADO...</p>
                    </div>
                ) : activeTab === "ventas" ? (
                    displayItems.length === 0 ? (
                        <EmptyState icon="bi-shop" text="No hay ventas activas en este momento." sub="Sé el primero en publicar una carta." />
                    ) : (
                        <div className="row g-3">
                            {displayItems.map(item => (
                                <div key={item.id} className="col-6 col-md-4 col-lg-3">
                                    <SaleCard item={item} onInteract={handleInteract} user={user} />
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    displayItems.length === 0 ? (
                        <EmptyState icon="bi-fire" text="No hay búsquedas activas aún." sub="Los coleccionistas publicarán lo que buscan aquí." />
                    ) : (
                        <div className="d-flex flex-column gap-2">
                            {displayItems.map(item => (
                                <TrendingCard key={item.id} item={item} onInteract={handleInteract} user={user} />
                            ))}
                        </div>
                    )
                )}

                {/* CTA para guest al final */}
                {!user && displayItems.length > 0 && (
                    <div className="text-center py-5 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-white mb-3" style={{ opacity: 0.5, fontSize: "0.9rem" }}>
                            Regístrate para ver más y participar en el marketplace
                        </p>
                        <button
                            className="btn rounded-pill px-5 py-2 fw-bold text-white"
                            style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.25)" }}
                            onClick={() => navigate("/auth", { state: { mode: "register" } })}
                        >
                            Crear cuenta gratis
                        </button>
                    </div>
                )}

                <div className="pb-5" />
            </div>

            {/* ── Auth Gate Modal ───────────────────────────────────────────── */}
            {showGate && (
                <AuthGateModal
                    onClose={() => setShowGate(false)}
                    onGoAuth={goToAuth}
                />
            )}

            <style>{`
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.8); }
                }
                @keyframes slide-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .text-pink { color: #ff4b91 !important; }
                .text-emerald { color: #10b981 !important; }
            `}</style>
        </div>
    );
}

function EmptyState({ icon, text, sub }) {
    return (
        <div className="text-center py-5">
            <i className={`bi ${icon} d-block mb-3`} style={{ fontSize: "2.5rem", color: "rgba(255,255,255,0.1)" }} />
            <p className="text-white mb-1" style={{ opacity: 0.4, fontSize: "0.9rem" }}>{text}</p>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.8rem" }}>{sub}</p>
        </div>
    );
}
