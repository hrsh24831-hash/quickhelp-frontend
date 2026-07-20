import { useState, useEffect, useCallback } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'

const STATUS_COLORS = {
  pending:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30'
}

function ReviewModal({ verification, onClose, onReviewed }) {
  const [status,     setStatus]     = useState('approved')
  const [reviewNote, setReviewNote] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const handleSubmit = async () => {
    if (status === 'rejected' && !reviewNote.trim()) {
      return setError('Review note is required for rejection')
    }
    setLoading(true)
    setError('')
    try {
      await api.patch(`/verification/${verification._id}/review`, {
        status,
        reviewNote: reviewNote.trim()
      })
      onReviewed()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review decision')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md p-7 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 text-xl">×</button>

        <h2 className="text-xl font-bold text-slate-800 mb-1">Review Verification</h2>
        <p className="text-slate-500 text-sm mb-5">
          Provider: {verification.providerId?.name} ({verification.providerId?.email})
        </p>

        <div className="bg-white/5 border border-none rounded-none p-4 mb-5 text-sm text-slate-600 space-y-2">
          <div>
            <span className="text-xs text-slate-500 uppercase block">Document Type</span>
            <span className="font-semibold text-slate-200 capitalize">{verification.documentType}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase block">Document Number</span>
            <span className="font-mono text-slate-200">{verification.documentNumber}</span>
          </div>
        </div>

        <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">Decision</label>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setStatus('approved')}
            className={`flex-1 py-2 rounded-none text-sm font-semibold transition-all border ${
              status === 'approved'
                ? 'bg-green-500/20 border-green-500/50 text-green-300'
                : 'border-none text-slate-500 hover:border-white/30'
            }`}
          >Approve</button>
          <button
            onClick={() => setStatus('rejected')}
            className={`flex-1 py-2 rounded-none text-sm font-semibold transition-all border ${
              status === 'rejected'
                ? 'bg-red-500/20 border-red-500/50 text-red-300'
                : 'border-none text-slate-500 hover:border-white/30'
            }`}
          >Reject</button>
        </div>

        <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">
          Review Note {status === 'rejected' && <span className="text-red-400">*</span>}
        </label>
        <textarea
          value={reviewNote}
          onChange={e => setReviewNote(e.target.value)}
          placeholder={status === 'rejected' ? 'Explain why documents were rejected…' : 'Optional note (e.g. Details verified successfully)…'}
          rows={3}
          className="w-full bg-white/5 border border-none rounded-none px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-900/50 resize-none mb-4"
        />

        {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-slate-500 border border-none hover:border-white/30 rounded-none transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving Decision…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManageVerifications() {
  const [verifications, setVerifications] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState('pending') // pending | approved | rejected | ''
  const [reviewing,    setReviewing]    = useState(null)     // verification object being reviewed

  const fetchVerifications = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const res = await api.get(`/verification${params}`)
      setVerifications(res.data.data || [])
    } catch (err) {
      console.error('Failed to fetch verifications', err)
      setVerifications([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchVerifications()
  }, [fetchVerifications])

  const handleReviewed = () => {
    setReviewing(null)
    fetchVerifications()
  }

  const FILTERS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'All', value: '' }
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      {reviewing && (
        <ReviewModal
          verification={reviewing}
          onClose={() => setReviewing(null)}
          onReviewed={handleReviewed}
        />
      )}

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Verify Providers</h1>
          <p className="text-slate-500 text-sm">Review government ID documentation submitted by service providers</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-none text-xs font-medium transition-all border ${
                filter === f.value
                  ? 'bg-primary-500/20 border-primary-500/50 text-amber-700'
                  : 'border-none text-slate-500 hover:border-white/30 hover:text-slate-800'
              }`}
            >{f.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-48 mb-3" />
                <div className="h-3 bg-white/10 rounded w-full mb-2" />
                <div className="h-3 bg-white/10 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : verifications.length === 0 ? (
          <div className="card p-12 text-center animate-fade-in">
            <div className="text-5xl mb-4">📇</div>
            <p className="text-slate-800 font-semibold mb-1">No verifications found</p>
            <p className="text-slate-500 text-sm font-light">No provider profiles match this filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {verifications.map(v => (
              <div key={v._id} id={`verification-${v._id}`} className="card p-5 animate-fade-in hover:border-white/20 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-slate-800 font-semibold">{v.providerId?.name || 'Unknown Provider'}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Email: {v.providerId?.email} · Phone: {v.providerId?.phone || 'N/A'}
                    </p>
                  </div>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-none text-xs font-medium border capitalize ${STATUS_COLORS[v.status] || 'bg-slate-500/20 text-slate-600 border-slate-500/30'}`}>
                    {v.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-white/5 border border-none rounded-none px-4 py-3 mb-4 text-sm text-slate-600 font-medium">
                  <div>
                    <span className="text-xs text-slate-500 uppercase block font-semibold mb-0.5">Document Type</span>
                    <span className="capitalize">{v.documentType}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase block font-semibold mb-0.5">Document Number</span>
                    <span className="font-mono">{v.documentNumber}</span>
                  </div>
                </div>

                {v.reviewNote && (
                  <div className="text-xs bg-red-500/5 border border-red-500/20 rounded-none px-4 py-3 mb-4 text-slate-600">
                    <span className="text-red-400 font-semibold uppercase block mb-0.5">Review Note:</span>
                    {v.reviewNote}
                  </div>
                )}

                {v.status === 'pending' && (
                  <button
                    id={`review-btn-${v._id}`}
                    onClick={() => setReviewing(v)}
                    className="text-xs btn-primary py-2 px-5"
                  >
                    🔍 Review Application
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
