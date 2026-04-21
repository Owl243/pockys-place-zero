import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, CheckCircle2, ChevronRight, Info } from 'lucide-react'

const PublishPage = () => {
  const [published, setPublished] = useState(false)

  const handlePublish = (e) => {
    e.preventDefault()
    setPublished(true)
    setTimeout(() => setPublished(false), 3000)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-10"
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Publicar Carta</h1>
        <p className="text-gray-400 text-sm">Vende tus cartas Pokémon con los mejores coleccionistas.</p>
      </header>

      <form onSubmit={handlePublish} className="space-y-6">
        {/* Photo Upload Area */}
        <div className="relative published-preview-container bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 overflow-hidden group">
          <img 
            src="/assets/mockup_card.png" 
            alt="Mockup" 
            className="absolute inset-0 w-full h-full object-contain opacity-20 grayscale group-hover:opacity-40 transition-opacity" 
          />
          <div className="z-10 text-center">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
              <Camera size={28} />
            </div>
            <p className="font-bold text-gray-800">Cargar Foto de la Carta</p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Mínimo 1080p · Frontal y Trasera</p>
          </div>
        </div>

        {/* Expansion Selection */}
        <div className="input-group">
          <label className="input-label">Expansión / Set</label>
          <select className="form-select">
            <option>Stellar Crown (SV7)</option>
            <option>Surging Sparks (SV8)</option>
            <option>Twilight Masquerade (SV6)</option>
            <option>Temporal Forces (SV5)</option>
          </select>
        </div>

        {/* Language Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">Idioma</label>
            <select className="form-select">
              <option>Español</option>
              <option>Inglés</option>
              <option>Japonés</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Estado</label>
            <select className="form-select">
              <option>Mint (M)</option>
              <option>Near Mint (NM)</option>
              <option>Lightly Played (LP)</option>
            </select>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Precio Sugerido ($)</label>
          <input type="number" placeholder="299.99" className="form-input" />
        </div>

        <button type="submit" className="btn-full flex items-center justify-center gap-2 mt-4">
          Publicar Ahora
          <ChevronRight size={20} />
        </button>
      </form>

      {/* Success Modal */}
      {published && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="fixed inset-0 z-[3000] bg-white/80 backdrop-blur-md flex items-center justify-center p-6"
        >
          <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-emerald-100 text-center max-w-sm">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">¡Publicado!</h2>
            <p className="text-gray-400 text-sm">Tu carta ya está visible para todos los compradores.</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default PublishPage
