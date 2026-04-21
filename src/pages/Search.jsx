import React from 'react'
import { motion } from 'framer-motion'
import { Search as SearchIcon, Filter } from 'lucide-react'

const SearchPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
    >
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Discover</h1>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-all text-sm"
          />
        </div>
      </header>

      <div className="flex items-center gap-2 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-xs font-semibold text-emerald-400">
          <Filter size={14} />
          Filters
        </button>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['Newest', 'Popular', 'Price: Low', 'Price: High'].map(tag => (
            <span key={tag} className="flex-shrink-0 px-4 py-2 rounded-xl bg-slate-800 text-[10px] text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass p-4 rounded-2xl flex gap-4">
            <div className="w-20 h-20 bg-slate-700/50 rounded-xl flex-shrink-0" />
            <div className="flex flex-col justify-center">
              <h4 className="font-semibold text-sm mb-1">Premium Item {i}</h4>
              <p className="text-emerald-400 font-bold text-xs">$149.99</p>
              <p className="text-slate-500 text-[10px] mt-1">Free Shipping</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default SearchPage
