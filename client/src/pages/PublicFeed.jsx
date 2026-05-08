import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { db, auth } from "../firebase";
import {
    collection, query, orderBy, limit, onSnapshot, where
} from "firebase/firestore";
import { getPriceRaw, normalizeCardNumber } from "../utils/cardUtils";
import { startChat } from "../services/chatService";
import { useToast } from "../context/ToastContext";
import { useCurrency } from "../context/CurrencyContext";
import { saveCard, getInventory } from "../services/inventoryService";
import { postToFeed, postWishlistPublic } from "../services/feedService";
import { addRequest } from "../services/firebaseService";

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
                    <button className="btn fw-bold rounded-pill py-3 text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.35)", fontSize: "0.95rem" }} onClick={() => onGoAuth("register")}>
                        <i className="bi bi-person-plus me-2" />Crear cuenta gratis
                    </button>
                    <button className="btn rounded-pill py-2 text-white" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontSize: "0.9rem" }} onClick={() => onGoAuth("login")}>
                        Ya tengo cuenta — Iniciar sesión
                    </button>
                </div>
                <button className="position-absolute btn p-0 text-white" style={{ top: "16px", right: "16px", opacity: 0.35, lineHeight: 1 }} onClick={onClose}><i className="bi bi-x-lg" /></button>
            </div>
        </div>
    );
}

