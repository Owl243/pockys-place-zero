import { useState, useEffect, useRef } from "react";
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

// ──â”€ Auth Gate Modal ────────────────────────────────────────────────────────
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
                    border: "1px solid rgba(var(--pocky-primary-rgb), 0.25)",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(var(--pocky-primary-rgb), 0.08)"
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="position-absolute" style={{ width: "200px", height: "200px", background: "radial-gradient(circle, rgba(var(--pocky-primary-rgb), 0.15) 0%, transparent 70%)", top: "-50px", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />
                <div className="mb-4 position-relative">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{ width: "70px", height: "70px", background: "rgba(var(--pocky-primary-rgb), 0.12)", border: "1px solid rgba(var(--pocky-primary-rgb), 0.3)" }}>
                        <i className="bi bi-lock-fill text-emerald fs-2" />
                    </div>
                    <h4 className="fw-bold text-white mb-2">Ãšnete a Pocky's Place</h4>
                    <p className="text-white mb-0" style={{ opacity: 0.55, fontSize: "0.9rem", lineHeight: 1.6 }}>
                        RegÃ­strate gratis para comprar, vender y conectar con coleccionistas.
                    </p>
                </div>
                <div className="d-flex flex-column gap-3">
                    <button className="btn fw-bold rounded-pill py-3 text-white btn-primary shadow-emerald" style={{ fontSize: "0.95rem" }} onClick={() => onGoAuth("register")}>
                        <i className="bi bi-person-plus me-2" />Crear cuenta gratis
                    </button>
                    <button className="btn rounded-pill py-2 text-white" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontSize: "0.9rem" }} onClick={() => onGoAuth("login")}>
                        Ya tengo cuenta â€” Iniciar sesiÃ³n
                    </button>
                </div>
                <button className="position-absolute btn p-0 text-white" style={{ top: "16px", right: "16px", opacity: 0.35, lineHeight: 1 }} onClick={onClose}><i className="bi bi-x-lg" /></button>
            </div>
        </div>
    );
}

