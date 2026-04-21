import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check, ChevronRight, AlertCircle, FileText } from 'lucide-react'

const PublishPage = () => {
  const [published, setPublished] = useState(false)

  const handlePublish = (e) => {
    e.preventDefault()
    setPublished(true)
    setTimeout(() => setPublished(false), 3000)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-10"
    >
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Nueva Publicación</h1>
        <p className="text-slate-500 text-sm">Completa los detalles técnicos para listar tu producto.</p>
      </header>

      <form onSubmit={handlePublish} className="space-y-6">
        {/* Detail Section */}
        <div className="card space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <FileText size={18} className="text-slate-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Información General</h2>
          </div>

          <div className="form-group">
            <label>Título del Producto</label>
            <input type="text" placeholder="Ej. Lote de Cartas Stellar Crown - NM" className="input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Expansión / Set</label>
              <select className="select">
                <option>Stellar Crown (SV7)</option>
                <option>Surging Sparks (SV8)</option>
                <option>Temporal Forces (SV5)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Idioma</label>
              <select className="select">
                <option>Español</option>
                <option>Inglés</option>
                <option>Japonés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory & Price Section */}
        <div className="card space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <AlertCircle size={18} className="text-slate-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Inventario y Precio</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Estado de Conservación</label>
              <select className="select">
                <option>Mint (M)</option>
                <option>Near Mint (NM)</option>
                <option>Lightly Played (LP)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Precio de Venta ($)</label>
              <input type="number" placeholder="0.00" className="input" />
            </div>
          </div>

          <div className="form-group">
            <label>Descripción Adicional</label>
            <textarea 
              className="input h-32 py-3 resize-none" 
              placeholder="Detalles sobre el envío o estado específico..."
            ></textarea>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full shadow-lg shadow-blue-500/10 gap-2">
          Finalizar y Publicar
          <ChevronRight size={18} />
        </button>
      </form>

      {/* Formal Success Notification */}
      {published && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <div className="bg-white p-8 rounded-xl shadow-2xl border border-slate-200 text-center max-w-sm">
            <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Publicación Exitosa</h2>
            <p className="text-slate-500 text-sm mb-6">El producto se ha añadido a tu catálogo activo correctamente.</p>
            <button onClick={() => setPublished(false)} className="btn btn-primary w-full">Entendido</button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default PublishPage
