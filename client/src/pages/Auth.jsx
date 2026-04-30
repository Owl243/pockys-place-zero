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
        <div className="container" style={{ maxWidth: "400px" }}>
            <h2 className="mb-3">{isLogin ? "Login" : "Registro"}</h2>

            <input
                type="email"
                className="form-control mb-2"
                placeholder="Correo"
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type="password"
                className="form-control mb-3"
                placeholder="Contraseña"
                onChange={(e) => setPassword(e.target.value)}
            />

            <button className="btn btn-primary w-100" onClick={handleSubmit}>
                {isLogin ? "Ingresar" : "Registrarse"}
            </button>

            <button
                className="btn btn-link w-100 mt-2"
                onClick={() => setIsLogin(!isLogin)}
            >
                {isLogin
                    ? "¿No tienes cuenta? Regístrate"
                    : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
        </div>
    );
}