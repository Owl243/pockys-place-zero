import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { getInventory, saveCard } from "../services/inventoryService";
import { useToast } from "../context/ToastContext";
import { useCurrency } from "../context/CurrencyContext";
import { getPriceRaw } from "../utils/cardUtils";
import { postWishlistPublic, removeWishlistPublic } from "../services/feedService";
import { startChat } from "../services/chatService";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Wishlist() {
    const showToast = useToast();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();

    const [tab, setTab] = useState("mine");           // "mine" | "community"
    const [cards, setCards] = useState([]);
    const [community, setCommunity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [communityLoading, setCommunityLoading] = useState(true);
    const [publishing, setPublishing] = useState({});  // cardId → bool
    const [publicIds, setPublicIds] = useState(new Set()); // cardIds publicados por este user

    const user = auth.currentUser;

    // ── Cargar mi wishlist personal ───────────────────────────────────────────
    const load = async () => {
        if (!user) return;
        const data = await getInventory(user.uid);
        setCards(data.filter(c => c.inWishlist));
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    // ── Escuchar qué cards de este user ya están publicadas ───────────────────
    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "feed"),
            where("userId", "==", user.uid),
            where("action", "==", "wishlist_public")
        );
        const unsub = onSnapshot(q, snap => {
            setPublicIds(new Set(snap.docs.map(d => d.data().cardId)));
        });
        return () => unsub();
    }, [user]);

    // ── Escuchar feed comunitario de wishlist ─────────────────────────────────
    useEffect(() => {
        if (tab !== "community") return;
        const q = query(
            collection(db, "feed"),
            where("action", "==", "wishlist_public"),
            orderBy("timestamp", "desc"),
            limit(60)
        );
        const unsub = onSnapshot(q, snap => {
            setCommunity(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setCommunityLoading(false);
        }, () => setCommunityLoading(false));
        return () => unsub();
    }, [tab]);

    // ── Acciones personales ───────────────────────────────────────────────────
    const handleRemove = async (card) => {
        if (!user) return;
        await saveCard(user.uid, card, { ...card, inWishlist: false });
        if (publicIds.has(card.id)) {
            await removeWishlistPublic(user.uid, card.id);
        }
        showToast(`${card.name} eliminada de la wishlist`, "pink");
        load();
    };

    const handleMoveToInventory = async (card) => {
        if (!user) return;
        await saveCard(user.uid, card, { ...card, inInventory: true, inWishlist: false });
        if (publicIds.has(card.id)) {
            await removeWishlistPublic(user.uid, card.id);
        }
        showToast(`${card.name} movida al inventario`, "success");
        load();
    };

    // ── Toggle publicar / ocultar en comunidad ────────────────────────────────
    const handleTogglePublic = async (card) => {
        if (!user) return;
        setPublishing(p => ({ ...p, [card.id]: true }));
        try {
            if (publicIds.has(card.id)) {
                await removeWishlistPublic(user.uid, card.id);
                showToast("Retirada del feed comunitario", "pink");
            } else {
                await postWishlistPublic(
                    user.uid,
                    user.displayName || user.email.split("@")[0],
                    user.photoURL,
                    card
                );
                showToast("¡Publicada en el feed comunitario!", "success");
            }
        } finally {
            setPublishing(p => ({ ...p, [card.id]: false }));
        }
    };

    // ── Contactar desde feed comunitario ─────────────────────────────────────
    const handleContact = async (item) => {
        if (!user) { navigate("/auth"); return; }
        if (item.userId === user.uid) return;
        const target = { id: item.userId, name: item.userName, photo: item.userPhoto };
        const msg = `¡Hola! Tengo la carta ${item.cardName} que estás buscando.`;
        await startChat(user, target, msg);
        navigate("/chats");
    };

    return (
        <div className="container py-3 mb-5">

            {/* Header + tabs */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h2 className="fw-bold mb-1 text-white tracking-tight">
                        {tab === "mine" ? <>Mi <span style={{ color: "#ff4b91" }}>Wishlist</span></> : <>Wishlist <span style={{ color: "#ff4b91" }}>Comunidad</span></>}
                    </h2>
                    <p className="text-muted small mb-0">
                        {tab === "mine" ? "Cartas que estás buscando conseguir" : "Lo que la comunidad quiere encontrar"}
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="d-flex gap-2 p-1 rounded-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {[
                        { key: "mine", label: "Mi lista", icon: "bi-heart-fill" },
                        { key: "community", label: "Comunidad", icon: "bi-people-fill" }
                    ].map(t => (
                        <button key={t.key} className="btn rounded-3 fw-bold px-3 py-2"
                            style={{
                                background: tab === t.key ? "rgba(255,75,145,0.15)" : "transparent",
                                border: tab === t.key ? "1px solid rgba(255,75,145,0.35)" : "1px solid transparent",
                                color: tab === t.key ? "#ff4b91" : "rgba(255,255,255,0.4)",
                                fontSize: "0.82rem", transition: "all 0.2s"
                            }}
                            onClick={() => setTab(t.key)}>
                            <i className={`bi ${t.icon} me-2`} style={{ fontSize: "0.75rem" }} />{t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Mi Wishlist ─────────────────────────────────────────────── */}
            {tab === "mine" && (
                loading ? (
                    <div className="text-center py-5"><div className="spinner-grow" style={{ color: "#ff4b91" }} role="status" /></div>
                ) : cards.length === 0 ? (
                    <div className="text-center py-5 rounded-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <i className="bi bi-heart-fill d-block mb-3 fs-1" style={{ color: "rgba(255,75,145,0.2)" }} />
                        <p className="text-muted mb-2">Tu lista de deseos está vacía.</p>
                        <button className="btn rounded-pill px-4 py-2 fw-bold text-white"
                            style={{ background: "linear-gradient(135deg,#ff4b91,#db2777)", fontSize: "0.85rem" }}
                            onClick={() => navigate("/search")}>
                            <i className="bi bi-search me-2" />Buscar cartas
                        </button>
                    </div>
                ) : (
                    <div className="row g-4">
                        {cards.map(card => {
                            const isPublic = publicIds.has(card.id);
                            const isPublishing = publishing[card.id];
                            return (
                                <div className="col-6 col-md-4 col-lg-3" key={card.id}>
                                    <div className="rounded-5 overflow-hidden h-100 position-relative"
                                        style={{ background: "rgba(255,75,145,0.04)", border: "1px solid rgba(255,75,145,0.15)", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", transition: "transform 0.2s" }}
                                        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                                        onMouseLeave={e => e.currentTarget.style.transform = ""}>

                                        {/* Public badge */}
                                        {isPublic && (
                                            <div className="position-absolute top-0 start-0 m-2 z-1">
                                                <span className="badge rounded-pill fw-bold"
                                                    style={{ background: "rgba(16,185,129,0.2)", color: "#10b981", border: "1px solid rgba(16,185,129,0.35)", fontSize: "0.55rem" }}>
                                                    <i className="bi bi-globe2 me-1" />Público
                                                </span>
                                            </div>
                                        )}

                                        {/* Image */}
                                        <div className="d-flex align-items-center justify-content-center p-4 position-relative"
                                            style={{ background: "rgba(0,0,0,0.3)", minHeight: "200px" }}>
                                            <div className="position-absolute w-100 h-100" style={{ background: "radial-gradient(circle at center, rgba(255,75,145,0.08) 0%, transparent 70%)", top: 0, left: 0 }} />
                                            <img src={card.image} alt={card.name}
                                                style={{ height: "130px", objectFit: "contain", filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.4))" }}
                                                className="position-relative" />
                                        </div>

                                        {/* Info */}
                                        <div className="p-3 d-flex flex-column gap-2">
                                            <div>
                                                <p className="fw-bold text-white mb-0 text-truncate" style={{ fontSize: "0.88rem" }}>{card.name}</p>
                                                <p className="mb-0" style={{ fontSize: "0.65rem", color: "rgba(255,75,145,0.7)" }}>
                                                    #{card.number} · {card.setName || "Set desconocido"}
                                                </p>
                                            </div>
                                            {getPriceRaw(card) && (
                                                <span className="fw-bold" style={{ fontSize: "0.8rem", color: "#ff4b91" }}>
                                                    ${getPriceRaw(card).toFixed(2)} USD
                                                </span>
                                            )}

                                            {/* Acciones */}
                                            <div className="d-flex gap-2 mt-1">
                                                <button className="btn btn-sm rounded-3 py-2 fw-bold flex-grow-1"
                                                    style={{ background: "rgba(255,75,145,0.12)", border: "1px solid rgba(255,75,145,0.3)", color: "#ff4b91", fontSize: "0.75rem" }}
                                                    onClick={() => handleMoveToInventory(card)}>
                                                    ¡La tengo!
                                                </button>
                                                <button className="btn btn-sm rounded-3 py-2"
                                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}
                                                    onClick={() => handleRemove(card)}>
                                                    <i className="bi bi-trash3" />
                                                </button>
                                            </div>

                                            {/* Toggle público */}
                                            <button
                                                className="btn btn-sm rounded-3 py-2 w-100 fw-bold"
                                                style={{
                                                    background: isPublic ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
                                                    border: isPublic ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.08)",
                                                    color: isPublic ? "#10b981" : "rgba(255,255,255,0.3)",
                                                    fontSize: "0.72rem",
                                                    transition: "all 0.2s"
                                                }}
                                                disabled={isPublishing}
                                                onClick={() => handleTogglePublic(card)}>
                                                {isPublishing
                                                    ? <><span className="spinner-border spinner-border-sm me-1" />Guardando...</>
                                                    : isPublic
                                                        ? <><i className="bi bi-globe2 me-1" />Visible en comunidad</>
                                                        : <><i className="bi bi-share me-1" />Publicar en comunidad</>
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* ── Wishlist Comunidad ──────────────────────────────────────── */}
            {tab === "community" && (
                communityLoading ? (
                    <div className="text-center py-5"><div className="spinner-grow" style={{ color: "#ff4b91" }} role="status" /></div>
                ) : community.length === 0 ? (
                    <div className="text-center py-5 rounded-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <i className="bi bi-people d-block mb-3 fs-1" style={{ color: "rgba(255,75,145,0.2)" }} />
                        <p className="text-muted mb-1">Nadie ha publicado búsquedas todavía.</p>
                        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.8rem" }}>
                            Comparte tus wishlist cards para que vendedores te encuentren.
                        </p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {community
                            .filter(item => item.userId !== user?.uid)  // ocultar las propias
                            .map(item => (
                                <div key={item.id} className="d-flex align-items-center gap-3 p-3 rounded-4"
                                    style={{ background: "rgba(255,75,145,0.04)", border: "1px solid rgba(255,75,145,0.12)", transition: "background 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,75,145,0.08)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,75,145,0.04)"}>

                                    {item.cardImage
                                        ? <img src={item.cardImage} alt={item.cardName}
                                            style={{ width: "48px", height: "68px", objectFit: "contain", flexShrink: 0 }} />
                                        : <div style={{ width: "48px", height: "68px", background: "rgba(255,75,145,0.1)", borderRadius: "6px", flexShrink: 0 }}
                                            className="d-flex align-items-center justify-content-center">
                                            <i className="bi bi-heart-fill" style={{ color: "#ff4b91" }} />
                                        </div>
                                    }

                                    {/* Card info */}
                                    <div className="flex-grow-1 min-w-0">
                                        <p className="fw-bold text-white mb-0 text-truncate" style={{ fontSize: "0.88rem" }}>{item.cardName}</p>
                                        <p className="mb-1" style={{ fontSize: "0.65rem", color: "rgba(255,75,145,0.7)" }}>
                                            {item.cardSetName} {item.cardNumber && `· #${item.cardNumber}`}
                                        </p>
                                        <div className="d-flex align-items-center gap-2">
                                            <img
                                                src={item.userPhoto && !item.userPhoto.includes("via.placeholder")
                                                    ? item.userPhoto
                                                    : `https://ui-avatars.com/api/?name=${item.userName || "U"}&background=random&size=24`}
                                                style={{ width: "18px", height: "18px", borderRadius: "50%", objectFit: "cover" }}
                                                alt=""
                                            />
                                            <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>{item.userName}</span>
                                            <span className="badge rounded-pill" style={{ background: "rgba(255,75,145,0.12)", color: "#ff4b91", border: "1px solid rgba(255,75,145,0.25)", fontSize: "0.55rem" }}>
                                                ♡ Buscando
                                            </span>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <button
                                        className="btn btn-sm rounded-3 fw-bold flex-shrink-0"
                                        style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: "0.78rem", whiteSpace: "nowrap" }}
                                        onClick={() => handleContact(item)}>
                                        <i className="bi bi-chat-fill me-1" />Tengo esto
                                    </button>
                                </div>
                            ))}

                        {community.filter(i => i.userId !== user?.uid).length === 0 && (
                            <div className="text-center py-4" style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.85rem" }}>
                                <i className="bi bi-check-circle me-2" />Solo ves tus propias búsquedas — ¡la comunidad aún no ha publicado!
                            </div>
                        )}
                    </div>
                )
            )}

            <style>{`
                .text-pink { color: #ff4b91 !important; }
                .text-emerald { color: #10b981 !important; }
            `}</style>
        </div>
    );
}