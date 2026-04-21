import React from 'react'
import { motion } from 'framer-motion'
import { Search as SearchIcon, Filter } from 'lucide-react'

const SearchPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="search-container">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search for items..." 
          className="search-input"
        />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl text-xs font-semibold text-emerald-600 border border-emerald-100">
          <Filter size={14} />
          Filters
        </button>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['Newest', 'Popular', 'Price: Low', 'Price: High'].map(tag => (
            <span key={tag} className="flex-shrink-0 px-4 py-2 rounded-xl bg-gray-50 text-[10px] text-gray-500 border border-gray-100">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 flex items-center justify-center">
              <span className="text-[10px] text-gray-300">Image</span>
            </div>
            <div className="flex flex-col justify-center">
              <h4 className="font-semibold text-sm mb-1 text-gray-800">Ultra Rare Collection {i}</h4>
              <p className="text-emerald-500 font-bold text-xs">$149.99</p>
              <p className="text-gray-400 text-[10px] mt-1">Stellar Crown Expansion</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default SearchPage
