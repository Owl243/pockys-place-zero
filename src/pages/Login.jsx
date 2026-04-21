import React from 'react'
import { motion } from 'framer-motion'
import { Store, ShoppingCart, ShieldCheck, Sparkles } from 'lucide-react'

const LoginPage = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="login-card w-full max-w-sm"
      >
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2.5rem] mx-auto flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 rotate-3">
            <Sparkles size={40} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Pocky's Place</h1>
          <p className="text-gray-400 text-sm font-medium">Marketplace Premium de TCG</p>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Selecciona tu perfil</p>
          
          <button 
            onClick={() => onLogin('Vendedor')}
            className="role-button group hover:border-emerald-500 transition-all"
          >
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Store size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-800">Soy Vendedor</p>
              <p className="text-[10px] text-gray-400">Publica tus cartas y gestiona ventas</p>
            </div>
          </button>

          <button 
            onClick={() => onLogin('Comprador')}
            className="role-button group hover:border-emerald-500 transition-all"
          >
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <ShoppingCart size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-800">Soy Comprador</p>
              <p className="text-[10px] text-gray-400">Busca las mejores cartas y colecciones</p>
            </div>
          </button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-gray-300">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-medium uppercase tracking-widest">Safe & Premium TCG Network</span>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
