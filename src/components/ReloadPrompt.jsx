import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[2000] flex justify-center">
      <div className="glass p-4 rounded-2xl flex items-center gap-4 shadow-2xl border-emerald-500/30 w-fit max-w-[90vw] fade-in">
        <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
          <RefreshCw size={20} className={needRefresh ? 'animate-spin' : ''} />
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {offlineReady ? 'App ready to work offline' : 'New version available!'}
          </p>
          {needRefresh && (
            <p className="text-[10px] text-slate-400">Click update to get the latest features.</p>
          )}
        </div>

        <div className="flex gap-2">
          {needRefresh && (
            <button 
              onClick={() => updateServiceWorker(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              Update
            </button>
          )}
          <button 
            onClick={() => close()}
            className="p-2 text-slate-500 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReloadPrompt
