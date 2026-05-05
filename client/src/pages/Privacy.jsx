import React from "react";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
    const navigate = useNavigate();

    return (
        <div className="container py-5" style={{ maxWidth: "800px" }}>
            <button className="btn btn-link text-emerald p-0 mb-4 text-decoration-none" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-2"></i> Volver
            </button>
            <h1 className="fw-bold text-white mb-4">Aviso de Privacidad</h1>
            <div className="text-white opacity-75" style={{ lineHeight: "1.8" }}>
                <p>Última actualización: Mayo 2026</p>
                <h4 className="text-emerald mt-4">1. Información que recopilamos</h4>
                <p>En Pocky's Place recopilamos la información que proporcionas directamente al crear tu cuenta, como tu nombre de usuario, correo electrónico, y teléfono de contacto.</p>
                <h4 className="text-emerald mt-4">2. Uso de la información</h4>
                <p>Utilizamos tu información para:
                    <ul>
                        <li>Crear y gestionar tu cuenta.</li>
                        <li>Facilitar la comunicación entre compradores y vendedores.</li>
                        <li>Mejorar y personalizar tu experiencia en la plataforma.</li>
                    </ul>
                </p>
                <h4 className="text-emerald mt-4">3. Compartir información</h4>
                <p>Tu información de perfil (nombre, foto y contacto) puede ser visible para otros usuarios registrados para propósitos de intercambio y venta de cartas. No vendemos tu información personal a terceros.</p>
                <h4 className="text-emerald mt-4">4. Seguridad</h4>
                <p>Tomamos medidas razonables para proteger tu información personal mediante el uso de tecnologías estándar de la industria (como los servicios de Firebase/Google Cloud).</p>
                <h4 className="text-emerald mt-4">5. Contacto</h4>
                <p>Si tienes alguna pregunta sobre este Aviso de Privacidad, puedes contactarnos a través de los administradores de la plataforma.</p>
            </div>
            <style>{`
                .text-emerald { color: #10b981 !important; }
            `}</style>
        </div>
    );
}
