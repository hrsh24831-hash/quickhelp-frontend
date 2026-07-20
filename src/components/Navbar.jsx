import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/axiosClient'
import {
  Zap,
  LogOut,
  Menu,
  X,
  CheckCircle,
} from 'lucide-react'

const ROLE_LINKS = {
  customer: [
    { to: '/customer/services', label: 'Browse Services' },
    { to: '/customer/preview',  label: 'Book Service'    },
    { to: '/customer/bookings', label: 'My Bookings'     },
  ],
  provider: [
    { to: '/provider/bookings',     label: 'Booking Queue'      },
    { to: '/provider/verification', label: 'Verification Status' },
  ],
  admin: [
    { to: '/admin',                  label: 'Dashboard'     },
    { to: '/admin/services',         label: 'Services'      },
    { to: '/admin/surge-rules',      label: 'Surge Rules'   },
    { to: '/admin/providers',        label: 'Providers'     },
    { to: '/admin/payouts',          label: 'Payouts'       },
    { to: '/admin/disputes',         label: 'Disputes'      },
    { to: '/admin/verifications',    label: 'Verifications' },
  ],
}

const ROLE_BADGE = {
  customer: { label: 'Customer', cls: 'text-amber-400 text-[10px] tracking-widest uppercase font-semibold border border-amber-400/20 px-2 py-0.5 rounded-none' },
  provider: { label: 'Provider', cls: 'text-amber-400 text-[10px] tracking-widest uppercase font-semibold border border-amber-400/20 px-2 py-0.5 rounded-none' },
  admin:    { label: 'Admin',    cls: 'text-amber-400 text-[10px] tracking-widest uppercase font-semibold border border-amber-400/20 px-2 py-0.5 rounded-none' },
}

export default function Navbar() {
  const { user, token, logout, updateUser } = useAuthStore()
  const navigate                            = useNavigate()
  const location                            = useLocation()
  const [menuOpen, setMenuOpen]             = useState(false)

  // Sync fresh profile details on each navigation
  useEffect(() => {
    if (!token) return
    let active = true
    api.get('/auth/profile')
      .then(res => { if (active && res.data.data) updateUser(res.data.data) })
      .catch(err => console.error('Failed to sync profile', err))
    return () => { active = false }
  }, [token, updateUser, location.pathname])

  const role  = user?.role || 'customer'
  const links = ROLE_LINKS[role] || []
  const badge = ROLE_BADGE[role]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (to) => location.pathname.startsWith(to)

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800" style={{ boxShadow: 'none' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-none bg-amber-400 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
            <Zap size={16} className="text-slate-900" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Quick<span className="text-amber-400">Help</span></span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 text-sm font-medium transition-all ${
                isActive(link.to)
                  ? 'text-amber-400 underline decoration-amber-400 decoration-2 underline-offset-8'
                  : 'text-slate-300 hover:text-amber-400'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2.5">
          {/* Role badge */}
          {badge && (
            <span className={`hidden sm:inline-flex items-center ${badge.cls}`}>
              {badge.label}
            </span>
          )}

          {/* User name + verified tick */}
          <span className="hidden md:flex items-center gap-1.5 text-slate-300 text-sm font-medium truncate max-w-[160px]">
            {user?.name || user?.email}
            {role === 'provider' && user?.providerProfile?.isVerified && (
              <CheckCircle size={14} className="text-amber-400 shrink-0" strokeWidth={2.5} />
            )}
          </span>

          {/* Logout */}
          <button
            id="navbar-logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-all"
          >
            <LogOut size={16} strokeWidth={2} />
            <span className="hidden sm:inline font-medium">Logout</span>
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(link.to)
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-amber-400'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
