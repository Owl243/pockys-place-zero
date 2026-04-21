import React from 'react'
import { Store, User, Shield } from 'lucide-react'

const LoginPage = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-lg mx-auto flex items-center justify-center mb-4 shadow-lg">
            <Store size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pocky's Place</h1>
          <p className="text-slate-500 mt-2 font-medium">Marketplace Profesional de Coleccionables</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Iniciar sesión como</p>
          
          <div className="space-y-3">
            <button 
              onClick={() => onLogin('Vendedor')}
              className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-900 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-50 rounded-md text-slate-600 group-hover:bg-slate-900 group-hover:text-white">
                  <Store size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-slate-900">Vendedor</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Gestionar Inventario</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onLogin('Comprador')}
              className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-900 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-50 rounded-md text-slate-600 group-hover:bg-slate-900 group-hover:text-white">
                  <User size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-slate-900">Comprador</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Explorar Mercado</p>
                </div>
              </div>
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-top border-slate-100 flex items-center justify-center gap-2 text-slate-400">
            <Shield size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Infraestructura Segura</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
