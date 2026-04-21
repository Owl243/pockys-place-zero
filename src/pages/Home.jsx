import React from 'react'
import { motion } from 'framer-motion'
import { Zap, TrendingUp, Star } from 'lucide-react'

const products = [
  { id: 1, name: 'Emerald Watch', price: '$299', category: 'Luxury' },
  { id: 2, name: 'Gray Velvet Chair', price: '$450', category: 'Home' },
  { id: 3, name: 'Sleek Keyboard', price: '$120', category: 'Tech' },
  { id: 4, name: 'Minimal Lamp', price: '$85', category: 'Decor' },
]

const HomePage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gradient">Pocky's Place</h1>
        <p className="text-slate-400">Curated for excellence.</p>
      </header>

      {/* Hero Banner */}
      <div className="relative h-40 rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-emerald-600 to-slate-900 flex items-center p-6 border border-emerald-500/30">
        <div className="z-10">
          <h2 className="text-xl font-bold mb-2">Summer Essentials</h2>
          <button className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-semibold border border-white/20">
            View Collection
          </button>
        </div>
        <div className="absolute right-[-20px] top-[-20px] opacity-20">
          <Zap size={160} />
        </div>
      </div>

      {/* Categories */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            Categories
          </h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {['Tech', 'Luxury', 'Home', 'Fashion'].map((cat) => (
            <div key={cat} className="flex-shrink-0 px-6 py-3 rounded-2xl glass text-sm font-medium border-emerald-500/10">
              {cat}
            </div>
          ))}
        </div>
      </section>

      {/* Products Grid */}
      <section>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Star size={18} className="text-emerald-500" />
          Featured
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="h-32 bg-slate-700/50 rounded-xl mb-3 flex items-center justify-center">
                <span className="text-slate-500 text-xs">Image Placeholder</span>
              </div>
              <h4 className="font-semibold text-sm mb-1">{product.name}</h4>
              <p className="text-emerald-400 font-bold text-sm">{product.price}</p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  )
}

export default HomePage
