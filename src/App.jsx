import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Home, Heart, BarChart2, User, Menu, PlusCircle, Package } from 'lucide-react'
import HomePage from './pages/Home'
import SearchPage from './pages/Search'
import CartPage from './pages/Cart'
import ProfilePage from './pages/Profile'
import LoginPage from './pages/Login'
import PublishPage from './pages/Publish'
import ReloadPrompt from './components/ReloadPrompt'

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
      <div className="min-h-screen bg-white text-gray-900 pb-20">
        {/* Top Header */}
        <header className="main-header">
          <button className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold text-gray-800">Pocky's Place</h1>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{userRole}</span>
          </div>
          <div className="profile-container flex items-center justify-center bg-emerald-50 text-emerald-600">
            <User size={24} strokeWidth={2.5} />
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
        <nav className="glass-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'text-[#10b981]' : 'text-gray-300'}`}>
            {({ isActive }) => <Home size={28} strokeWidth={isActive ? 2.5 : 2} />}
          </NavLink>

          {userRole === 'Comprador' ? (
            <>
              <NavLink to="/search" className={({ isActive }) => `nav-link ${isActive ? 'text-[#10b981]' : 'text-gray-300'}`}>
                {({ isActive }) => <Heart size={28} strokeWidth={isActive ? 2.5 : 2} />}
              </NavLink>
              <NavLink to="/cart" className={({ isActive }) => `nav-link ${isActive ? 'text-[#10b981]' : 'text-gray-300'}`}>
                {({ isActive }) => <BarChart2 size={28} strokeWidth={isActive ? 2.5 : 2} />}
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/publish" className={({ isActive }) => `nav-link ${isActive ? 'text-[#10b981]' : 'text-gray-300'}`}>
                {({ isActive }) => <PlusCircle size={28} strokeWidth={isActive ? 2.5 : 2} />}
              </NavLink>
              <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? 'text-[#10b981]' : 'text-gray-300'}`}>
                {({ isActive }) => <Package size={28} strokeWidth={isActive ? 2.5 : 2} />}
              </NavLink>
            </>
          )}

          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'text-[#10b981]' : 'text-gray-300'}`}>
            {({ isActive }) => <User size={28} strokeWidth={isActive ? 2.5 : 2} />}
          </NavLink>
        </nav>

        <ReloadPrompt />
      </div>
    </Router>
  )
}

export default App