// ──â”€ Card Sale Item ──────────────────────────────────────────────────────────
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
                {item.isPro && <span className="position-absolute top-0 end-0 m-2 badge rounded-pill fw-bold" style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", fontSize: "0.6rem" }}>â­ PRO</span>}
            </div>
            <div className="p-3 d-flex flex-column gap-1">
                <p className="fw-bold text-white mb-0 text-truncate" style={{ fontSize: "0.9rem" }}>{item.cardName || item.name}</p>
                <div className="d-flex flex-column">
                    <p className="mb-0 text-truncate" style={{ fontSize: "0.6rem", color: "rgba(var(--pocky-primary-rgb), 0.75)" }}>{item.cardSetName || item.set?.name}</p>
                    <p className="mb-1 text-truncate opacity-50" style={{ fontSize: "0.55rem" }}>
                        {item.cardNumber || item.number} / {item.cardSetTotal || item.set?.printedTotal} • {item.cardRarity || item.rarity}
                    </p>
                </div>
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

// ──â”€ Product Card Item (Sellado) ────────────────────────────────────────────â”€
function ProductCard({ card, user, onAction, isInInventory, formatPrice }) {
    return (
        <div className="card border-0 rounded-4 overflow-hidden bg-dark bg-opacity-30 border border-white border-opacity-5 shadow-lg d-flex flex-row">
            <div className="p-2 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ width: "90px", height: "130px", flexShrink: 0 }}>
                <img src={card.images.small} loading="lazy" className="img-fluid h-100 object-fit-contain drop-shadow-card" />
            </div>
            <div className="card-body p-3 d-flex flex-column justify-content-between min-w-0">
                <div>
                    <div className="mb-1 d-flex justify-content-between align-items-center gap-2">
                        <span className="badge text-emerald border border-emerald border-opacity-30 rounded-pill px-2 py-1 text-truncate" style={{ fontSize: '0.55rem' }}>{card.set.name}</span>
                        <span className="text-white fw-bold extra-small flex-shrink-0">PRODUCTO</span>
                    </div>
                    <h6 className="fw-bold mb-1 text-white text-truncate" style={{ fontSize: '0.9rem' }}>{card.name}</h6>
                    <p className="text-white-50 extra-small mb-0 text-truncate opacity-50">{card.rarity} • Sellado</p>
                </div>
                <div className="d-flex gap-1 pt-2">
                    <button className="btn btn-outline-emerald flex-grow-1 btn-sm rounded-3 py-1 fw-bold" onClick={() => onAction(card, "inventory")} style={{ fontSize: '0.65rem' }}>Tengo</button>
                    <button className="btn btn-outline-pink flex-grow-1 btn-sm rounded-3 py-1 fw-bold text-white" onClick={() => onAction(card, "wishlist")} style={{ fontSize: '0.65rem' }}>Quiero</button>
                    <button className={`btn flex-grow-1 btn-sm rounded-3 py-1 fw-bold ${isInInventory(card.id) ? 'btn-outline-danger' : 'btn-outline-danger opacity-25'}`} disabled={!isInInventory(card.id)} onClick={() => onAction(card, "sale")} style={{ fontSize: '0.65rem' }}>Vendo</button>
                </div>
            </div>
        </div>
    );
}

// ──â”€ TCG Card Item (Explorar) ────────────────────────────────────────────────
function TCGCard({ card, user, onAction, isInInventory, formatPrice }) {
    const price = getPriceRaw(card);
    return (
        <div className="card border-0 rounded-4 overflow-hidden bg-dark bg-opacity-30 border border-white border-opacity-5 shadow-lg d-flex flex-row">
            <div className="p-2 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ width: "90px", height: "130px", flexShrink: 0 }}>
                <img src={card.images.small} loading="lazy" className="img-fluid h-100 object-fit-contain drop-shadow-card" />
            </div>
            <div className="card-body p-3 d-flex flex-column justify-content-between min-w-0">
                <div>
                    <div className="mb-1 d-flex justify-content-between align-items-center gap-2">
                        <span className="badge text-emerald border border-emerald border-opacity-30 rounded-pill px-2 py-1 text-truncate" style={{ fontSize: '0.55rem', maxWidth: '70%' }}>{card.set.name}</span>
                        <span className="text-white fw-bold extra-small flex-shrink-0">{price ? formatPrice(price) : "N/A"}</span>
                    </div>
                    <h6 className="fw-bold mb-1 text-white text-truncate" style={{ fontSize: '0.9rem' }}>{card.name}</h6>
                    <p className="text-white-50 extra-small mb-0 text-truncate opacity-50">
                        {card.isProduct ? 'Producto Sellado' : `${card.number} / ${card.set.printedTotal} • ${card.rarity || 'Common'}`}
                    </p>
                </div>
                <div className="d-flex gap-1 pt-2">
                    <button className="btn btn-outline-emerald flex-grow-1 btn-sm rounded-3 py-1 fw-bold" onClick={() => onAction(card, "inventory")} style={{ fontSize: '0.65rem' }}>Tengo</button>
                    <button className="btn btn-outline-pink flex-grow-1 btn-sm rounded-3 py-1 fw-bold text-white" onClick={() => onAction(card, "wishlist")} style={{ fontSize: '0.65rem' }}>Quiero</button>
                    <button className={`btn flex-grow-1 btn-sm rounded-3 py-1 fw-bold ${isInInventory(card.id) ? 'btn-outline-danger' : 'btn-outline-danger opacity-25'}`} disabled={!isInInventory(card.id)} onClick={() => onAction(card, "sale")} style={{ fontSize: '0.65rem' }}>Vendo</button>
                </div>
            </div>
        </div>
    );
}

// ──â”€ Main Component ──────────────────────────────────────────────────────────
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
    const suggestionsRef = useRef(null);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Product Search States
    const [productQuery, setProductQuery] = useState("");
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);

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

    // ── Fetch wishlist pÃºblica (tendencias) ──────────────────────────────────â”€
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

    // Cerrar sugerencias al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ── Ejecutar bÃºsqueda TCG ────────────────────────────────────────────────
    const executeTcgSearch = async (page = 1, isNew = true) => {
        if (!tcgQuery && !selectedSet) return;
        setTcgLoading(true);
        if (isNew) { setTcgCards([]); setTcgPage(1); }

        if (searchMode === "producto" && tcgQuery) {
            try {
                const parts = tcgQuery.toLowerCase().split(' ');
                const queryPrefix = parts[0];
                let keywords = parts.slice(1);

                // Mapeo de sinÃ³nimos para mejorar la bÃºsqueda (ej: etb -> elite trainer box)
                const synonyms = {
                    'etb': ['elite', 'trainer', 'box'],
                    'display': ['display', 'box'],
                    'booster': ['booster', 'box']
                };

                // Expandir palabras clave con sinÃ³nimos
                let expandedKeywords = [...keywords];
                keywords.forEach(k => {
                    if (synonyms[k]) expandedKeywords = [...expandedKeywords, ...synonyms[k]];
                });
                // Eliminar duplicados
                expandedKeywords = [...new Set(expandedKeywords)];

                // Definir rangos de sets populares para bÃºsqueda multi-set
                const setEras = {
                    'sv': [...Array.from({ length: 10 }, (_, i) => `sv${i + 1}`), 'sv3pt5', 'sv4pt5', 'sv6pt5', 'sv8pt5', 'sve', 'svp'],
                    'swsh': [...Array.from({ length: 12 }, (_, i) => `swsh${i + 1}`), 'swsh12pt5', 'swsh12pt5gg', 'swsh9tg', 'swsh10tg', 'swsh11tg', 'swsh12tg', 'swsh35', 'swsh45', 'swsh45sv', 'swshp'],
                    'sm': [...Array.from({ length: 12 }, (_, i) => `sm${i + 1}`), 'sm115', 'sm75', 'sm35', 'sma', 'smp'],
                    'xy': [...Array.from({ length: 13 }, (_, i) => `xy${i}`), 'xyp'],
                    'bw': [...Array.from({ length: 11 }, (_, i) => `bw${i + 1}`), 'bwp'],
                    'hgss': ['hgss1', 'hgss2', 'hgss3', 'hgss4'],
                    'pl': ['pl1', 'pl2', 'pl3', 'pl4'],
                    'dp': [...Array.from({ length: 7 }, (_, i) => `dp${i + 1}`), 'dpp'],
                    'ex': Array.from({ length: 16 }, (_, i) => `ex${i + 1}`),
                    'legacy': ['base1', 'base2', 'base3', 'base4', 'base5', 'base6', 'basep', 'neo1', 'neo2', 'neo3', 'neo4', 'gym1', 'gym2', 'ecard1', 'ecard2', 'ecard3'],
                    'me': ['me1', 'me2', 'me3', 'me4', 'me2pt5', 'mep', 'mepfpcs1'],
                    'misc': [
                        'c151c', 'c_svp', 'cbb1c', 'cbb2c', 'cbb3c', 'cbb4c', 'cel25', 'cel25c',
                        'cs1a', 'cs1b', 'csm1a', 'csm1b', 'csm1c', 'csm2a', 'csm2b', 'csm2c',
                        'csv1c', 'csv2c', 'csv3c', 'csv4c', 'csv5c', 'csv6c', 'csv7c',
                        'dc1', 'det1', 'dv1', 'fut20', 'g1', 'col1',
                        'mcd11', 'mcd12', 'mcd13', 'mcd14', 'mcd15', 'mcd16', 'mcd17', 'mcd18', 'mcd19', 'mcd20', 'mcd21', 'mcd22',
                        'pgo', 'pop1', 'pop2', 'pop3', 'pop4', 'pop5', 'pop6', 'pop7', 'pop8', 'pop9', 'rsv10pt5',
                        'ru1', 'si1', 'tcgp1', 'tcgp1a', 'tcgpa2', 'tcgpa3', 'tcgpa4', 'tcgpa4b', 'tcgpb1', 'tcgpb2', 'tcgpb2b', 'tcgppa', 'tcgppb',
                        'tk1a', 'tk1b', 'tk2a', 'tk2b',
                        'topps1', 'tot22', 'tot23', 'tot24', 'zsv10pt5'
                    ]
                };

                // Si el prefijo coincide con una era (ej: "sv"), buscamos en todos esos sets
                // De lo contrario, solo buscamos en el set especÃ­fico proporcionado
                const targetSets = setEras[queryPrefix] || [queryPrefix];

                const interestingTypes = ["etb", "elite-trainer-box", "display", "display-box", "booster-box", "booster-pack", "booster-bundle", "v-box", "blister", "elite_trainer_box", "display_box", "booster_bundle"];

                let allProducts = [];

                // FunciÃ³n para buscar en un set especÃ­fico
                const fetchProductsFromSet = async (setId) => {
                    try {
                        const rootRes = await fetch(`https://api.github.com/repos/1niceroli/ptcg-assets/contents/${setId}`);
                        if (!rootRes.ok) return [];

                        const rootItems = await rootRes.json();
                        let setResults = [];

                        for (const item of rootItems) {
                            const itemName = item.name.toLowerCase();
                            const normItemName = itemName.replace(/-/g, ' ').replace(/_/g, ' ');
                            
                            // Excluir logos y sÃ­mbolos
                            if (itemName.includes('logo') || itemName.includes('symbol')) continue;

                            if (item.type === "file" && itemName.endsWith('.png')) {
                                const matchesKeywords = expandedKeywords.length === 0 || expandedKeywords.every(k => normItemName.includes(k));
                                if (matchesKeywords) {
                                    setResults.push({
                                        id: `prod-${item.sha}`,
                                        name: item.name.replace('.png', '').replace(/-/g, ' ').replace(/_/g, ' ').toUpperCase(),
                                        images: { small: item.download_url },
                                        set: { name: setId.toUpperCase(), printedTotal: 'N/A' },
                                        isProduct: true,
                                        rarity: "PRODUCTO",
                                        tcgplayer: { prices: null }
                                    });
                                }
                            }
                            
                            if (item.type === "dir" && (interestingTypes.includes(itemName) || interestingTypes.includes(itemName.replace('_', '-')))) {
                                try {
                                    const subRes = await fetch(item.url);
                                    if (subRes.ok) {
                                        const subFiles = await subRes.json();
                                        const mapped = subFiles
                                            .filter(f => {
                                                const fName = f.name.toLowerCase();
                                                return fName.endsWith('.png') && !fName.includes('logo') && !fName.includes('symbol');
                                            })
                                            .filter(f => {
                                                const normFile = f.name.toLowerCase().replace(/-/g, ' ').replace(/_/g, ' ');
                                                const normFolder = itemName.replace(/-/g, ' ').replace(/_/g, ' ');
                                                return expandedKeywords.length === 0 || expandedKeywords.every(k => normFile.includes(k) || normFolder.includes(k));
                                            })
                                            .map(f => ({
                                                id: `prod-${f.sha}`,
                                                name: f.name.replace('.png', '').replace(/-/g, ' ').replace(/_/g, ' ').toUpperCase(),
                                                images: { small: f.download_url },
                                                set: { name: setId.toUpperCase(), printedTotal: 'N/A' },
                                                isProduct: true,
                                                rarity: itemName.replace(/_/g, ' ').replace(/-/g, ' ').toUpperCase(),
                                                tcgplayer: { prices: null }
                                            }));
                                        setResults = [...setResults, ...mapped];
                                    }
                                } catch (e) { }
                            }
                        }
                        return setResults;
                    } catch (e) { return []; }
                };

                // Si buscamos en mÃºltiples sets, limitamos el paralelismo para no saturar la API
                if (targetSets.length > 1) {
                    // Buscamos en lotes de 3 para ser amigables con el rate limit de GitHub
                    for (let i = 0; i < targetSets.length; i += 3) {
                        const batch = targetSets.slice(i, i + 3);
                        const batchResults = await Promise.all(batch.map(s => fetchProductsFromSet(s)));
                        allProducts = [...allProducts, ...batchResults.flat()];
                        // Si ya tenemos suficientes resultados, paramos (opcional)
                        if (allProducts.length > 50) break;
                    }
                } else {
                    allProducts = await fetchProductsFromSet(targetSets[0]);
                }

                setTcgCards(allProducts);
            } catch (err) {
                showToast("Error en la bÃºsqueda de productos", "error");
            } finally {
                setTcgLoading(false);
            }
            return;
        }

        let q = "";
        if (searchMode === "name" && tcgQuery) {
            q = `name:"*${tcgQuery}*"`;
            addRequest(tcgQuery);
        } else if (searchMode === "set" && selectedSet) {
            q = `set.id:${selectedSet}`;
        }

        try {
            // Aumentamos pageSize para cargar la mayor cantidad de coincidencias posibles de un golpe
            const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=100&page=${page}&orderBy=${tcgSort}`);
            const data = await res.json();

            if (isNew) {
                setTcgCards(data.data || []);
            } else {
                setTcgCards(prev => [...prev, ...(data.data || [])]);
            }
        } catch (err) {
            showToast("Error en la bÃºsqueda TCG", "error");
        } finally {
            setTcgLoading(false);
        }
    };

    // ── Ejecutar bÃºsqueda Producto ──────────────────────────────────────────â”€
    const executeProductSearch = async () => {
        if (!productQuery) return;
        setProductsLoading(true);
        setProducts([]);
        try {
            const types = ["etb", "display", "booster_box", "booster_pack", "booster_bundle", "collection", "blister", "premium_collection"];
            let allProducts = [];
            for (const type of types) {
                try {
                    const res = await fetch(`https://api.github.com/repos/1niceroli/ptcg-assets/contents/${productQuery.toLowerCase()}/${type}`);
                    if (res.ok) {
                        const files = await res.json();
                        const mapped = files.filter(f => f.name.toLowerCase().endsWith('.png')).map(f => ({
                            id: `prod-${f.sha}`,
                            name: f.name.replace('.png', '').replace(/-/g, ' ').replace(/_/g, ' ').toUpperCase(),
                            images: { small: `https://raw.githubusercontent.com/1niceroli/ptcg-assets/main/${productQuery.toLowerCase()}/${type}/${f.name}` },
                            set: { name: productQuery.toUpperCase(), printedTotal: 'N/A' },
                            isProduct: true,
                            rarity: type.toUpperCase(),
                            tcgplayer: { prices: null }
                        }));
                        allProducts = [...allProducts, ...mapped];
                    }
                } catch (e) { /* silent skip */ }
            }
            setProducts(allProducts);
            if (allProducts.length === 0) showToast("No se encontraron productos para este set", "warning");
        } catch (err) {
            showToast("Error buscando productos", "error");
        } finally {
            setProductsLoading(false);
        }
    };

    // ── Ejecutar bÃºsqueda inicial o por set ──────────────────────────────────
    useEffect(() => {
        if (selectedSet) {
            executeTcgSearch(1, true);
        }
    }, [selectedSet]);

    // ── Ordenamiento Local ────────────────────────────────────────────────────
    useEffect(() => {
        if (tcgCards.length > 0) {
            const sorted = [...tcgCards].sort((a, b) => {
                if (tcgSort === "-set.releaseDate") {
                    const dateA = new Date(a.set?.releaseDate || 0);
                    const dateB = new Date(b.set?.releaseDate || 0);
                    return dateB - dateA;
                } else if (tcgSort === "-tcgplayer.prices.holofoil.market") {
                    const priceA = getPriceRaw(a) || 0;
                    const priceB = getPriceRaw(b) || 0;
                    return priceB - priceA;
                }
                return 0;
            });
            setTcgCards(sorted);
        }
    }, [tcgSort]);

    // ── Autocompletado (Local + API ligera) ──────────────────────────────────â”€
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
            navigate("/activity", { state: { openOffer: item } });
        }
    };

    return (
        <div className="pt-2 pt-md-3 pb-5">

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
<div key={item.id} className="d-flex align-items-stretch gap-3 p-4 rounded-4 shadow-lg position-relative overflow-hidden mb-2" style={{ background: "linear-gradient(145deg, rgba(255, 75, 145, 0.08) 0%, transparent 100%)", border: "1px solid rgba(255,75,145,0.3)" }}>
                                    <div className="position-absolute top-0 end-0 px-3 py-1 bg-pink text-white fw-bold rounded-bl-3" style={{ fontSize: '0.7rem' }}>Buscando</div>
                                    <div className="d-flex align-items-center justify-content-center flex-shrink-0">
                                        {item.cardImage ? <img src={item.cardImage} style={{ width: "80px", height: "113px", objectFit: "contain", filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }} /> : <div className="bg-pink bg-opacity-10 rounded" style={{ width: "80px", height: "113px" }}></div>}
                                    </div>
                                    <div className="flex-grow-1 min-w-0 d-flex flex-column justify-content-between">
                                        <div className="pt-1">
                                            <p className="fw-bold text-white mb-1 text-truncate" style={{ fontSize: "1rem" }}>{item.cardName}</p>
                                            <p className="text-white-50 extra-small mb-1 opacity-75" style={{ fontSize: "0.8rem" }}>{item.cardSetName} • {item.cardNumber}/{item.cardSetTotal}</p>
                                            <p className="text-white-50 extra-small mb-0 opacity-50"><i className="bi bi-person-fill me-1"></i>{item.userName} busca esto</p>
                                        </div>
                                        <div className="d-flex justify-content-end mt-3">
                                            <button className="btn btn-pink rounded-pill px-4 py-2 fw-bold text-white shadow-sm transition-all hover-scale-105" style={{ fontSize: '0.85rem' }} onClick={() => handleInteract(item, "claim")}>
                                                <i className="bi bi-bag-check-fill me-2"></i>¡Tengo esto!
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="tcg-explorer">
                        <div className="bg-dark bg-opacity-40 p-3 p-md-4 rounded-4 border border-white border-opacity-5 mb-4">
                            <div className="d-flex flex-column flex-md-row gap-3 align-items-center mb-4">
                                {/* Search Mode Switch */}
                                <div className="btn-group rounded-pill overflow-hidden border border-white border-opacity-10 p-1 bg-black bg-opacity-20" style={{ minWidth: '220px' }}>
                                    <button className={`btn btn-sm px-3 rounded-pill border-0 fw-bold transition-all ${searchMode === 'name' ? 'btn-emerald text-white shadow-emerald' : 'text-white-50 opacity-50'}`} onClick={() => setSearchMode('name')}>Pokémon</button>
                                    <button className={`btn btn-sm px-3 rounded-pill border-0 fw-bold transition-all ${searchMode === 'set' ? 'btn-emerald text-white shadow-emerald' : 'text-white-50 opacity-50'}`} onClick={() => setSearchMode('set')}>Sets</button>
                                    <button className={`btn btn-sm px-3 rounded-pill border-0 fw-bold transition-all ${searchMode === 'producto' ? 'btn-emerald text-white shadow-emerald' : 'text-white-50 opacity-50'}`} onClick={() => setSearchMode('producto')}>Producto</button>
                                </div>

                                <div className="flex-grow-1 w-100 position-relative" ref={suggestionsRef}>
                                    {searchMode !== 'set' ? (
                                        <div className="position-relative">
                                            <div className="input-group rounded-pill overflow-hidden border border-white border-opacity-10 bg-black bg-opacity-20">
                                                <span className="input-group-text bg-transparent border-0 ps-3 text-white-50"><i className="bi bi-search"></i></span>
                                                <input
                                                    type="text"
                                                    className="form-control border-0 bg-transparent text-white py-2"
                                                    placeholder={searchMode === 'producto' ? "Código de set (ej: sv1, swsh1)..." : "Nombre del Pokémon o carta..."}
                                                    value={tcgQuery}
                                                    onChange={(e) => setTcgQuery(e.target.value)}
                                                    onFocus={() => searchMode === 'name' && suggestions.length > 0 && setShowSuggestions(true)}
                                                    onKeyPress={e => e.key === 'Enter' && (setShowSuggestions(false), executeTcgSearch(1, true))}
                                                />
                                                <button className="btn btn-emerald px-4 fw-bold" onClick={() => { setShowSuggestions(false); executeTcgSearch(1, true); }}>Buscar</button>
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
                                    <div className="btn-group btn-group-sm rounded-pill overflow-hidden border border-white border-opacity-10 bg-black bg-opacity-20 p-1">
                                        {[
                                            { value: "-set.releaseDate", icon: "bi-calendar3", label: "Lanzamiento" },
                                            { value: "-tcgplayer.prices.holofoil.market", icon: "bi-sort-down", label: "Mayor Precio" }
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                className={`btn btn-sm px-3 rounded-pill border-0 transition-all ${tcgSort === opt.value ? 'btn-emerald text-white shadow-emerald' : 'text-white-50'}`}
                                                onClick={() => setTcgSort(opt.value)}
                                                title={opt.label}
                                            >
                                                <i className={`bi ${opt.icon}`}></i>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="row row-cols-1 g-3">
                                {tcgCards.map(card => (
                                    <div key={card.id} className="col">
                                        {searchMode === 'producto' ? (
                                            <ProductCard card={card} user={user} onAction={handleTcgAction} isInInventory={id => userInventory.some(c => c.id === id && c.inInventory)} formatPrice={formatPrice} />
                                        ) : (
                                            <TCGCard card={card} user={user} onAction={handleTcgAction} isInInventory={id => userInventory.some(c => c.id === id && c.inInventory)} formatPrice={formatPrice} />
                                        )}
                                    </div>
                                ))}

                                {tcgCards.length > 0 && !tcgLoading && (
                                    <div className="col-12 text-center mt-4">
                                        <button className="btn btn-outline-emerald rounded-pill px-5 py-2 fw-bold" onClick={() => { const next = tcgPage + 1; setTcgPage(next); executeTcgSearch(next, false); }}>
                                            Cargar más (Mostrando {tcgCards.length})
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
                .drop-shadow-card { filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5)); }
                .animate-fade-in { animation: fadeIn 0.4s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .form-select { border-color: rgba(255,255,255,0.1); }
                .form-select:focus { border-color: var(--pocky-primary); }
                .hover-bg-emerald-opacity:hover { background: rgba(var(--pocky-primary-rgb), 0.1); }
                .cursor-pointer { cursor: pointer; }
                .z-3 { z-index: 1050; }
            `}</style>
        </div>
    );
}
