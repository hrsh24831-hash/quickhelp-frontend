import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import api from '../../api/axiosClient'

const ROLES = [
  {
    id: 'customer',
    label: 'I need help',
    subtitle: 'Book trusted professionals for home services',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    perks: ['Instant booking', 'Cluster discounts', 'Real-time tracking'],
    gradient: 'from-amber-500/10 to-yellow-500/5',
    border:   'border-none hover:border-amber-400',
    glow:     'rgba(245,158,11,0.15)',
  },
  {
    id: 'provider',
    label: 'I offer services',
    subtitle: 'Earn by delivering home services to customers',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
    perks: ['Flexible hours', 'Direct payouts', 'Grow your business'],
    gradient: 'from-amber-600/10 to-amber-500/5',
    border:   'border-none hover:border-amber-400',
    glow:     'rgba(245,158,11,0.20)',
  },
]

export default function RoleSelectPage() {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { setRole, user }       = useAuthStore()
  const navigate                = useNavigate()

  const handleConfirm = async () => {
    if (!selected) {
      setError('Please select a role to continue.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/role', { role: selected })
      setRole(data.data.role, data.data.roleSelectedAt)

      if (selected === 'provider') {
        navigate('/provider/dashboard', { replace: true })
      } else {
        navigate('/customer/services', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dots flex items-center justify-center px-4 relative overflow-hidden">
      {/* Glow orbs */}
      <div className="glow-orb w-72 h-72 bg-slate-900/5 top-1/4 -left-20" />
      <div className="glow-orb w-56 h-56 bg-slate-900/5 bottom-1/4 -right-16" />

      <div className="relative z-10 w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-gradient-to-br from-primary-500 to-primary-700 mb-4 shadow-none-none">
            <svg className="w-8 h-8 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-slate-500 text-sm mt-1">How will you be using QuickHelp?</p>
        </div>

        {/* Role cards */}
        <div className="grid gap-4 mb-6">
          {ROLES.map((role) => {
            const isSelected = selected === role.id
            return (
              <button
                key={role.id}
                id={`role-card-${role.id}`}
                onClick={() => { setSelected(role.id); setError('') }}
                className={`
                  card p-6 text-left transition-all duration-200 cursor-pointer w-full
                  bg-gradient-to-br ${role.gradient} ${role.border} border
                  ${isSelected ? 'scale-[1.01]' : 'hover:scale-[1.005]'}
                `}
                style={isSelected ? { boxShadow: `0 0 0 2px rgba(255,255,255,0.15), 0 8px 32px ${role.glow}` } : {}}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-3 rounded-none ${isSelected ? 'bg-white/15 text-slate-800' : 'bg-white/5 text-slate-500'} transition-all`}>
                    {role.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold text-lg ${isSelected ? 'text-slate-800' : 'text-slate-200'}`}>
                        {role.label}
                      </h3>
                      {/* Radio indicator */}
                      <div className={`w-5 h-5 rounded-none border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? 'border-primary-400 bg-primary-500' : 'border-slate-600'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-none bg-white" />}
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mb-3">{role.subtitle}</p>
                    <ul className="space-y-1">
                      {role.perks.map((p) => (
                        <li key={p} className="flex items-center gap-1.5 text-xs text-slate-500">
                          <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {error && (
          <p id="role-error" role="alert" className="text-red-400 text-sm text-center mb-4 animate-fade-in">
            {error}
          </p>
        )}

        <button
          id="confirm-role-btn"
          onClick={handleConfirm}
          disabled={!selected || loading}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Saving…
            </>
          ) : (
            <>
              Continue as {selected ? (selected === 'customer' ? 'Customer' : 'Provider') : '…'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>

        <p className="text-slate-600 text-xs text-center mt-4">
          Your role can be changed later by contacting support.
        </p>
      </div>
    </div>
  )
}
