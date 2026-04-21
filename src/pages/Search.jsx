import React from 'react'
import { motion } from 'framer-motion'
import { Search as SearchIcon, Filter, Zap } from 'lucide-react'

const SearchPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24"
    >
      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={20} />
        <input 
          type="text" 
          placeholder="Buscar cartas, sets, rarezas..." 
          className="w-full h-14 pl-12 pr-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium shadow-inner"
        />
      </div>

      <div className="flex items-center gap-3 mb-8">
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs font-bold text-blue-400 active:bg-blue-500/20 active:scale-95 transition-all">
          <Filter size={16} />
          Filtros
        </button>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['Más Recientes', 'Populares', 'Menor Precio', 'Mayor Precio'].map(tag => (
            <span key={tag} className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 active:border-slate-500 cursor-pointer active:scale-95 transition-all text-xs font-semibold text-slate-300">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card-item p-3 flex gap-4 cursor-pointer active:scale-[0.98] transition-all">
            <div className="w-24 h-24 bg-slate-900 border border-slate-700/50 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden">
               <Zap size={24} className="text-blue-400" />
            </div>
            <div className="flex flex-col justify-center py-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">Único</span>
                <span className="text-[10px] text-slate-400 font-medium">Stellar Crown</span>
              </div>
              <h4 className="font-bold text-white mb-1">Ultra Rare Collection {i}</h4>
              <p className="text-emerald-400 font-bold text-lg mt-auto flex items-center gap-1">
                $149.99
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default SearchPage
