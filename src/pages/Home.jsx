import React from 'react'
import { motion } from 'framer-motion'
import { Search, Droplets, Music, Palette, Trophy, TrendingUp, Star, RefreshCw } from 'lucide-react'

const MOCK_CARD = '/assets/mockup_card.png'
const ALL_CHARS = '/assets/characters/all_characters.png'

const expansions = [
  { name: 'Stellar Crown', icon: Palette, active: true },
  { name: 'Surging Sparks', icon: Droplets },
  { name: 'Twilight Masquerade', icon: Music },
  { name: 'Temporal Forces', icon: Trophy },
]

const HomePage = ({ role }) => {
  const isVendedor = role === 'Vendedor'

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-10"
    >
      {isVendedor ? (
        <div className="space-y-8">
          <header className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Panel de Control</h1>
            <p className="text-gray-400 text-sm">Gestiona tus ventas y publicaciones activas.</p>
          </header>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
              <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Ventas</p>
              <h2 className="text-2xl font-bold">$1,240.00</h2>
            </div>
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Activas</p>
              <h2 className="text-2xl font-bold">12 Cartas</h2>
            </div>
          </div>

          <section>
            <h2 className="section-title">Publicaciones Recientes</h2>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-3xl shadow-sm">
                  <div className="w-16 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={MOCK_CARD} alt="Card" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="font-bold text-sm">Hyper Rare Stellar {i}</p>
                    <p className="text-[10px] text-gray-400">Publicado hace 2h</p>
                    <p className="text-emerald-500 font-bold mt-1">$45.00</p>
                  </div>
                  <div className="flex items-center">
                    <button className="p-2 text-gray-300"><RefreshCw size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="search-container">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por expansión, idioma, rarity..." 
              className="search-input"
            />
          </div>

          {/* Expansions */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {expansions.map((ex) => (
              <button 
                key={ex.name} 
                className={`category-pill ${ex.active ? 'active' : ''}`}
              >
                <ex.icon size={18} />
                {ex.name}
              </button>
            ))}
          </div>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Trending Collections</h2>
              <TrendingUp size={18} className="text-emerald-500" />
            </div>

            <div className="space-y-6">
              {[1, 2, 3].map((id) => (
                <motion.div 
                  key={id}
                  className="collection-card group hover:shadow-xl transition-all"
                >
                  <div className="card-main-side">
                    <div className="main-image-container bg-emerald-50 flex items-center justify-center p-4">
                      <img 
                        src={MOCK_CARD} 
                        alt="Exp" 
                        className="rounded-lg object-contain w-full h-full transform group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <p className="card-title">Stellar Crown {id}</p>
                    <p className="card-subtitle">Recent Marketplace posts</p>
                  </div>
                  <div className="card-grid-side">
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} className="grid-item bg-gray-50 p-1">
                        <img src={ALL_CHARS} alt="item" className="w-full h-full object-cover rounded-lg" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      )}
    </motion.div>
  )
}

export default HomePage
