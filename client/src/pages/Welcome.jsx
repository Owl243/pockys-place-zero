import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

// ─── Config de opciones ──────────────────────────────────────────────────────
const OPTIONS = [
    {
        id: "inventory",
        icon: "bi-box-seam-fill",
        userType: "TCG_Collector",
        badge: "COLECCIONISTA",
        title: "Gestionar mi colección",
        description: "Registra las cartas que tienes, arma tu wishlist y lleva el control total de tu colección.",
        benefits: ["Busca cualquier carta TCG", "Agrégala a tu inventario", "Márcalas como en venta"],
        color: "#3b82f6", // Blue
        route: "/search",
    },
    {
        id: "sell",
        icon: "bi-tag-fill",
        userType: "TCG_Seller_Pro",
        badge: "VENDEDOR",
        title: "Quiero vender cartas",
        description: "Encuentra compradores potenciales viendo lo que la comunidad está buscando activamente.",
        benefits: ["Ve la demanda en tiempo real", "Contacta compradores interesados", "Publica tu inventario"],
        color: "#10b981", // Emerald
        route: "/?tab=tendencias",
    },
    {
        id: "buy",
        icon: "bi-bag-heart-fill",
        userType: "TCG_Buyer_Fan",
        badge: "COMPRADOR",
        title: "Quiero conseguir cartas",
        description: "Explora lo que otros coleccionistas están poniendo en venta hoy mismo.",
        benefits: ["Feed de ventas dinámico", "Vendedores verificados primero", "Chat directo sin intermediarios"],
        color: "#f59e0b", // Amber/Gold
        route: "/?tab=ventas",
    }
];

