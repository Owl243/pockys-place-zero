import React from 'react'
import { motion } from 'framer-motion'
import { User, Settings, CreditCard, ShoppingBag, LogOut, ChevronRight, HelpCircle, ShieldCheck } from 'lucide-react'

const ProfilePage = ({ onLogout, userRole }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24"
    >
      <header className="flex items-center gap-5 mb-8 py-6 border-b border-slate-700/50 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-[40px] pointer-events-none"></div>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] flex-shrink-0 z-10">
          <User size={36} strokeWidth={2} />
        </div>
        <div className="z-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {userRole === 'Vendedor' ? 'Panel de Vendedor' : 'Cuenta de Usuario'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Verificado • ID: 55920194</p>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">Mi Actividad</p>
        {[
          { icon: ShoppingBag, label: 'Mis Pedidos', info: 'Seguimiento y facturación', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: CreditCard, label: 'Billetera Digital', info: 'Métodos de pago y balance', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: Settings, label: 'Configuración', info: 'Seguridad y preferencias', color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: HelpCircle, label: 'Centro de Ayuda', info: 'Soporte técnico 24/7', color: 'text-slate-400', bg: 'bg-slate-800' },
        ].map((item, idx) => (
          <button key={idx} className="w-full flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl active:border-slate-600 active:bg-slate-800/80 active:scale-[0.98] transition-all group">
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
                <item.icon size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-white">{item.label}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">{item.info}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600" />
          </button>
        ))}

        <div className="pt-8">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-4 text-red-400 font-bold text-sm bg-red-500/5 border border-red-500/20 rounded-xl active:bg-red-500/10 active:border-red-500/30 active:scale-95 transition-all shadow-sm"
          >
            <LogOut size={18} />
            Desconectar Sesión
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default ProfilePage
