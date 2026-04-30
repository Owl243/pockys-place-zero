import { useState } from "react";
import { login, register } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function Auth() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async () => {
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password);
            }

            // 🔥 REDIRECCIÓN
            navigate("/");
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
            <div className="card bg-dark bg-opacity-50 backdrop-blur-md border border-white border-opacity-10 shadow-2xl rounded-5 p-4 p-md-5 w-100 position-relative overflow-hidden" style={{ maxWidth: "420px" }}>
                {/* Glow de fondo */}
                <div className="position-absolute bg-emerald opacity-20 rounded-circle" style={{ width: '200px', height: '200px', filter: 'blur(80px)', top: '-50px', left: '-50px', zIndex: 0 }}></div>
                
                <div className="text-center mb-5 position-relative z-1">
                    <div className="d-inline-flex justify-content-center align-items-center bg-dark border border-white border-opacity-10 rounded-circle mb-3 shadow-lg" style={{ width: '70px', height: '70px' }}>
                        <i className="bi bi-box-fill text-emerald fs-2"></i>
                    </div>
                    <h2 className="fw-bold text-white mb-1">
                        Pocky's <span className="text-emerald">Place</span>
                    </h2>
                    <p className="text-white text-opacity-50 small mb-0">
                        {isLogin ? "Bienvenido de vuelta, coleccionista." : "Únete a la comunidad TCG."}
                    </p>
                </div>

                <div className="mb-3 position-relative z-1">
                    <div className="input-group">
                        <span className="input-group-text bg-dark border-secondary border-opacity-25 text-white text-opacity-50 rounded-start-4 border-end-0 px-3">
                            <i className="bi bi-envelope"></i>
                        </span>
                        <input
                            type="email"
                            className="form-control bg-dark text-white border-secondary border-opacity-25 py-3 rounded-end-4 border-start-0 ps-0"
                            placeholder="Correo electrónico"
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ boxShadow: 'none' }}
                        />
                    </div>
                </div>

                <div className="mb-4 position-relative z-1">
                    <div className="input-group">
                        <span className="input-group-text bg-dark border-secondary border-opacity-25 text-white text-opacity-50 rounded-start-4 border-end-0 px-3">
                            <i className="bi bi-lock"></i>
                        </span>
                        <input
                            type="password"
                            className="form-control bg-dark text-white border-secondary border-opacity-25 py-3 rounded-end-4 border-start-0 ps-0"
                            placeholder="Contraseña"
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ boxShadow: 'none' }}
                        />
                    </div>
                </div>

                <button 
                    className="btn w-100 py-3 rounded-pill fw-bold text-white transition-all hover-scale-105 position-relative z-1" 
                    style={{ 
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        border: '2px solid #10b981',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#10b981';
                        e.currentTarget.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onClick={handleSubmit}
                >
                    {isLogin ? "Ingresar al Marketplace" : "Crear mi cuenta"}
                </button>

                <div className="text-center mt-4 position-relative z-1">
                    <button
                        className="btn btn-link text-white text-opacity-50 small text-decoration-none p-0 hover-text-white transition-all"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin
                            ? "¿Nuevo aquí? Regístrate gratis"
                            : "¿Ya tienes cuenta? Inicia sesión"}
                    </button>
                </div>
            </div>
        </div>
    );
}