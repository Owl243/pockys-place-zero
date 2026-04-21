import React from 'react'
import { motion } from 'framer-motion'
import { Search, TrendingUp, Package, Filter, ChevronRight, Bookmark, Zap } from 'lucide-react'

const HomePage = ({ role }) => {
  const isVendedor = role === 'Vendedor'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24">

      {isVendedor ? (
        <div className="space-y-6">
          <header className="relative">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/20 blur-[40px] pointer-events-none"></div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="text-emerald-400" />
              Dashboard Principal
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitor en tiempo real de tu tienda.
            </p>
          </header>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card border-l-4 border-l-emerald-500 relative overflow-hidden active:scale-95 transition-all">
               <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-[20px]"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ingresos de Hoy</p>
              <h2 className="text-2xl font-black text-emerald-400">$2,450.00</h2>
            </div>

            <div className="glass-card border-l-4 border-l-blue-500 relative overflow-hidden active:scale-95 transition-all">
               <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-[20px]"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Publicaciones Activas</p>
              <h2 className="text-2xl font-black text-white">45</h2>
            </div>
          </div>
        </div>

      ) : (
        <div className="space-y-6">
          {/* SEARCH */}
          <div className="flex gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-700/50 shadow-inner">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Buscar cartas, sets..."
                className="w-full pl-10 pr-3 py-2 bg-transparent text-white outline-none font-medium placeholder-slate-500"
              />
            </div>
            <button className="bg-slate-800 active:bg-slate-700 px-3 rounded-xl border border-slate-700 transition-colors active:scale-95">
              <Filter size={18} className="text-blue-400" />
            </button>
          </div>

          {/* CATEGORÍAS */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['Destacados', 'Nuevos', 'Sets', 'Rarezas', 'Subastas'].map((cat, id) => (
              <button
                key={id}
                className={`px-4 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all border active:scale-95
                  ${id === 0
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 font-bold shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                    : 'bg-slate-800 text-slate-400 border-slate-700 active:border-slate-500'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* MARKET */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <Zap className="text-blue-500" size={20} />
                Mercado Activo
              </h2>
              <button className="text-xs font-bold text-blue-400 flex items-center active:scale-95 transition-all">
                Ver todo <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((id) => (
                <div
                  key={id}
                  className="card-item p-3 active:border-blue-500/30 active:scale-[0.98] transition-all group"
                >
                  {/* Imagen */}
                  <div className="aspect-square bg-slate-900 border border-slate-800 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden transition-colors">
                    <Package size={32} className="text-slate-700" />
                  </div>

                  {/* Nombre */}
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-xs font-bold text-white truncate">
                      Holo Set Carta #{id}
                    </h3>
                    <Bookmark size={14} className="text-slate-500 active:text-blue-400 ml-1 flex-shrink-0" />
                  </div>

                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                    Expansión · NM
                  </p>

                  {/* Precio */}
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800">
                    <p className="text-emerald-400 font-black text-sm">
                      $29.99
                    </p>
                    <button className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-md text-[10px] font-bold transition-all border border-blue-500/30 active:scale-95">
                      Comprar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      )}
    </motion.div>
  )
}

export default HomePage