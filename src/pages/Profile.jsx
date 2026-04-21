import React from 'react'
import { motion } from 'framer-motion'
import { Settings, CreditCard, Package, LogOut, ChevronRight, UserCircle } from 'lucide-react'

const ProfilePage = ({ onLogout, userRole }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="flex items-center gap-6 mb-8 py-4">
        <div className="w-20 h-20 rounded-full border-4 border-emerald-500/10 p-1">
          <div className="w-full h-full rounded-full bg-emerald-50 flex items-center justify-center overflow-hidden text-emerald-500">
            <UserCircle size={60} strokeWidth={1} />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{userRole === 'Vendedor' ? 'Pocky Seller' : 'Pocky Collector'}</h2>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">{userRole}</p>
        </div>
      </header>

      <div className="space-y-3">
        {[
          { icon: Package, label: 'Historial', info: 'Ver mis movimientos', color: 'bg-blue-50 text-blue-500' },
          { icon: CreditCard, label: 'Pagos y Cobros', info: 'Gestionar métodos de pago', color: 'bg-emerald-50 text-emerald-500' },
          { icon: Settings, label: 'Ajustes', info: 'Seguridad y Notificaciones', color: 'bg-gray-50 text-gray-500' },
          { icon: UserCircle, label: 'Verificación', info: 'Estado: Premium', color: 'bg-purple-50 text-purple-500' },
        ].map((item, idx) => (
          <button key={idx} className="w-full p-4 rounded-2xl border border-gray-100 flex items-center gap-4 bg-white hover:bg-gray-50 transition-all group">
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon size={22} strokeWidth={2} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm text-gray-800">{item.label}</p>
              <p className="text-[10px] text-gray-400 font-medium">{item.info}</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
          </button>
        ))}

        <button 
          onClick={onLogout}
          className="w-full mt-8 flex items-center justify-center gap-2 p-4 text-red-500 font-bold text-sm bg-red-50 rounded-2xl hover:bg-red-100 transition-colors shadow-lg shadow-red-500/10"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </motion.div>
  )
}

export default ProfilePage
