import React from 'react'
import { motion } from 'framer-motion'
import { Trash2, ArrowRight } from 'lucide-react'

const CartPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="section-title text-xl">Shopping Bag</h2>

      <div className="space-y-4 mb-8">
        <div className="p-4 rounded-2xl border border-gray-100 flex items-center gap-4 bg-white shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-xl flex-shrink-0 flex items-center justify-center p-2">
            <img src="https://images.pokemontcg.io/sv7/symbol.png" alt="item" className="object-contain" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-gray-800">Stellar Crown Booster</h4>
            <p className="text-emerald-500 font-bold text-xs">$4.99</p>
          </div>
          <button className="p-2 text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="p-6 rounded-3xl space-y-4 border border-gray-100 bg-gray-50">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-semibold text-gray-800">$4.99</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Shipping</span>
          <span className="text-emerald-600 font-medium">Calculated at next step</span>
        </div>
        <div className="pt-4 border-t border-gray-200 flex justify-between font-bold text-lg text-gray-900">
          <span>Total</span>
          <span>$4.99</span>
        </div>
        
        <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 mt-4 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
          Checkout
          <ArrowRight size={20} />
        </button>
      </div>
    </motion.div>
  )
}

export default CartPage
