import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Home, Search, ShoppingBag, User, Menu, PlusSquare, List } from 'lucide-react'
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
      <div className="min-h-screen bg-slate-50">
        {/* Top Header */}
        <header className="main-header">
          <div className="flex items-center gap-4">
            <Menu className="text-slate-600 lg:hidden" size={20} />
            <h1>Pocky's Place</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="role-badge">{userRole}</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
              <User size={18} />
            </div>
          </div>
        </header>

        <main className="page-container">
          <Routes>
            <Route path="/" element={<HomePage role={userRole} />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/publish" element={<PublishPage />} />
            <Route path="/profile" element={<ProfilePage onLogout={logout} userRole={userRole} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Bottom Navigation */}
        <nav className="main-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Home size={20} />
            <span>Home</span>
          </NavLink>

          {userRole === 'Comprador' ? (
            <>
              <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Search size={20} />
                <span>Explorar</span>
              </NavLink>
              <NavLink to="/cart" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <ShoppingBag size={20} />
                <span>Carrito</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/publish" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <PlusSquare size={20} />
                <span>Vender</span>
              </NavLink>
              <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <List size={20} />
                <span>Ventas</span>
              </NavLink>
            </>
          )}

          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <User size={20} />
            <span>Perfil</span>
          </NavLink>
        </nav>
      </div>
    </Router>
  )
}

export default App
