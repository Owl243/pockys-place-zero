import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Auth() {
    const navigate = useNavigate();
    const location = useLocation();

    // Detectar si viene con mode="register" desde el PublicFeed
    const [isLogin, setIsLogin] = useState(location.state?.mode !== "register");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Login fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Register-only fields
    const [username, setUsername] = useState("");
    const [phone, setPhone] = useState("");

    const [acceptTerms, setAcceptTerms] = useState(false);

    useEffect(() => {
        // Sincronizar si cambia el mode del state
        if (location.state?.mode === "register") setIsLogin(false);
        if (location.state?.mode === "login") setIsLogin(true);
    }, [location.state]);

    const handleSubmit = async () => {
        setError("");
        if (!email || !password) { setError("Completa todos los campos."); return; }
        if (!isLogin && !username.trim()) { setError("Elige un nombre de usuario."); return; }
        if (!isLogin && !acceptTerms) { setError("Debes aceptar los términos y condiciones."); return; }

        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                navigate("/");
            } else {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                // Update display name
                await updateProfile(cred.user, { displayName: username });
                // Save extended profile in Firestore
                await setDoc(doc(db, "users", cred.user.uid), {
                    uid: cred.user.uid,
                    username,
                    email,
                    phone: phone || "",
                    photoURL: "",
                    isPro: false,
                    createdAt: serverTimestamp()
                });
                // Go to onboarding welcome screen
                navigate("/welcome");
            }
        } catch (err) {
            const messages = {
                "auth/email-already-in-use": "Este correo ya está registrado.",
                "auth/invalid-email": "El correo no es válido.",
                "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
                "auth/user-not-found": "No existe una cuenta con ese correo.",
                "auth/wrong-password": "Contraseña incorrecta.",
                "auth/invalid-credential": "Correo o contraseña incorrectos."
            };
            setError(messages[err.code] || err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        color: "#fff",
        padding: "0.75rem 1rem",
        fontSize: "0.95rem",
        outline: "none",
        width: "100%",
        transition: "border-color 0.2s, box-shadow 0.2s"
    };

    const focusStyle = (e) => {
        e.target.style.borderColor = "rgba(16,185,129,0.5)";
        e.target.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.08)";
    };
    const blurStyle = (e) => {
        e.target.style.borderColor = "rgba(255,255,255,0.1)";
        e.target.style.boxShadow = "none";
    };

    return (
        <div className="d-flex align-items-center justify-content-center px-3" style={{ minHeight: "85vh" }}>
            <div
                className="position-relative overflow-hidden"
                style={{
                    maxWidth: "420px",
                    width: "100%",
                    background: "linear-gradient(145deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.97) 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "24px",
                    padding: "2.5rem 2rem",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.06)"
                }}
            >
                {/* Ambient glow */}
                <div className="position-absolute" style={{ width: "250px", height: "250px", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)", top: "-80px", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />

                {/* Logo */}
                <div className="text-center mb-4 position-relative">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{ width: "64px", height: "64px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                        <i className="bi bi-intersect" style={{ color: "#10b981", fontSize: "1.6rem" }} />
                    </div>
                    <h2 className="fw-bold text-white mb-1" style={{ fontSize: "1.4rem", letterSpacing: "-0.02em" }}>
                        Pocky's <span style={{ color: "#10b981" }}>Place</span>
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>
                        {isLogin ? "Bienvenido de vuelta, coleccionista." : "Únete a la comunidad TCG."}
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="d-flex rounded-3 mb-4 p-1" style={{ background: "rgba(255,255,255,0.05)" }}>
                    {[["Iniciar sesión", true], ["Registrarse", false]].map(([label, val]) => (
                        <button
                            key={label}
                            className="btn flex-grow-1 rounded-2 fw-bold py-2"
                            style={{
                                background: isLogin === val ? "rgba(16,185,129,0.15)" : "transparent",
                                border: isLogin === val ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
                                color: isLogin === val ? "#10b981" : "rgba(255,255,255,0.35)",
                                fontSize: "0.85rem",
                                transition: "all 0.2s"
                            }}
                            onClick={() => { setIsLogin(val); setError(""); }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Fields */}
                <div className="d-flex flex-column gap-3 mb-4">

                    {!isLogin && (
                        <div>
                            <label style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", marginBottom: "6px", display: "block" }}>
                                <i className="bi bi-person me-1" />Nombre de usuario *
                            </label>
                            <input
                                type="text"
                                style={inputStyle}
                                placeholder="@tu_usuario"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onFocus={focusStyle}
                                onBlur={blurStyle}
                            />
                        </div>
                    )}

                    <div>
                        <label style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", marginBottom: "6px", display: "block" }}>
                            <i className="bi bi-envelope me-1" />Correo electrónico *
                        </label>
                        <input
                            type="email"
                            style={inputStyle}
                            placeholder="correo@ejemplo.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                        />
                    </div>

                    <div>
                        <label style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", marginBottom: "6px", display: "block" }}>
                            <i className="bi bi-lock me-1" />Contraseña *
                        </label>
                        <input
                            type="password"
                            style={inputStyle}
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                            onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", marginBottom: "6px", display: "block" }}>
                                <i className="bi bi-telephone me-1" />Teléfono <span style={{ opacity: 0.4 }}>(para grupos y contacto)</span>
                            </label>
                            <input
                                type="tel"
                                style={inputStyle}
                                placeholder="+52 55 0000 0000"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                onFocus={focusStyle}
                                onBlur={blurStyle}
                            />
                        </div>
                    )}

                    {!isLogin && (
                        <label className="d-flex align-items-start gap-2" style={{ cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={e => setAcceptTerms(e.target.checked)}
                                style={{ marginTop: "3px", accentColor: "#10b981", flexShrink: 0 }}
                            />
                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", lineHeight: 1.5 }}>
                                Acepto los{" "}
                                <a href="/legal/terms" target="_blank" style={{ color: "#10b981" }}>Términos y Condiciones</a>
                                {" "}y el{" "}
                                <a href="/legal/privacy" target="_blank" style={{ color: "#10b981" }}>Aviso de Privacidad</a>
                            </span>
                        </label>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-3 p-3 rounded-3 d-flex align-items-center gap-2"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: "0.82rem" }}>
                        <i className="bi bi-exclamation-circle-fill flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    className="btn w-100 py-3 rounded-3 fw-bold text-white position-relative overflow-hidden"
                    style={{
                        background: loading ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg,#10b981,#059669)",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(16,185,129,0.25)",
                        fontSize: "0.95rem",
                        letterSpacing: "0.3px",
                        transition: "all 0.2s"
                    }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading
                        ? <><span className="spinner-border spinner-border-sm me-2" />Cargando...</>
                        : isLogin ? "Ingresar al Marketplace" : "Crear mi cuenta"
                    }
                </button>
            </div>
        </div>
    );
}