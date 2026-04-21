import React from 'react'
import { Store, User, Shield } from 'lucide-react'

const LoginPage = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 border border-blue-500/50 text-blue-400 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Store size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">CardPlace</h1>
          <p className="text-slate-400 font-medium">Marketplace Premium para TCG</p>
        </div>

        <div className="glass-card">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-full h-px bg-slate-800"></span>
            Acceder
            <span className="w-full h-px bg-slate-800"></span>
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={() => onLogin('Vendedor')}
              className="w-full flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl active:bg-slate-800 active:border-blue-500/50 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-800/80 rounded-lg text-blue-400">
                  <Store size={22} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-white">Vendedor</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Gestionar Inventario</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onLogin('Comprador')}
              className="w-full flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl active:bg-slate-800 active:border-blue-500/50 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-800/80 rounded-lg text-emerald-400">
                  <User size={22} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-white">Comprador</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Explorar Mercado</p>
                </div>
              </div>
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-slate-500">
            <Shield size={14} className="text-blue-500/50" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Infraestructura Segura</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
