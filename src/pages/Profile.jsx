import React from 'react'
import { motion } from 'framer-motion'
import { Settings, CreditCard, Package, LogOut, ChevronRight } from 'lucide-react'

const ProfilePage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <header className="flex items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-slate-800 p-1">
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
            <span className="text-2xl font-bold text-emerald-400">P</span>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Pocky User</h1>
          <p className="text-slate-400 text-sm">pocky@market.com</p>
        </div>
      </header>

      <div className="space-y-3">
        {[
          { icon: Package, label: 'My Orders', info: '2 Active' },
          { icon: CreditCard, label: 'Payment Methods', info: 'Visa ending in 4242' },
          { icon: Settings, label: 'Settings', info: 'Preferences, Profile' },
        ].map((item, idx) => (
          <button key={idx} className="w-full glass p-5 rounded-2xl flex items-center gap-4 hover:border-emerald-500/30 transition-all group">
            <div className="p-3 bg-slate-800 rounded-xl text-emerald-500 group-hover:text-emerald-400 transition-colors">
              <item.icon size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-[10px] text-slate-500">{item.info}</p>
            </div>
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        ))}

        <button className="w-full mt-6 flex items-center justify-center gap-2 p-4 text-rose-500 font-semibold text-sm">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </motion.div>
  )
}

export default ProfilePage