// ─── Card Sale Item ──────────────────────────────────────────────────────────
function SaleCard({ item, onInteract, user }) {
    const price = getPriceRaw(item.cardPriceData || item);
    const isMe = user?.uid === item.userId;
    const handleClaim = () => { 
        if (!user) { onInteract(); return; } 
        if (isMe) return;
        onInteract(item, "claim"); 
    };

    return (
        <div className="glass-card overflow-hidden h-100 position-relative" style={{ transition: "all 0.2s" }}>
            <div className="p-3 d-flex align-items-center justify-content-center" style={{ background: "rgba(0,0,0,0.3)", minHeight: "160px" }}>
                <img src={item.cardImage || (item.images?.small)} alt={item.cardName || item.name} style={{ height: "120px", objectFit: "contain", filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.5))" }} />
                {item.isPro && <span className="position-absolute top-0 end-0 m-2 badge rounded-pill fw-bold" style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", fontSize: "0.6rem" }}>⭐ PRO</span>}
            </div>
            <div className="p-3 d-flex flex-column gap-1">
                <p className="fw-bold text-white mb-0 text-truncate small">{item.cardName || item.name}</p>
                <p className="mb-1 text-truncate" style={{ fontSize: "0.6rem", color: "rgba(16,185,129,0.75)" }}>{item.cardSetName || item.set?.name}</p>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-emerald small">{price ? `$${price.toFixed(2)}` : "N/A"}</span>
                    {item.userName && <span className="text-white-50 extra-small">{item.userName}</span>}
                </div>
                <button 
                    className={`btn btn-sm w-100 rounded-3 mt-2 py-2 fw-bold ${isMe ? 'btn-dark bg-opacity-20 text-white-50 disabled' : 'btn-emerald'}`} 
                    onClick={handleClaim} 
                    style={{ fontSize: '0.75rem' }}
                >
                    {!user ? "Ver oferta" : isMe ? "Tu anuncio" : "Contactar"}
                </button>
            </div>
        </div>
    );
}

// ─── TCG Card Item (Explorar) ────────────────────────────────────────────────
function TCGCard({ card, user, onAction, isInInventory, formatPrice }) {
    const price = getPriceRaw(card);
    return (
        <div className="card h-100 border-0 rounded-4 overflow-hidden bg-dark bg-opacity-30 border border-white border-opacity-5 shadow-lg">
            <div className="p-3 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center position-relative" style={{ height: "180px" }}>
                <img src={card.images.small} loading="lazy" className="img-fluid h-100 object-fit-contain w-100 drop-shadow-card" />
            </div>
            <div className="card-body p-3 d-flex flex-column">
                <div className="mb-1 d-flex justify-content-between align-items-center gap-1">
                    <span className="badge text-emerald border border-emerald border-opacity-30 rounded-pill px-2 py-1" style={{ fontSize: '0.55rem' }}>{card.set.name}</span>
                    <span className="text-white fw-bold extra-small">{price ? formatPrice(price) : "N/A"}</span>
                </div>
                <h6 className="fw-bold mb-1 text-white text-truncate small">{card.name}</h6>
                <div className="mt-auto d-flex gap-1 pt-2">
                    <button className="btn btn-outline-emerald flex-grow-1 btn-sm rounded-3 py-1 fw-bold" onClick={() => onAction(card, "inventory")} style={{ fontSize: '0.65rem' }}>Tengo</button>
                    <button className="btn btn-outline-pink flex-grow-1 btn-sm rounded-3 py-1 fw-bold text-white" onClick={() => onAction(card, "wishlist")} style={{ fontSize: '0.65rem' }}>Quiero</button>
                    <button className={`btn flex-grow-1 btn-sm rounded-3 py-1 fw-bold ${isInInventory(card.id) ? 'btn-outline-danger' : 'btn-outline-danger opacity-25'}`} disabled={!isInInventory(card.id)} onClick={() => onAction(card, "sale")} style={{ fontSize: '0.65rem' }}>Vendo</button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PublicFeed({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const showToast = useToast();
    const { formatPrice } = useCurrency();

    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "ventas");
    const [sales, setSales] = useState([]);
    const [wishlists, setWishlists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGate, setShowGate] = useState(false);

    // TCG Search States
    const [tcgQuery, setTcgQuery] = useState("");
    const [tcgCards, setTcgCards] = useState([]);
    const [tcgSets, setTcgSets] = useState([]);
    const [selectedSet, setSelectedSet] = useState(null);
    const [searchMode, setSearchMode] = useState("name"); // "name" o "set"
    const [tcgLoading, setTcgLoading] = useState(false);
    const [tcgSort, setTcgSort] = useState("-set.releaseDate");
    const [userInventory, setUserInventory] = useState([]);

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    // ── Fetch ventas ──────────────────────────────────────────────────────────
    useEffect(() => {
        const q = query(collection(db, "feed"), where("action", "==", "sale"), orderBy("timestamp", "desc"), limit(40));
        const unsub = onSnapshot(q, snap => {
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            fetched.sort((a, b) => (a.isPro ? -1 : (b.isPro ? 1 : 0)));
            setSales(fetched);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // ── Fetch wishlist pública (tendencias) ───────────────────────────────────
    useEffect(() => {
        const q = query(collection(db, "feed"), where("action", "==", "wishlist_public"), orderBy("timestamp", "desc"), limit(40));
        const unsub = onSnapshot(q, snap => {
            setWishlists(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => setWishlists([]));
        return () => unsub();
    }, []);

    // ── Fetch sets ────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchSets = async () => {
            const res = await fetch("https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate");
            const data = await res.json();
            setTcgSets(data.data);
        };
        fetchSets();
        if (user) getInventory(user.uid).then(setUserInventory);
    }, [user]);

    const [tcgPage, setTcgPage] = useState(1);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // ── Ejecutar búsqueda TCG ────────────────────────────────────────────────
    const executeTcgSearch = async (page = 1, isNew = true) => {
        if (!tcgQuery && !selectedSet) return;
        setTcgLoading(true);
        if (isNew) { setTcgCards([]); setTcgPage(1); }
        
        let q = "";
        if (searchMode === "name" && tcgQuery) {
            q = `name:"*${tcgQuery}*"`;
            addRequest(tcgQuery);
        } else if (searchMode === "set" && selectedSet) {
            q = `set.id:${selectedSet}`;
        }

        try {
            const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=10&page=${page}&orderBy=${tcgSort}`);
            const data = await res.json();
            if (isNew) setTcgCards(data.data || []);
            else setTcgCards(prev => [...prev, ...(data.data || [])]);
        } catch (err) {
            showToast("Error en la búsqueda TCG", "error");
        } finally {
            setTcgLoading(false);
        }
    };

    // ── Efectos de búsqueda reactiva ─────────────────────────────────────────
    useEffect(() => {
        if (selectedSet || (searchMode === "name" && tcgQuery.length > 2)) {
            executeTcgSearch(1, true);
        }
    }, [selectedSet, tcgSort]);

    // ── Autocompletado (Local + API ligera) ───────────────────────────────────
    useEffect(() => {
        if (searchMode === "name" && tcgQuery.length > 2) {
            const timer = setTimeout(async () => {
                try {
                    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${tcgQuery}*"&pageSize=5&select=name`);
                    const data = await res.json();
                    const names = [...new Set(data.data?.map(c => c.name))];
                    setSuggestions(names);
                    setShowSuggestions(names.length > 0);
                } catch (e) { console.error(e); }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [tcgQuery, searchMode]);

    const handleTcgAction = async (card, type) => {
        if (!user) { setShowGate(true); return; }
        const dataMap = {
            inventory: { inInventory: true, inWishlist: false, forSale: false, label: "Inventario", toastType: "success" },
            wishlist: { inInventory: false, inWishlist: true, forSale: false, label: "Wishlist", toastType: "pink" },
            sale: { inInventory: true, inWishlist: false, forSale: true, label: "Venta", toastType: "error" }
        };
        const action = dataMap[type];
        await saveCard(user.uid, card, { inInventory: action.inInventory, inWishlist: action.inWishlist, forSale: action.forSale });
        if (type === 'sale') await postToFeed(user.uid, user.displayName || user.email.split("@")[0], user.photoURL, 'sale', card, user);
        if (type === 'wishlist') await postWishlistPublic(user.uid, user.displayName || user.email.split("@")[0], user.photoURL, card);
        getInventory(user.uid).then(setUserInventory);
        showToast(`${card.name} añadida a ${action.label}`, action.toastType);
    };

    const handleInteract = async (item, type) => {
        if (!user) { setShowGate(true); return; }
        if (type === "claim" && item) {
            const targetUser = { id: item.userId, name: item.userName, photo: item.userPhoto };
            await startChat(user, targetUser, `¡Hola! Me interesa tu carta ${item.cardName || item.name}`);
            navigate("/activity");
        }
    };

    return (
        <div className="pb-5">
            <div className="text-center pt-3 pt-md-4 pb-2 pb-md-3">
                <h1 className="fw-bold text-white mb-1" style={{ fontSize: "clamp(1.5rem, 5vw, 2.2rem)" }}>Pocky's <span className="text-emerald">Place</span></h1>
                <p className="text-white-50 small mb-0">Marketplace y Explorador TCG</p>
            </div>

            {/* ── Tabs ── */}
            <div className="d-flex justify-content-center mb-4">
                <div className="d-flex gap-1 p-1 rounded-pill bg-dark bg-opacity-50 border border-white border-opacity-10 shadow-sm flex-wrap justify-content-center">
                    {[
                        { key: "ventas", label: "Ventas", icon: "bi-tag-fill" },
                        { key: "tendencias", label: "Tendencias", icon: "bi-heart-fill" },
                        { key: "tcg", label: "TCG", icon: "bi-search" }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className={`btn btn-sm rounded-pill px-3 py-2 fw-bold transition-all ${activeTab === tab.key ? "btn-emerald text-white" : "text-white-50 border-0"}`}
                            onClick={() => { setActiveTab(tab.key); setSearchParams({ tab: tab.key }); }}
                        >
                            <i className={`bi ${tab.icon} me-1`}></i>{tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="animate-fade-in">
                {activeTab === "ventas" ? (
                    loading ? <div className="text-center py-5"><div className="spinner-grow text-emerald"></div></div> : (
                        <div className="row g-3">
                            {sales.map(item => (
                                <div key={item.id} className="col-6 col-md-4 col-lg-3">
                                    <SaleCard item={item} user={user} onInteract={handleInteract} />
                                </div>
                            ))}
                        </div>
                    )
                ) : activeTab === "tendencias" ? (
                    <div className="d-flex flex-column gap-2">
                        {wishlists.length === 0 ? (
                            <div className="text-center py-5 text-white-50 opacity-50">No hay tendencias en este momento</div>
                        ) : (
                            wishlists.map(item => (
                                <div key={item.id} className="d-flex align-items-center gap-3 p-3 rounded-4" style={{ background: "rgba(255,75,145,0.04)", border: "1px solid rgba(255,75,145,0.15)" }}>
                                    {item.cardImage ? <img src={item.cardImage} style={{ width: "40px", height: "56px", objectFit: "contain" }} /> : <div className="bg-pink bg-opacity-10 rounded" style={{ width: "40px", height: "56px" }}></div>}
                                    <div className="flex-grow-1 min-w-0">
                                        <p className="fw-bold text-white mb-0 text-truncate small">{item.cardName}</p>
                                        <p className="text-white-50 extra-small mb-0">{item.userName} está buscando esto</p>
                                    </div>
                                    <button className="btn btn-outline-pink btn-sm rounded-3 px-3 fw-bold" style={{ fontSize: '0.7rem' }} onClick={() => handleInteract(item, "claim")}>Tengo esto</button>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="tcg-explorer">
                        <div className="bg-dark bg-opacity-40 p-3 p-md-4 rounded-4 border border-white border-opacity-5 mb-4">
                            <div className="d-flex flex-column flex-md-row gap-3 align-items-center mb-4">
                                {/* Search Mode Switch */}
                                <div className="btn-group rounded-pill overflow-hidden border border-white border-opacity-10 p-1 bg-black bg-opacity-20" style={{ minWidth: '180px' }}>
                                    <button className={`btn btn-sm px-3 rounded-pill border-0 fw-bold transition-all ${searchMode === 'name' ? 'btn-emerald text-white shadow-emerald' : 'text-white-50 opacity-50'}`} onClick={() => setSearchMode('name')}>Pokémon</button>
                                    <button className={`btn btn-sm px-3 rounded-pill border-0 fw-bold transition-all ${searchMode === 'set' ? 'btn-emerald text-white shadow-emerald' : 'text-white-50 opacity-50'}`} onClick={() => setSearchMode('set')}>Sets</button>
                                </div>

                                <div className="flex-grow-1 w-100 position-relative">
                                     {searchMode === 'name' ? (
                                         <div className="position-relative">
                                             <div className="input-group rounded-pill overflow-hidden border border-white border-opacity-10 bg-black bg-opacity-20">
                                                 <span className="input-group-text bg-transparent border-0 ps-3 text-white-50"><i className="bi bi-search"></i></span>
                                                 <input type="text" className="form-control border-0 bg-transparent text-white py-2" placeholder="Nombre del Pokémon..." value={tcgQuery} onChange={(e) => setTcgQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && executeTcgSearch(1, true)} />
                                                 <button className="btn btn-emerald px-4 fw-bold" onClick={() => executeTcgSearch(1, true)}>Buscar</button>
                                             </div>
                                             {/* Suggestions Dropdown */}
                                             {showSuggestions && (
                                                 <div className="position-absolute top-100 start-0 w-100 mt-2 bg-dark border border-white border-opacity-10 rounded-4 shadow-2xl z-3 overflow-hidden animate-fade-in">
                                                     {suggestions.map((s, i) => (
                                                         <div key={i} className="px-4 py-2 text-white hover-bg-emerald-opacity cursor-pointer border-bottom border-white border-opacity-5" onClick={() => { setTcgQuery(s); setShowSuggestions(false); executeTcgSearch(1, true); }}>
                                                             <i className="bi bi-arrow-right-short me-2 text-emerald"></i>{s}
                                                         </div>
                                                     ))}
                                                 </div>
                                             )}
                                         </div>
                                     ) : (
                                         <select className="form-select rounded-pill border-0 bg-black bg-opacity-20 text-white py-2 px-4 shadow-none" value={selectedSet || ""} onChange={(e) => setSelectedSet(e.target.value)}>
                                             <option value="" disabled className="bg-dark">Selecciona un Set...</option>
                                             {tcgSets.map(s => <option key={s.id} value={s.id} className="bg-dark">{s.name}</option>)}
                                         </select>
                                     )}
                                 </div>

                                 <div className="d-flex align-items-center gap-2">
                                     <span className="small text-white-50 d-none d-md-inline">Ordenar:</span>
                                     <select className="form-select form-select-sm rounded-pill border-white border-opacity-10 bg-black bg-opacity-20 text-white px-3 shadow-none" value={tcgSort} onChange={(e) => setTcgSort(e.target.value)}>
                                         <option value="-set.releaseDate" className="bg-dark">Lanzamiento</option>
                                         <option value="-tcgplayer.prices.holofoil.market" className="bg-dark">Precio Máx</option>
                                         <option value="tcgplayer.prices.holofoil.market" className="bg-dark">Precio Mín</option>
                                     </select>
                                 </div>
                             </div>

                             <div className="row g-3">
                                 {tcgCards.map(card => (
                                     <div key={card.id} className="col-6 col-md-4 col-lg-3">
                                         <TCGCard card={card} user={user} onAction={handleTcgAction} isInInventory={id => userInventory.some(c => c.id === id && c.inInventory)} formatPrice={formatPrice} />
                                     </div>
                                 ))}
                                 
                                 {tcgCards.length > 0 && !tcgLoading && (
                                     <div className="col-12 text-center mt-4">
                                         <button className="btn btn-outline-emerald rounded-pill px-5 py-2 fw-bold" onClick={() => { const next = tcgPage + 1; setTcgPage(next); executeTcgSearch(next, false); }}>
                                             Cargar más cartas
                                         </button>
                                     </div>
                                 )}

                                 {tcgLoading && <div className="col-12 text-center py-4"><div className="spinner-border text-emerald"></div></div>}
                                 {tcgCards.length === 0 && !tcgLoading && <div className="text-center py-5 text-white-50"><i className="bi bi-search fs-2 mb-3 d-block opacity-20"></i>Busca cartas por nombre o elige un set</div>}
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {showGate && <AuthGateModal onClose={() => setShowGate(false)} onGoAuth={(mode) => navigate("/auth", { state: { mode } })} />}

            <style>{`
                .extra-small { font-size: 0.65rem; }
                .btn-emerald { background: #10b981; border: none; color: white; }
                .btn-emerald:hover { background: #059669; }
                .text-emerald { color: #10b981 !important; }
                .btn-outline-emerald { border: 1.5px solid #10b981; color: #10b981; background: transparent; }
                .btn-outline-emerald:hover { background: #10b981; color: white; }
                .btn-outline-pink { border: 1.5px solid #ff4b91; color: #ff4b91; background: transparent; }
                .btn-outline-pink:hover { background: #ff4b91; color: white; }
                .drop-shadow-card { filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5)); }
                .shadow-emerald { box-shadow: 0 0 15px rgba(16, 185, 129, 0.3); }
                .animate-fade-in { animation: fadeIn 0.4s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .form-select { border-color: rgba(255,255,255,0.1); }
                .form-select:focus { border-color: #10b981; }
                .hover-bg-emerald-opacity:hover { background: rgba(16, 185, 129, 0.1); }
                .cursor-pointer { cursor: pointer; }
                .z-3 { z-index: 1050; }
            `}</style>
        </div>
    );
}
