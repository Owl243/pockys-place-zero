import React from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { Home, Search, ShoppingBag, User } from 'lucide-react'
import HomePage from './pages/Home'
import SearchPage from './pages/Search'
import CartPage from './pages/Cart'
import ProfilePage from './pages/Profile'
import ReloadPrompt from './components/ReloadPrompt'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0f172a] text-white">
        <main className="page-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>

        <nav className="glass-nav">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#10b981]' : 'text-slate-400'}`
            }
          >
            <Home size={24} />
            <span className="text-[10px] font-medium">Home</span>
          </NavLink>

          <NavLink 
            to="/search" 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#10b981]' : 'text-slate-400'}`
            }
          >
            <Search size={24} />
            <span className="text-[10px] font-medium">Search</span>
          </NavLink>

          <NavLink 
            to="/cart" 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#10b981]' : 'text-slate-400'}`
            }
          >
            <ShoppingBag size={24} />
            <span className="text-[10px] font-medium">Cart</span>
          </NavLink>

          <NavLink 
            to="/profile" 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#10b981]' : 'text-slate-400'}`
            }
          >
            <User size={24} />
            <span className="text-[10px] font-medium">Profile</span>
          </NavLink>
        </nav>

        <ReloadPrompt />
      </div>
    </Router>
  )
}

export default App
