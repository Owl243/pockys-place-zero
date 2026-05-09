import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getInventory, saveCard } from "../services/inventoryService";
import { useToast } from "../context/ToastContext";
import { postToFeed } from "../services/feedService";
import { useCurrency } from "../context/CurrencyContext";
import { getPriceRaw } from "../utils/cardUtils";

export default function Inventory() {
    const showToast = useToast();
    const { formatPrice } = useCurrency();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        const user = auth.currentUser;
        if (!user) return;
        const data = await getInventory(user.uid);
        setCards(data.filter(c => c.inInventory));
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const handleRemove = async (card) => {
        const user = auth.currentUser;
        if (!user) return;
        
        if (card.forSale) {
            showToast("Debes quitar la venta antes de eliminar del inventario", "error");
            return;
        }

        await saveCard(user.uid, card, { ...card, inInventory: false });
        showToast(`${card.name} eliminada del inventario`, "error");
        load();
    };

    const handleSale = async (card) => {
        const user = auth.currentUser;
        if (!user) return;
        const newStatus = !card.forSale;
        await saveCard(user.uid, card, { ...card, forSale: newStatus });
        if (newStatus) {
            await postToFeed(user.uid, user.displayName || user.email.split("@")[0], user.photoURL, 'sale', card, user);
        } else {
            await postToFeed(user.uid, user.displayName || user.email.split("@")[0], user.photoURL, 'sale_finished', card, user);
        }

        showToast(newStatus ? `${card.name} puesta en venta` : `${card.name} retirada de venta`, newStatus ? "error" : "success");
        load();
    };



    return (
        <div className="container py-3 mb-5">
            <div className="d-flex justify-content-between align-items-end mb-5">
                <div className="text-start">
                    <h2 className="fw-bold mb-1 text-white tracking-tight">Mi <span className="text-emerald">Inventario</span></h2>
                    <p className="text-light-muted small mb-0">Gestiona tu colección personal de cartas</p>
                </div>
                <div className="bg-emerald bg-opacity-10 px-3 py-2 rounded-4 border border-emerald border-opacity-30 shadow-emerald">
                    <span className="fw-bold text-emerald">{cards.length} Cartas</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-grow text-emerald" role="status"></div>
                </div>
            ) : cards.length === 0 ? (
                <div className="text-center py-5 bg-dark bg-opacity-25 rounded-5 border border-white border-opacity-5">
                    <i className="bi bi-box-seam fs-1 text-muted mb-3 d-block"></i>
                    <p className="text-muted">Aún no tienes cartas en tu inventario.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {cards.map((card) => (
                        <div className="col-6 col-md-4 col-lg-3 mb-4" key={card.id}>
                            <div className="card h-100 border-0 rounded-5 overflow-hidden bg-dark bg-opacity-30 backdrop-blur-sm border border-white border-opacity-5 shadow-2xl transition-all hover-translate-y-n2">
                                <div className="p-4 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center position-relative overflow-hidden" style={{ height: "260px" }}>
                                    <div className="position-absolute w-100 h-100 bg-emerald opacity-20" style={{ filter: 'blur(60px)', top: '0', left: '0' }}></div>
                                    <img src={card.image} className="img-fluid h-100 object-fit-contain w-100 position-relative z-1 drop-shadow-card" />
                                </div>
                                <div className="card-body p-4 text-start d-flex flex-column">
                                    <div className="mb-2 d-flex flex-wrap justify-content-between align-items-center gap-1">
                                        <div className="d-flex gap-1 flex-wrap">
                                            <span className="badge text-emerald border border-emerald border-opacity-30 rounded-pill px-2 py-1" style={{ fontSize: '0.6rem' }}>
                                                Colección
                                            </span>
                                            {card.forSale && (
                                                <span className="badge text-danger border border-danger border-opacity-30 rounded-pill px-2 py-1" style={{ fontSize: '0.6rem' }}>
                                                    En Venta
                                                </span>
                                            )}
                                        </div>
                                        {getPriceRaw(card) && (
                                            <span className="text-white fw-bold small opacity-75 ms-auto"><i className="bi bi-tag-fill text-emerald me-1"></i>{formatPrice(getPriceRaw(card))}</span>
                                        )}
                                    </div>
                                    <h6 className="fw-bold mb-1 text-white text-truncate fs-6 opacity-90">{card.name}</h6>
                                    <p className="text-light-muted mb-4" style={{ fontSize: '0.7rem' }}>
                                        #{card.number} / {card.rarity || 'Common'} — {card.setName || 'Set Desconocido'}
                                    </p>
                                    <div className="mt-auto d-flex gap-2">
                                        <button 
                                            className={`btn ${card.forSale ? 'btn-danger shadow-danger-sm' : 'btn-outline-danger'} flex-grow-1 btn-sm rounded-4 py-2 fw-bold`} 
                                            onClick={() => handleSale(card)}
                                        >
                                            {card.forSale ? 'Quitar Venta' : 'Vender'}
                                        </button>
                                        <button className="btn btn-outline-secondary border-opacity-25 flex-grow-1 btn-sm rounded-4 py-2 fw-bold text-white" onClick={() => handleRemove(card)}>
                                            Quitar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <style>{`
                .drop-shadow-card { filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(var(--pocky-primary-rgb), 0.2)); }
                .shadow-danger-sm { box-shadow: 0 0 10px rgba(220, 53, 69, 0.3); }
                .hover-translate-y-n2:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(var(--pocky-primary-rgb), 0.15); }
            `}</style>
        </div>
    );
}
