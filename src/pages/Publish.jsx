import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronRight, AlertCircle, FileText, UploadCloud } from 'lucide-react'

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
      className="pb-24"
    >
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Nueva Publicación</h1>
        <p className="text-slate-400 text-sm mt-1">Completa los detalles técnicos para listar tu producto.</p>
      </header>

      <form onSubmit={handlePublish} className="space-y-6">
        
        <div className="glass-card">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50 mb-4">
            <FileText size={18} className="text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Información General</h2>
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

        <div className="glass-card">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50 mb-4">
            <AlertCircle size={18} className="text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Inventario y Precio</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Conservación</label>
              <select className="select">
                <option>Mint (M)</option>
                <option>Near Mint (NM)</option>
                <option>Lightly Played (LP)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Precio ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
                <input type="number" placeholder="0.00" className="input pl-8 text-emerald-400 font-bold placeholder-slate-600" />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full btn-primary text-base py-4 h-auto shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          <UploadCloud size={20} className="mr-1" />
          Finalizar y Publicar
        </button>
      </form>

      {/* Formal Success Notification */}
      {published && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="fixed inset-0 z-[2000] bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="glass-card border-blue-500/30 text-center max-w-sm w-full relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 blur-[50px]"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              <Check size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Publicación Exitosa</h2>
            <p className="text-slate-400 text-sm mb-8">El producto se ha añadido a tu catálogo activo del marketplace.</p>
            <button onClick={() => setPublished(false)} className="w-full btn-primary">Gestionar Inventario</button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default PublishPage
