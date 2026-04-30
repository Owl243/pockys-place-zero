import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getInventory, saveCard } from "../services/inventoryService";
import { useToast } from "../context/ToastContext";
import { useCurrency } from "../context/CurrencyContext";

export default function Wishlist() {
    const showToast = useToast();
    const { formatPrice } = useCurrency();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        const user = auth.currentUser;
        if (!user) return;
        const data = await getInventory(user.uid);
        setCards(data.filter(c => c.inWishlist));
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const handleRemove = async (card) => {
        const user = auth.currentUser;
        if (!user) return;
        await saveCard(user.uid, card, { ...card, inWishlist: false });
        showToast(`${card.name} eliminada de la wishlist`, "pink");
        load();
    };

    const handleMoveToInventory = async (card) => {
        const user = auth.currentUser;
        if (!user) return;
        await saveCard(user.uid, card, { ...card, inInventory: true, inWishlist: false });
        showToast(`${card.name} movida al inventario`, "success");
        load();
    };

    const getPriceRaw = (card) => {
        const tcg = card.tcgplayer?.prices;
        if (!tcg) return null;
        const types = ['holofoil', 'normal', 'reverseHolofoil', '1stEditionHolofoil'];
        for (const type of types) {
            if (tcg[type]?.market) return tcg[type].market;
        }
        return null;
    };

    return (
        <div className="container py-3 mb-5">
            <div className="d-flex justify-content-between align-items-end mb-5">
                <div className="text-start">
                    <h2 className="fw-bold mb-1 text-white tracking-tight">Mi <span className="text-pink">Wishlist</span></h2>
                    <p className="text-light-muted small mb-0">Cartas que estás deseando conseguir</p>
                </div>
                <div className="px-3 py-2 rounded-pill border border-pink border-opacity-50 shadow-pink">
                    <span className="fw-bold text-pink small text-uppercase tracking-wider">{cards.length} Deseadas</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-grow text-pink" role="status"></div>
                </div>
            ) : cards.length === 0 ? (
                <div className="text-center py-5 bg-dark bg-opacity-25 rounded-5 border border-white border-opacity-5">
                    <i className="bi bi-heart-fill fs-1 text-pink opacity-25 mb-3 d-block"></i>
                    <p className="text-muted">Tu lista de deseos está vacía.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {cards.map((card) => (
                        <div className="col-6 col-md-4 col-lg-3 mb-4" key={card.id}>
                            <div className="card h-100 border-0 rounded-5 overflow-hidden bg-dark bg-opacity-30 backdrop-blur-sm border border-white border-opacity-5 shadow-2xl transition-all hover-translate-y-n2">
                                <div className="p-4 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center position-relative overflow-hidden" style={{ height: "260px" }}>
                                    <div className="position-absolute w-100 h-100 bg-pink opacity-20" style={{ filter: 'blur(60px)', top: '0', left: '0' }}></div>
                                    <img src={card.image} className="img-fluid h-100 object-fit-contain w-100 position-relative z-1 drop-shadow-card-pink" />
                                </div>
                                <div className="card-body p-4 text-start d-flex flex-column">
                                    <div className="mb-2 d-flex justify-content-between align-items-center">
                                        <span className="badge text-pink border border-pink border-opacity-30 rounded-pill px-2 py-1" style={{ fontSize: '0.6rem' }}>
                                            Deseada
                                        </span>
                                        {getPriceRaw(card) && (
                                            <span className="text-white fw-bold small opacity-75"><i className="bi bi-tag-fill text-pink me-1"></i>{formatPrice(getPriceRaw(card))}</span>
                                        )}
                                    </div>
                                    <h6 className="fw-bold mb-1 text-white text-truncate fs-6 opacity-90">{card.name}</h6>
                                    <p className="text-light-muted mb-4" style={{ fontSize: '0.7rem' }}>
                                        #{card.number} / {card.rarity || 'Common'} — {card.setName || 'Set Desconocido'}
                                    </p>
                                    <div className="mt-auto d-flex gap-2">
                                        <button className="btn btn-outline-pink flex-grow-1 btn-sm rounded-4 py-2 fw-bold text-white" onClick={() => handleMoveToInventory(card)}>
                                            ¡La tengo!
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
                .text-pink { color: #ff4b91 !important; }
                .btn-outline-pink { border: 2px solid #ff4b91; color: #ff4b91 !important; background: transparent; }
                .btn-outline-pink:hover { background-color: #ff4b91; color: white !important; }
            `}</style>
        </div>
    );
}