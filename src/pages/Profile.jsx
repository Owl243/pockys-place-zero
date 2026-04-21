import React from 'react'
import { motion } from 'framer-motion'
import { User, Settings, CreditCard, ShoppingBag, LogOut, ChevronRight, HelpCircle } from 'lucide-react'

const ProfilePage = ({ onLogout, userRole }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto"
    >
      <header className="flex items-center gap-6 mb-10 py-6 border-b border-slate-200">
        <div className="w-20 h-20 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
          <User size={40} strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {userRole === 'Vendedor' ? 'Panel de Vendedor' : 'Cuenta de Usuario'}
          </h2>
          <p className="text-sm font-bold uppercase tracking-wider text-slate-400 mt-1">ID: 55920194</p>
        </div>
      </header>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Mi Actividad</p>
        {[
          { icon: ShoppingBag, label: 'Mis Pedidos', info: 'Seguimiento y facturación', color: 'text-slate-600' },
          { icon: CreditCard, label: 'Billetera Digital', info: 'Métodos de pago y balance', color: 'text-slate-600' },
          { icon: Settings, label: 'Configuración', info: 'Seguridad y preferencias', color: 'text-slate-600' },
          { icon: HelpCircle, label: 'Centro de Ayuda', info: 'Soporte técnico 24/7', color: 'text-slate-600' },
        ].map((item, idx) => (
          <button key={idx} className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg hover:border-slate-300 transition-all group">
            <div className="flex items-center gap-4">
              <div className={`p-2 bg-slate-50 rounded-md ${item.color}`}>
                <item.icon size={18} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-slate-900">{item.label}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase">{item.info}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
          </button>
        ))}

        <div className="pt-8">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-4 text-slate-900 font-bold text-sm border-2 border-slate-900 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm"
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