export default function Welcome() {
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = useState(1); // Empezamos en "Vendedor" (centro)
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const nextCard = () => setActiveIndex((prev) => (prev + 1) % OPTIONS.length);
    const prevCard = () => setActiveIndex((prev) => (prev - 1 + OPTIONS.length) % OPTIONS.length);

    const handleStart = async () => {
        const selected = OPTIONS[activeIndex];
        try {
            const user = auth.currentUser;
            if (user) {
                await updateDoc(doc(db, "users", user.uid), {
                    intentType: selected.id,
                    onboardingCompleted: true
                });
            }
        } catch (e) {
            console.error("Error updating intent:", e);
        }
        navigate("/");
    };

    return (
        <div className="welcome-container py-2 py-md-4 px-3 overflow-hidden min-vh-100">
            <div className="max-w-700 mx-auto text-center mb-3 mb-md-4 animate-fade-in">
                <h1 className="fw-bold text-white mb-0" style={{ letterSpacing: "-0.03em", fontSize: "clamp(1.6rem, 5vw, 2.8rem)" }}>
                    Elige tu camino
                </h1>
                <p className="text-white-50 small mb-0">Desbloquea el potencial de Pocky's Place</p>
            </div>

            {/* ─── Carousel Section ─── */}
            <div className="carousel-wrapper position-relative mx-auto mb-3 mb-md-4">
                <div className="cards-container d-flex justify-content-center align-items-center">
                    {OPTIONS.map((opt, i) => {
                        const position = i - activeIndex;
                        const isActive = i === activeIndex;

                        return (
                            <div
                                key={opt.id}
                                className={`path-card p-3 p-md-4 rounded-5 ${isActive ? 'active' : ''}`}
                                style={{
                                    '--card-color': opt.color,
                                    '--card-color-rgb': hexToRgb(opt.color),
                                    transform: `translateX(${position * 55}%) scale(${isActive ? 1 : 0.85}) rotateY(${position * -12}deg)`,
                                    zIndex: isActive ? 10 : 5 - Math.abs(position),
                                    opacity: Math.abs(position) > 1 ? 0 : (isActive ? 1 : 0.4),
                                    pointerEvents: isActive ? 'auto' : 'none'
                                }}
                            >
                                {isActive && (
                                    <div className="position-absolute" style={{ 
                                        top: '-15px', left: '-15px', 
                                        width: '60px', height: '60px', 
                                        background: `radial-gradient(circle, rgba(${hexToRgb(opt.color)}, 0.2) 0%, transparent 70%)`,
                                        zIndex: -1
                                    }} />
                                )}

                                <div className="text-start">
                                    <span className="badge rounded-pill mb-2 fw-bold" style={{ background: `rgba(${hexToRgb(opt.color)}, 0.1)`, color: opt.color, border: `1px solid ${opt.color}33`, fontSize: '0.65rem' }}>
                                        {opt.badge}
                                    </span>
                                    <h3 className="fw-bold text-white mb-1" style={{ fontSize: '1.3rem' }}>{opt.title}</h3>
                                    <p className="text-white-50 small mb-2 lh-sm" style={{ fontSize: '0.8rem' }}>{opt.description}</p>

                                    <ul className="list-unstyled mb-0">
                                        {opt.benefits.map((b, idx) => (
                                            <li key={idx} className="d-flex align-items-center gap-2 mb-1">
                                                <div className="rounded-circle" style={{ width: 5, height: 5, backgroundColor: opt.color }}></div>
                                                <span className="text-white-50" style={{ fontSize: '0.75rem' }}>{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Navigation Controls */}
                <button className="nav-btn prev" onClick={prevCard}><i className="bi bi-chevron-left"></i></button>
                <button className="nav-btn next" onClick={nextCard}><i className="bi bi-chevron-right"></i></button>
            </div>

            {/* CTA (Smaller button) */}
            <div className="text-center mb-4">
                <button 
                    className="btn px-4 py-2 rounded-pill fw-bold text-white shadow-lg transition-all"
                    style={{ 
                        background: `linear-gradient(135deg, ${OPTIONS[activeIndex].color}, #000)`,
                        boxShadow: `0 8px 20px rgba(${hexToRgb(OPTIONS[activeIndex].color)}, 0.25)`,
                        fontSize: '0.85rem'
                    }}
                    onClick={handleStart}
                >
                    Comenzar como {OPTIONS[activeIndex].badge}
                </button>
            </div>

            {/* ─── PRO Comparison Section ─── */}
            <div className="pro-comparison mx-auto p-4 p-md-5 rounded-5 border border-white border-opacity-5 bg-dark bg-opacity-30 backdrop-blur" style={{ maxWidth: '800px' }}>
                <div className="row align-items-center g-4">
                    <div className="col-md-5">
                        <div className="badge bg-warning text-dark fw-bold mb-2" style={{ fontSize: '0.65rem' }}>POCKY'S PRO</div>
                        <h4 className="text-white fw-bold mb-2">Lleva tu colección al siguiente nivel</h4>
                        <p className="text-white-50 small mb-0">La suscripción PRO está diseñada para el coleccionista serio.</p>
                    </div>
                    <div className="col-md-7">
                        <div className="table-responsive">
                            <table className="table table-dark table-borderless align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                                <thead>
                                    <tr className="border-bottom border-white border-opacity-5">
                                        <th className="py-2 text-white-50 fw-normal">Beneficios</th>
                                        <th className="py-2 text-center text-white-50 fw-normal">Base</th>
                                        <th className="py-2 text-center text-warning fw-bold">PRO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="py-2 text-white-50">Insignia de Verificación</td>
                                        <td className="py-2 text-center text-white-50">—</td>
                                        <td className="py-2 text-center text-warning"><i className="bi bi-star-fill"></i></td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-white-50">Prioridad en Feed</td>
                                        <td className="py-2 text-center text-white-50">—</td>
                                        <td className="py-2 text-center text-success"><i className="bi bi-check2"></i></td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-white-50">Medios de Entrega</td>
                                        <td className="py-2 text-center text-white-50">1</td>
                                        <td className="py-2 text-center text-success">∞</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .welcome-container {
                    perspective: 1200px;
                    background: radial-gradient(circle at top right, rgba(16, 185, 129, 0.03), transparent 40%),
                                radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.03), transparent 40%);
                }
                .carousel-wrapper {
                    height: 480px;
                    max-width: 100%;
                }
                .cards-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                .path-card {
                    position: absolute;
                    width: 280px;
                    height: 400px;
                    background: rgba(13, 17, 23, 0.7);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                }
                .path-card.active {
                    border-color: rgba(var(--card-color-rgb), 0.4);
                    box-shadow: 0 0 30px rgba(var(--card-color-rgb), 0.1), 0 20px 40px rgba(0, 0, 0, 0.5);
                }
                .nav-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    z-index: 20;
                }
                .nav-btn.prev { left: 0px; }
                .nav-btn.next { right: 0px; }

                .extra-small { font-size: 0.7rem; }

                @media (max-width: 768px) {
                    .carousel-wrapper { height: 420px; }
                    .path-card { width: 240px; height: 360px; }
                    .nav-btn { width: 32px; height: 32px; font-size: 0.8rem; }
                    .nav-btn.prev { left: 5px; }
                    .nav-btn.next { right: 5px; }
                }

                .backdrop-blur { backdrop-filter: blur(12px); }
                .max-w-700 { max-width: 700px; }
                
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
            `}</style>
        </div>
    );
}

// Helper to convert hex to RGB for CSS variables
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}
