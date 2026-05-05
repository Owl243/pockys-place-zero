import { useState, useEffect } from "react";
import { addRequest } from "../services/firebaseService";
import { auth } from "../firebase";
import { saveCard, getInventory } from "../services/inventoryService";
import { useToast } from "../context/ToastContext";
import { postToFeed, postWishlistPublic } from "../services/feedService";
import { useCurrency } from "../context/CurrencyContext";
import { getPriceRaw, normalizeCardNumber } from "../utils/cardUtils";

export default function Search() {
    const showToast = useToast();
    const { formatPrice } = useCurrency();
    const [query, setQuery] = useState("");
    const [cards, setCards] = useState([]);
    const [sets, setSets] = useState([]);
    const [selectedSet, setSelectedSet] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userInventory, setUserInventory] = useState([]);
    
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [setsPage, setSetsPage] = useState(1);
    const setsPerPage = 6;
    const pageSize = 20;

    const [restored, setRestored] = useState(false);
    const [sortBy, setSortBy] = useState("number");

    useEffect(() => {
        const savedSearch = localStorage.getItem("last_search_state");
        if (savedSearch) {
            try {
                const state = JSON.parse(savedSearch);
                setQuery(state.query || "");
                setCards(state.cards || []);
                setSets(state.sets || []);
                setSelectedSet(state.selectedSet || null);
                setPage(state.page || 1);
                setTotalCount(state.totalCount || 0);
                setSetsPage(state.setsPage || 1);
                setSortBy(state.sortBy || "number");
            } catch (e) {
                console.error("Error al restaurar búsqueda:", e);
            }
        }
        setRestored(true);

        const fetchData = async () => {
            const saved = savedSearch ? JSON.parse(savedSearch) : null;
            if (!saved || !saved.sets || saved.sets.length === 0) {
                const resSets = await fetch("https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate");
                const dataSets = await resSets.json();
                setSets(dataSets.data);
            }
            const user = auth.currentUser;
            if (user) {
                try {
                    const inv = await getInventory(user.uid);
                    setUserInventory(inv);
                } catch (err) {
                    console.error("Error al cargar inventario inicial:", err);
                }
            }
        };
        fetchData();
    }, []);

    // Persistir estado cuando cambie (solo después de restaurar)
    useEffect(() => {
        if (!restored) return;
        const state = { query, cards, sets, selectedSet, page, totalCount, setsPage, sortBy };
        localStorage.setItem("last_search_state", JSON.stringify(state));
    }, [query, cards, sets, selectedSet, page, totalCount, setsPage, restored, sortBy]);

    const executeSearch = async (resetPage = true, nameOverride = null, setOverride = undefined, sortOverride = undefined) => {
        if (!restored && !setOverride) return; 
        
        const searchTerm = nameOverride !== null ? nameOverride : query;
        const currentSet = setOverride !== undefined ? setOverride : selectedSet;
        const currentSort = sortOverride !== undefined ? sortOverride : sortBy;
        const currentPage = resetPage ? 1 : page;
        
        if (resetPage) setPage(1);
        
        if (!searchTerm && !currentSet) {
            setCards([]);
            setTotalCount(0);
            return;
        }

        setLoading(true);
        let q = "";
        if (searchTerm) {
            q += `name:"*${searchTerm}*"`;
            addRequest(searchTerm);
        }
        if (currentSet) {
            q += (q ? " " : "") + `set.id:${currentSet}`;
        }

        // Determinar el campo de ordenamiento
        let orderBy = currentSort;
        if (currentSort === "price") {
            orderBy = "-tcgplayer.prices.holofoil.market,-tcgplayer.prices.normal.market";
        } else if (currentSort === "number") {
            // Algunos sets nuevos necesitan 'number' explícito
            orderBy = "number";
        }

        try {
            const limit = pageSize;
            const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&page=${currentPage}&pageSize=${limit}&orderBy=${orderBy}`);
            const data = await res.json();
            let results = data.data || [];

            // 🛠️ ORDENAMIENTO NATURAL LOCAL (Fix para sets nuevos como Ascended/Perfect Order)
            if (currentSort === "number") {
                results.sort((a, b) => {
                    const numA = normalizeCardNumber(a.number);
                    const numB = normalizeCardNumber(b.number);
                    return numA.localeCompare(numB);
                });
            }

            setCards(results);
            setTotalCount(data.totalCount || 0);
        } catch (error) {
            console.error("Error en búsqueda:", error);
            showToast("Error al buscar cartas", "error");
        } finally {
            setLoading(false);
            if (resetPage) window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleSortChange = (e) => {
        const val = e.target.value;
        setSortBy(val);
        executeSearch(true, null, undefined, val);
    };

    const toggleSet = (setId) => {
        const newSet = selectedSet === setId ? null : setId;
        setSelectedSet(newSet);
        executeSearch(true, null, newSet);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        // Usamos un timeout pequeño para asegurar que setPage se procesó (o pasamos el valor directo)
        // Pero mejor pasamos el valor directo a executeSearch para evitar problemas de estado asíncrono
        setTimeout(() => {
            // El executeSearch interno usará el nuevo 'page' si no reseteamos
        }, 0);
    };

    // Trigger de página (reacciona a cualquier cambio de página)
    useEffect(() => {
        if (restored) {
            executeSearch(false);
        }
    }, [page]);

    const handleAction = async (card, type) => {
        const user = auth.currentUser;
        if (!user) { showToast("Debes iniciar sesión para guardar cartas", "error"); return; }
        
        const dataMap = {
            inventory: { inInventory: true, inWishlist: false, forSale: false, label: "Inventario", toastType: "success" },
            wishlist: { inInventory: false, inWishlist: true, forSale: false, label: "Wishlist", toastType: "pink" },
            sale: { inInventory: true, inWishlist: false, forSale: true, label: "Venta", toastType: "error" }
        };
        
        const action = dataMap[type];
        await saveCard(user.uid, card, { inInventory: action.inInventory, inWishlist: action.inWishlist, forSale: action.forSale });
        
        if (type === 'sale') {
            await postToFeed(user.uid, user.displayName || user.email.split("@")[0], user.photoURL, 'sale', card, user);
        }
        if (type === 'wishlist') {
            await postWishlistPublic(user.uid, user.displayName || user.email.split("@")[0], user.photoURL, card);
        }

        const inv = await getInventory(user.uid);
        setUserInventory(inv);
        
        showToast(`${card.name} añadida a ${action.label}`, action.toastType);
    };

    const isInInventory = (cardId) => userInventory.some(c => c.id === cardId && c.inInventory);

    const lastSetIndex = setsPage * setsPerPage;
    const firstSetIndex = lastSetIndex - setsPerPage;
    const currentSets = sets.slice(firstSetIndex, lastSetIndex);
    const totalSetPages = Math.ceil(sets.length / setsPerPage);



    return (
        <div className="container py-3 mb-5">
            {/* ... (Header and Set Selector) */}
            <h2 className="fw-bold mb-4 text-start tracking-tight text-white">Pocky's <span className="text-emerald">Collector</span></h2>

            <div className="mb-5 bg-dark bg-opacity-40 p-4 rounded-5 border border-white border-opacity-5 shadow-2xl backdrop-blur-md">
                <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                    <div>
                        <label className="small fw-bold text-emerald text-uppercase mb-0 tracking-wider">Sets de Cartas</label>
                        <p className="mb-0 text-light-muted small">Explora por colección</p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button className="btn btn-sm btn-outline-secondary rounded-circle border-opacity-25" disabled={setsPage === 1} onClick={() => setSetsPage(p => p - 1)}><i className="bi bi-chevron-left text-white"></i></button>
                        <span className="small fw-bold text-white opacity-50">{setsPage} / {totalSetPages}</span>
                        <button className="btn btn-sm btn-outline-secondary rounded-circle border-opacity-25" disabled={setsPage === totalSetPages} onClick={() => setSetsPage(p => p + 1)}><i className="bi bi-chevron-right text-white"></i></button>
                    </div>
                </div>
                <div className="row g-3">
                    {sets.length === 0 ? (
                        <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-emerald" role="status"></div></div>
                    ) : currentSets.map(set => (
                        <div key={set.id} className="col-6 col-md-4 col-lg-2">
                            <div onClick={() => toggleSet(set.id)} className={`h-100 d-flex flex-column align-items-center justify-content-center p-3 rounded-4 transition-all duration-300 border ${selectedSet === set.id ? "border-emerald bg-emerald bg-opacity-10 shadow-emerald scale-105" : "border-white border-opacity-5 bg-dark bg-opacity-40 hover-bg-opacity-60"}`} style={{ cursor: "pointer", minHeight: "90px" }}>
                                <img src={set.images.symbol} alt={set.name} loading="lazy" style={{ width: "28px", height: "28px", objectFit: "contain" }} className={`mb-2 ${selectedSet === set.id ? "drop-shadow-emerald" : "opacity-70"}`} />
                                <span className={`fw-bold text-center text-truncate w-100 ${selectedSet === set.id ? "text-emerald" : "text-white opacity-90"}`} style={{ fontSize: '0.7rem' }}>{set.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="position-relative mb-5 mx-auto" style={{ maxWidth: '800px' }}>
                <div className="row g-3">
                    <div className="col-12 col-md-8">
                        <div className="input-group shadow-2xl rounded-pill overflow-hidden border border-white border-opacity-10 bg-dark bg-opacity-40 backdrop-blur-xl">
                            <span className="input-group-text bg-transparent border-0 ps-4 text-emerald"><i className="bi bi-search fs-5"></i></span>
                            <input type="text" className="form-control border-0 py-3 ps-2 bg-transparent text-white" placeholder="Buscar Pokémon..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && executeSearch(true)} />
                            <button className="btn btn-emerald px-5 fw-bold text-white shadow-emerald" onClick={() => executeSearch(true)}>Buscar</button>
                        </div>
                    </div>
                    <div className="col-12 col-md-4">
                        <div className="input-group shadow-2xl rounded-pill overflow-hidden border border-white border-opacity-10 bg-dark bg-opacity-40 backdrop-blur-xl h-100">
                            <span className="input-group-text bg-transparent border-0 ps-3 text-emerald"><i className="bi bi-sort-down"></i></span>
                            <select className="form-select border-0 bg-transparent text-white small" value={sortBy} onChange={handleSortChange} style={{ cursor: 'pointer' }}>
                                <option value="number" className="bg-dark">Número</option>
                                <option value="price" className="bg-dark">Precio (Máx-Min)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-grow text-emerald" role="status"></div></div>
            ) : (
                <div className="row g-4">
                    {cards.map((card) => (
                        <div className="col-6 col-md-4 col-lg-3 mb-4" key={card.id}>
                            <div className="card h-100 border-0 rounded-5 overflow-hidden bg-dark bg-opacity-30 backdrop-blur-sm border border-white border-opacity-5 shadow-2xl transition-all hover-translate-y-n2">
                                <div className="p-4 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center position-relative overflow-hidden" style={{ height: "260px" }}>
                                    <div className="position-absolute w-100 h-100 bg-emerald opacity-20" style={{ filter: 'blur(60px)', top: '0', left: '0' }}></div>
                                    <img src={card.images.small} loading="lazy" className="img-fluid h-100 object-fit-contain w-100 position-relative z-1 drop-shadow-card" />
                                </div>
                                <div className="card-body p-4 text-start d-flex flex-column">
                                    <div className="mb-2 d-flex flex-wrap justify-content-between align-items-center gap-1">
                                        <span className="badge text-emerald border border-emerald border-opacity-30 rounded-pill px-2 py-1" style={{ fontSize: '0.6rem' }}>{card.set.name}</span>
                                        <span className="text-white fw-bold small opacity-75 ms-auto">
                                            <i className="bi bi-tag-fill text-emerald me-1"></i>
                                            {getPriceRaw(card) ? formatPrice(getPriceRaw(card)) : "N/A"}
                                        </span>
                                    </div>
                                    <h6 className="fw-bold mb-1 text-white text-truncate fs-6 opacity-90">{card.name}</h6>
                                    <p className="text-light-muted mb-4" style={{ fontSize: '0.7rem' }}>
                                        #{card.number} / {card.rarity || 'Common'} — {card.set.name}
                                    </p>
                                    <div className="mt-auto d-flex flex-wrap gap-2">
                                        <button className="btn btn-outline-emerald flex-grow-1 btn-sm rounded-4 py-2 fw-bold" onClick={() => handleAction(card, "inventory")}>Tengo</button>
                                        <button className="btn btn-outline-pink flex-grow-1 btn-sm rounded-4 py-2 fw-bold text-white" onClick={() => handleAction(card, "wishlist")}>Quiero</button>
                                        <button className={`btn flex-grow-1 btn-sm rounded-4 py-2 fw-bold ${isInInventory(card.id) ? 'btn-outline-danger' : 'btn-outline-danger opacity-25'}`} disabled={!isInInventory(card.id)} onClick={() => handleAction(card, "sale")}>Vendo</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {totalCount > pageSize && !loading && (
                <div className="d-flex justify-content-center align-items-center gap-4 mt-5 pb-5">
                    <button className="btn btn-outline-secondary border-opacity-25 rounded-circle p-2 text-white" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ width: '50px', height: '50px' }}><i className="bi bi-arrow-left"></i></button>
                    <div className="bg-dark bg-opacity-60 px-4 py-2 rounded-pill border border-white border-opacity-5"><span className="fw-bold text-white small opacity-75">Pág. {page} / {Math.ceil(totalCount / pageSize)}</span></div>
                    <button className="btn btn-outline-secondary border-opacity-25 rounded-circle p-2 text-white" disabled={cards.length < pageSize} onClick={() => setPage(p => p + 1)} style={{ width: '50px', height: '50px' }}><i className="bi bi-arrow-right"></i></button>
                </div>
            )}
            
            <style>{`
                .btn-outline-pink { border: 2px solid #ff4b91; color: #ff4b91 !important; background: transparent; }
                .btn-outline-pink:hover { background-color: #ff4b91; color: white !important; box-shadow: 0 0 15px rgba(255, 75, 145, 0.4); }
                .btn-outline-emerald { border: 2px solid #10b981; color: #10b981 !important; background: transparent; }
                .btn-outline-emerald:hover { background-color: #10b981; color: white !important; box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
                .shadow-emerald { box-shadow: 0 0 20px rgba(16, 185, 129, 0.25); }
                .drop-shadow-emerald { filter: drop-shadow(0 0 5px rgba(16, 185, 129, 0.5)); }
                .drop-shadow-card { filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(16, 185, 129, 0.2)); }
                .hover-translate-y-n2:hover { transform: translateY(-8px); }
                .form-select:focus { box-shadow: none; border-color: #10b981; }
            `}</style>
        </div>
    );
}