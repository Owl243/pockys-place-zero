import React from "react";
import { useNavigate } from "react-router-dom";

export default function Terms() {
    const navigate = useNavigate();

    return (
        <div className="container py-5" style={{ maxWidth: "800px" }}>
            <button className="btn btn-link text-emerald p-0 mb-4 text-decoration-none" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-2"></i> Volver
            </button>
            <h1 className="fw-bold text-white mb-4">Términos y Condiciones</h1>
            <div className="text-white opacity-75" style={{ lineHeight: "1.8" }}>
                <p>Última actualización: Mayo 2026</p>
                <h4 className="text-emerald mt-4">1. Aceptación de los Términos</h4>
                <p>Al acceder o utilizar Pocky's Place, aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo, no utilices nuestros servicios.</p>
                <h4 className="text-emerald mt-4">2. Uso de la Plataforma</h4>
                <p>Pocky's Place es una plataforma comunitaria para facilitar el contacto entre coleccionistas de TCG. No somos intermediarios en las transacciones financieras. El uso de la plataforma es bajo tu propio riesgo.</p>
                <h4 className="text-emerald mt-4">3. Conducta del Usuario</h4>
                <p>Te comprometes a tratar con respeto a otros miembros de la comunidad. Las cuentas pueden ser suspendidas o eliminadas (baneadas) si se detecta fraude, acoso, o mal uso de la plataforma.</p>
                <h4 className="text-emerald mt-4">4. Ventas y Responsabilidad</h4>
                <p>Pocky's Place no garantiza el estado de las cartas ni la veracidad de los vendedores. Toda negociación, pago, y entrega se acuerda directamente entre los usuarios.</p>
                <h4 className="text-emerald mt-4">5. Modificaciones</h4>
                <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Continuar usando la plataforma implica la aceptación de los nuevos términos.</p>
            </div>
            <style>{`
                .text-emerald { color: #10b981 !important; }
            `}</style>
        </div>
    );
}
