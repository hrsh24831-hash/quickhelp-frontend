import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import api from '../../api/axiosClient'

const OTP_LENGTH = 6

export default function OtpPage() {
  const navigate            = useNavigate()
  const { pendingEmail, setPendingEmail, clearPendingEmail, setAuth } = useAuthStore()
  const setRole             = useAuthStore((s) => s.setRole)

  const [digits, setDigits]       = useState(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading]     = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError]         = useState('')
  const [countdown, setCountdown] = useState(60)
  const inputRefs                 = useRef([])

  // Guard: if no pending email and not logged in, redirect back to login
  useEffect(() => {
    const isAuthed = useAuthStore.getState().token
    if (!pendingEmail && !isAuthed) {
      navigate('/login', { replace: true })
    }
  }, [pendingEmail, navigate])


  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Auto-focus first input on mount
  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return          // digits only
    const next = [...digits]
    next[index] = value.slice(-1)             // take only last char
    setDigits(next)
    setError('')

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all filled
    if (value && index === OTP_LENGTH - 1 && next.every(Boolean)) {
      verifyCode(next.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (pasted.length === OTP_LENGTH) {
      const arr = pasted.split('')
      setDigits(arr)
      inputRefs.current[OTP_LENGTH - 1]?.focus()
      verifyCode(pasted)
    }
    e.preventDefault()
  }

  const verifyCode = async (otp) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/verify-otp', {
        email: pendingEmail,
        otp
      })

      // Store JWT + user in Zustand
      setAuth(data.token, data.data)
      clearPendingEmail()

      // Route based on whether role has been selected
      if (!data.data?.roleSelectedAt) {
        navigate('/role-select', { replace: true })
      } else if (data.data?.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (data.data?.role === 'provider') {
        navigate('/provider/dashboard', { replace: true })
      } else {
        navigate('/customer/services', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.')
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || resending) return
    setResending(true)
    setError('')
    try {
      await api.post('/auth/send-otp', { email: pendingEmail })
      setCountdown(60)
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError('Failed to resend OTP.')
    } finally {
      setResending(false)
    }
  }

  const handleSubmitBtn = () => {
    const otp = digits.join('')
    if (otp.length === OTP_LENGTH) verifyCode(otp)
  }

  const maskedEmail = pendingEmail
    ? pendingEmail.replace(/(.{2}).+(@.+)/, '$1***$2')
    : ''

  return (
    <div className="min-h-screen bg-dots flex items-center justify-center px-4 relative overflow-hidden">
      {/* Glow orbs */}
      <div className="glow-orb w-80 h-80 bg-slate-900/5 -top-10 -right-16" />
      <div className="glow-orb w-56 h-56 bg-slate-900/5 bottom-16 left-6" />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Back button */}
        <button
          id="back-to-login-btn"
          onClick={() => { clearPendingEmail(); navigate('/login') }}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors mb-6 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Card */}
        <div className="card p-8">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-none bg-primary-500/15 border border-primary-500/20 mb-5 mx-auto">
            <svg className="w-7 h-7 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z" />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-slate-800 text-center mb-1">Check your inbox</h2>
          <p className="text-slate-500 text-sm text-center mb-6">
            We sent a 6-digit code to <span className="text-amber-700 font-medium">{maskedEmail}</span>
          </p>

          {/* OTP input boxes */}
          <div id="otp-container" className="flex justify-center gap-2 mb-5" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="otp-input"
                autoComplete="one-time-code"
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <p id="otp-error" role="alert" className="text-red-400 text-sm text-center mb-4 animate-fade-in flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}

          <button
            id="verify-otp-btn"
            onClick={handleSubmitBtn}
            disabled={loading || digits.some((d) => !d)}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Verifying…
              </>
            ) : 'Verify code'}
          </button>

          {/* Resend */}
          <div className="text-center mt-5">
            {countdown > 0 ? (
              <p className="text-slate-500 text-sm">
                Resend code in <span className="text-amber-800 font-mono font-medium">{countdown}s</span>
              </p>
            ) : (
              <button
                id="resend-otp-btn"
                onClick={handleResend}
                disabled={resending}
                className="text-amber-800 hover:text-amber-700 text-sm font-medium transition-colors"
              >
                {resending ? 'Resending…' : 'Resend code'}
              </button>
            )}
          </div>
        </div>

        <p className="text-slate-600 text-xs text-center mt-4">
          Codes expire after 5 minutes.
        </p>
      </div>
    </div>
  )
}
