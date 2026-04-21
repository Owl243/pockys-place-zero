import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Home as HomeIcon, Search, ShoppingBag, User, Menu, PlusSquare, List, Zap } from 'lucide-react'
import HomePage from './pages/Home'
import SearchPage from './pages/Search'
import CartPage from './pages/Cart'
import ProfilePage from './pages/Profile'
import LoginPage from './pages/Login'
import PublishPage from './pages/Publish'

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('pocky_role'))

  useEffect(() => {
    if (userRole) {
      localStorage.setItem('pocky_role', userRole)
    } else {
      localStorage.removeItem('pocky_role')
    }
  }, [userRole])

  const login = (role) => setUserRole(role)
  const logout = () => setUserRole(null)

  if (!userRole) {
    return <LoginPage onLogin={login} />
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-500/30 font-sans">
        {/* Header */}
        <header className="main-header">
          <div className="flex items-center gap-4">
            <Menu className="text-slate-400 active:text-white transition-colors lg:hidden active:scale-95" size={22} />
            <h1 className="font-black text-xl tracking-tight flex items-center gap-2 cursor-pointer active:scale-95 transition-transform">
              <Zap className="text-blue-500 fill-blue-500/20" size={20} />
              CardPlace
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="role-badge">{userRole}</span>
            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-blue-400 border border-slate-700/50 shadow-inner active:border-blue-500/50 active:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all cursor-pointer active:scale-95">
              <User size={18} />
            </div>
          </div>
        </header>

        <main className="page-container relative z-10">
          <Routes>
            <Route path="/" element={<HomePage role={userRole} />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/publish" element={<PublishPage />} />
            <Route path="/profile" element={<ProfilePage onLogout={logout} userRole={userRole} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Bottom Nav */}
        <nav className="main-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <HomeIcon size={22} />
            <span className="text-[10px]">Inicio</span>
          </NavLink>

          {userRole === 'Comprador' ? (
            <>
              <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Search size={22} />
                <span className="text-[10px]">Explorar</span>
              </NavLink>
              <NavLink to="/cart" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <ShoppingBag size={22} />
                <span className="text-[10px]">Bolsa</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/publish" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <PlusSquare size={22} />
                <span className="text-[10px]">Vender</span>
              </NavLink>
              <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <List size={22} />
                <span className="text-[10px]">Ventas</span>
              </NavLink>
            </>
          )}

          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <User size={22} />
            <span className="text-[10px]">Perfil</span>
          </NavLink>
        </nav>
      </div>
    </Router>
  )
}

export default App