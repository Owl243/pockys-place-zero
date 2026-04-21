import React from 'react'
import { motion } from 'framer-motion'
import { Trash2, ArrowRight } from 'lucide-react'

const CartPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1 className="text-2xl font-bold mb-6">Your Bag</h1>

      <div className="space-y-4 mb-8">
        <div className="glass p-4 rounded-3xl flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Emerald Watch</h4>
            <p className="text-emerald-400 font-bold text-xs">$299.00</p>
          </div>
          <button className="p-2 text-slate-500">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl space-y-4 border-emerald-500/20">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Subtotal</span>
          <span>$299.00</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Shipping</span>
          <span className="text-emerald-400">Free</span>
        </div>
        <div className="pt-4 border-t border-slate-700 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>$299.00</span>
        </div>
        
        <button className="btn-primary w-full flex items-center justify-center gap-2 mt-4 py-4">
          Checkout
          <ArrowRight size={20} />
        </button>
      </div>
    </motion.div>
  )
}

export default CartPage
