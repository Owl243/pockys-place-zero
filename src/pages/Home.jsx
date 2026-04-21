import React from 'react'
import { motion } from 'framer-motion'
import { Search, TrendingUp, Package, Clock, Filter, ChevronRight, Bookmark } from 'lucide-react'

const HomePage = ({ role }) => {
  const isVendedor = role === 'Vendedor'

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-10"
    >
      {isVendedor ? (
        <div className="space-y-6">
          <header>
            <h1 className="text-xl font-bold text-slate-900">Dashboard de Vendedor</h1>
            <p className="text-slate-500 text-sm">Monitor de inventario y estado de ventas.</p>
          </header>

          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Ventas Hoy</p>
              <h2 className="text-2xl font-bold text-slate-900">$2,450.00</h2>
            </div>
            <div className="card">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Publicaciones</p>
              <h2 className="text-2xl font-bold text-slate-900">45</h2>
            </div>
          </div>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Publicaciones Recientes</h2>
              <button className="text-blue-500 text-xs font-bold">Ver Todo</button>
            </div>
            
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="card flex items-center justify-between p-4 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">Product Entry #{i}</p>
                      <p className="text-xs text-slate-400">Actualizado hace 2h · Stellar Crown</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-slate-900">$45.00</p>
                    <p className="text-[10px] text-green-600 font-bold uppercase">En Venta</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search Area */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar expansión, carta o vendedor..." 
                className="input pl-10"
              />
            </div>
            <button className="btn btn-secondary px-3">
              <Filter size={18} />
            </button>
          </div>

          {/* Quick Categories */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {['Subastas', 'Nuevos', 'Stellar Crown', 'Sets', 'Rarezas'].map((cat, id) => (
              <button key={id} className={`btn border-slate-200 text-sm whitespace-nowrap ${id === 0 ? 'btn-primary' : 'btn-secondary'}`}>
                {cat}
              </button>
            ))}
          </div>

          <section>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                <h2 className="text-lg font-bold text-slate-900">Mercado Destacado</h2>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </div>

            <div className="marketplace-grid">
              {[1, 2, 3, 4, 5, 6].map((id) => (
                <div key={id} className="card group">
                  <div className="aspect-square bg-slate-50 rounded-md mb-4 flex items-center justify-center border border-slate-100 group-hover:bg-slate-100 transition-colors">
                    <Package size={32} className="text-slate-200 group-hover:text-slate-300" />
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm text-slate-800 line-clamp-1">Product Batch #{id}</h3>
                    <Bookmark size={16} className="text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-400 mb-4">Expansión Stellar · NM</p>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                    <p className="font-bold text-slate-900">$29.99</p>
                    <button className="text-[10px] font-bold text-blue-500 uppercase">Ver Detalles</button>
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
