import React from 'react'
import { motion } from 'framer-motion'
import { Trash2, ArrowRight, Package } from 'lucide-react'

const CartPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24"
    >
      <h2 className="section-title">
        <Package className="text-blue-500" />
        Bolsa de Compras
      </h2>

      <div className="space-y-4 mb-8">
        <div className="card-item p-4 flex items-center gap-4 bg-slate-900/50">
          <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-xl flex-shrink-0 flex items-center justify-center p-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent z-0"></div>
            <img src="https://images.pokemontcg.io/sv7/symbol.png" alt="item" className="object-contain relative z-10" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-slate-100">Stellar Crown Booster</h4>
            <p className="text-emerald-400 font-bold text-sm">$4.99</p>
          </div>
          <button className="p-3 text-red-400 bg-red-400/10 rounded-xl active:scale-95 transition-all">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="glass-card space-y-4 border-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px]"></div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 font-medium">Subtotal</span>
          <span className="font-bold text-slate-200">$4.99</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 font-medium">Envío</span>
          <span className="text-emerald-400 font-medium">Calculado al final</span>
        </div>
        
        <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center">
          <span className="text-slate-400 font-bold">Total</span>
          <span className="font-black text-2xl text-white tracking-tight">$4.99</span>
        </div>
        
        <button className="w-full btn-sales mt-6 text-base active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          Procesar Pago
          <ArrowRight size={20} className="ml-1" />
        </button>
      </div>
    </motion.div>
  )
}

export default CartPage
