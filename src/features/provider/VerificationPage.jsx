import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'

export default function VerificationPage() {
  const [record,         setRecord]         = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [submitting,     setSubmitting]     = useState(false)
  const [documentType,   setDocumentType]   = useState('aadhaar')
  const [documentNumber, setDocumentNumber] = useState('')
  const [error,          setError]          = useState('')
  const [message,        setMessage]        = useState('')

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await api.get('/verification/status')
      setRecord(res.data.record)
    } catch (err) {
      console.error('Failed to fetch status', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!documentNumber.trim()) return setError('Document number is required')
    
    setSubmitting(true)
    setError('')
    setMessage('')
    
    const isResubmit = record && record.status === 'rejected'
    const endpoint = isResubmit ? '/verification/re-submit' : '/verification/upload'
    
    try {
      const res = await api.post(endpoint, {
        documentType,
        documentNumber: documentNumber.trim()
      })
      setMessage(res.data.message)
      setRecord(res.data.record)
      setDocumentNumber('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit verification request')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStatusCard = () => {
    if (!record) return null
    
    const { status, documentType: docType, documentNumber: docNum, reviewNote } = record
    
    if (status === 'pending') {
      return (
        <div className="glass-card p-6 border-yellow-500/30 text-center animate-fade-in space-y-4">
          <div className="text-5xl">⏳</div>
          <h2 className="text-xl font-bold text-white">Verification Pending Review</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Your verification request is currently under review by our administrators. This usually takes less than 24 hours.
          </p>
          <div className="pt-2">
            <span className="inline-block bg-yellow-500/10 text-yellow-300 text-xs px-3.5 py-1.5 rounded-full border border-yellow-500/20 font-medium">
              Submitted: {docType.toUpperCase()} ({docNum})
            </span>
          </div>
        </div>
      )
    }
    
    if (status === 'approved') {
      return (
        <div className="glass-card p-6 border-emerald-500/30 text-center animate-fade-in space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold text-white">Profile Verified</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Congratulations! Your profile is verified. You now have the trust badge shown on your account.
          </p>
          <div className="pt-2">
            <span className="inline-block bg-emerald-500/10 text-emerald-300 text-xs px-3.5 py-1.5 rounded-full border border-emerald-500/20 font-medium">
              Active: {docType.toUpperCase()} ({docNum})
            </span>
          </div>
        </div>
      )
    }
    
    if (status === 'rejected') {
      return (
        <div className="glass-card p-6 border-red-500/30 text-center animate-fade-in space-y-4 mb-6">
          <div className="text-5xl">❌</div>
          <h2 className="text-xl font-bold text-white">Verification Rejected</h2>
          <p className="text-red-400 text-sm max-w-sm mx-auto bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
            <strong>Reason: </strong> {reviewNote || 'Document could not be verified.'}
          </p>
          <p className="text-slate-400 text-xs">
            Please review the note and resubmit with correct information below.
          </p>
        </div>
      )
    }
    
    return null
  }

  const showForm = !record || record.status === 'rejected'

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="mb-8 animate-fade-in text-center">
          <h1 className="text-2xl font-bold text-white mb-1">Provider Verification</h1>
          <p className="text-slate-400 text-sm">Verify your profile to gain customer trust</p>
        </div>
        
        {loading ? (
          <div className="glass-card p-6 animate-pulse text-center text-slate-400">
            Checking status…
          </div>
        ) : (
          <>
            {renderStatusCard()}
            
            {showForm && (
              <div className="glass-card p-6 animate-fade-in">
                <h2 className="text-lg font-semibold text-white mb-4">
                  {record ? 'Resubmit Verification' : 'Submit ID Document'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 uppercase tracking-wide mb-2">
                      Document Type
                    </label>
                    <select
                      value={documentType}
                      onChange={e => setDocumentType(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500/50"
                    >
                      <option value="aadhaar" className="bg-slate-900 text-white">Aadhaar Card</option>
                      <option value="pan" className="bg-slate-900 text-white">PAN Card</option>
                      <option value="other" className="bg-slate-900 text-white">Other Government ID</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-slate-400 uppercase tracking-wide mb-2">
                      Document Number / ID
                    </label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={e => setDocumentNumber(e.target.value)}
                      placeholder="Enter document number (e.g. 1234-5678-9012)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500/50 font-mono"
                    />
                  </div>
                  
                  {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                  {message && <p className="text-green-400 text-xs text-center">{message}</p>}
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 text-sm font-semibold btn-primary disabled:opacity-50"
                  >
                    {submitting ? 'Submitting…' : 'Submit Details'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
