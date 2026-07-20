import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import api from '../../api/axiosClient'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const setPendingEmail       = useAuthStore((s) => s.setPendingEmail)
  const navigate              = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/send-otp', { email: trimmed })
      setPendingEmail(trimmed)
      navigate('/otp')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dots flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative glow orbs */}
      <div className="glow-orb w-96 h-96 bg-slate-900/5 -top-20 -left-20" />
      <div className="glow-orb w-64 h-64 bg-slate-900/5 bottom-10 right-10" />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-gradient-to-br from-primary-500 to-primary-700 mb-4 shadow-none-none animate-glow">
            <svg className="w-8 h-8 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">QuickHelp</h1>
          <p className="text-slate-500 text-sm mt-1">Home services, at your doorstep</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-6">
            Enter your email and we'll send you a one-time code.
          </p>

          <form id="login-form" onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email-input" className="block text-sm font-medium text-slate-600 mb-1.5">
                Email address
              </label>
              <input
                id="email-input"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            {error && (
              <p id="login-error" role="alert" className="text-red-400 text-sm flex items-center gap-1.5 animate-fade-in">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}

            <button
              id="send-otp-btn"
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Sending code…
                </>
              ) : 'Send OTP'}
            </button>
          </form>

          <p className="text-slate-500 text-xs text-center mt-6">
            By continuing you agree to our{' '}
            <span className="text-amber-800 cursor-pointer hover:underline">Terms of Service</span>
          </p>
        </div>

        {/* Features row */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: '⚡', label: 'Instant booking' },
            { icon: '🛡️', label: 'Verified workers' },
            { icon: '💰', label: 'Best prices' },
          ].map((f) => (
            <div key={f.label} className="card p-3 text-center">
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-xs text-slate-500">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
