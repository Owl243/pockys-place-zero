import { useState, useEffect } from "react";
import { addRequest } from "../services/firebaseService";
import { auth } from "../firebase";
import { saveCard, getInventory } from "../services/inventoryService";
import { useToast } from "../context/ToastContext";

export default function Search() {
    const showToast = useToast();
    const [query, setQuery] = useState("");
    const [cards, setCards] = useState([]);
    const [sets, setSets] = useState([]);
    const [selectedSets, setSelectedSets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userInventory, setUserInventory] = useState([]);
    
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [setsPage, setSetsPage] = useState(1);
    const setsPerPage = 6;
    const pageSize = 20;

    useEffect(() => {
        const fetchData = async () => {
            const resSets = await fetch("https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate");
            const dataSets = await resSets.json();
            setSets(dataSets.data);
            const user = auth.currentUser;
            if (user) {
                const inv = await getInventory(user.uid);
                setUserInventory(inv);
            }
        };
        fetchData();
    }, []);

    const executeSearch = async (resetPage = true, nameOverride = null) => {
        const searchTerm = nameOverride !== null ? nameOverride : query;
        const currentPage = resetPage ? 1 : page;
        if (resetPage) setPage(1);
        if (!searchTerm && selectedSets.length === 0) {
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
        if (selectedSets.length > 0) {
            const setQuery = selectedSets.map(id => `set.id:${id}`).join(" OR ");
            q += (q ? " " : "") + `(${setQuery})`;
        }
        try {
            const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&page=${currentPage}&pageSize=${pageSize}`);
            const data = await res.json();
            setCards(data.data);
            setTotalCount(data.totalCount);
        } catch (error) {
            console.error("Error en búsqueda:", error);
            showToast("Error al buscar cartas", "error");
        } finally {
            setLoading(false);
            if (resetPage) window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    useEffect(() => {
        if (selectedSets.length > 0 || query) {
            executeSearch(false);
        }
    }, [page, selectedSets]);

    const toggleSet = (setId) => {
        setSelectedSets(prev => prev.includes(setId) ? prev.filter(id => id !== setId) : [...prev, setId]);
    };

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
            <h2 className="fw-bold mb-4 text-start tracking-tight text-white">Pocky's <span className="text-emerald">Collector</span></h2>

            <div className="mb-5 bg-dark bg-opacity-40 p-4 rounded-5 border border-white border-opacity-5 shadow-2xl backdrop-blur-md">
                <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                    <div>
                        <label className="small fw-bold text-primary text-uppercase mb-0 tracking-wider">Sets de Cartas</label>
                        <p className="mb-0 text-muted small">Explora por colección</p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button className="btn btn-sm btn-outline-secondary rounded-circle border-opacity-25" disabled={setsPage === 1} onClick={() => setSetsPage(p => p - 1)}><i className="bi bi-chevron-left text-white"></i></button>
                        <span className="small fw-bold text-white opacity-50">{setsPage} / {totalSetPages}</span>
                        <button className="btn btn-sm btn-outline-secondary rounded-circle border-opacity-25" disabled={setsPage === totalSetPages} onClick={() => setSetsPage(p => p + 1)}><i className="bi bi-chevron-right text-white"></i></button>
                    </div>
                </div>
                <div className="row g-3">
                    {currentSets.map(set => (
                        <div key={set.id} className="col-6 col-md-4 col-lg-2">
                            <div onClick={() => toggleSet(set.id)} className={`h-100 d-flex flex-column align-items-center justify-content-center p-3 rounded-4 transition-all duration-300 border ${selectedSets.includes(set.id) ? "border-primary bg-primary bg-opacity-10 shadow-blue scale-105" : "border-white border-opacity-5 bg-dark bg-opacity-40 hover-bg-opacity-60"}`} style={{ cursor: "pointer", minHeight: "90px" }}>
                                <img src={set.images.symbol} alt={set.name} style={{ width: "28px", height: "28px", objectFit: "contain" }} className={`mb-2 ${selectedSets.includes(set.id) ? "drop-shadow-blue" : "opacity-50"}`} />
                                <span className={`fw-bold text-center text-truncate w-100 ${selectedSets.includes(set.id) ? "text-primary" : "text-white opacity-90"}`} style={{ fontSize: '0.7rem' }}>{set.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="position-relative mb-5 mx-auto" style={{ maxWidth: '700px' }}>
                <div className="input-group shadow-2xl rounded-pill overflow-hidden border border-white border-opacity-10 bg-dark bg-opacity-40 backdrop-blur-xl">
                    <span className="input-group-text bg-transparent border-0 ps-4 text-emerald"><i className="bi bi-search fs-5"></i></span>
                    <input type="text" className="form-control border-0 py-3 ps-2 bg-transparent text-white" placeholder="Buscar Pokémon..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && executeSearch(true)} />
                    <button className="btn btn-outline-emerald px-5 fw-bold" onClick={() => executeSearch(true)}>Buscar</button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-grow text-emerald" role="status"></div></div>
            ) : (
                <div className="row g-4">
                    {cards.map((card) => (
                        <div className="col-6 col-md-4 col-lg-3 mb-4" key={card.id}>
                            <div className="card h-100 border-0 rounded-5 overflow-hidden bg-dark bg-opacity-30 backdrop-blur-sm border border-white border-opacity-5 shadow-2xl">
                                <div className="p-4 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center position-relative overflow-hidden" style={{ height: "260px" }}>
                                    <div className="position-absolute w-100 h-100 bg-emerald opacity-5" style={{ filter: 'blur(50px)', top: '10%', left: '10%' }}></div>
                                    <img src={card.images.small} className="img-fluid h-100 object-fit-contain w-100 position-relative z-1 drop-shadow-card" />
                                </div>
                                <div className="card-body p-4 text-start d-flex flex-column">
                                    <div className="mb-2"><span className="badge bg-emerald bg-opacity-10 text-emerald border border-emerald border-opacity-20 rounded-pill px-2 py-1" style={{ fontSize: '0.6rem' }}>{card.set.name}</span></div>
                                    <h6 className="fw-bold mb-4 text-white text-truncate fs-5 opacity-90">{card.name}</h6>
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
                .shadow-blue { box-shadow: 0 0 20px rgba(13, 110, 253, 0.25); }
                .drop-shadow-blue { filter: drop-shadow(0 0 5px rgba(13, 110, 253, 0.5)); }
            `}</style>
        </div>
    );
}