import { useState, useEffect, useCallback } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'

const STATUS_COLORS = {
  open:         'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  under_review: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  resolved:     'bg-green-500/20 text-green-300 border-green-500/30',
  rejected:     'bg-red-500/20 text-red-300 border-red-500/30'
}

const StatusBadge = ({ status }) => (
  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
    {status.replace('_', ' ')}
  </span>
)

function ResolveModal({ dispute, onClose, onResolved }) {
  const [status,     setStatus]     = useState('resolved')
  const [resolution, setResolution] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const handleSubmit = async () => {
    if (!resolution.trim()) return setError('Resolution note is required')
    setLoading(true)
    setError('')
    try {
      await api.patch(`/disputes/${dispute._id}/resolve`, { status, resolution: resolution.trim() })
      onResolved()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve dispute')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md p-7 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl">×</button>

        <h2 className="text-xl font-bold text-white mb-1">Resolve Dispute</h2>
        <p className="text-slate-400 text-sm mb-5">
          {dispute.bookingId?.bookingID} · Raised by {dispute.raisedBy?.name}
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5 text-sm text-slate-300 max-h-28 overflow-y-auto">
          <p className="text-xs text-slate-500 uppercase mb-1">Reason</p>
          {dispute.reason}
        </div>

        {/* Action */}
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-2">Decision</label>
        <div className="flex gap-3 mb-4">
          {['resolved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all capitalize border ${
                status === s
                  ? s === 'resolved'
                    ? 'bg-green-500/20 border-green-500/50 text-green-300'
                    : 'bg-red-500/20 border-red-500/50 text-red-300'
                  : 'border-white/10 text-slate-400 hover:border-white/30'
              }`}
            >{s}</button>
          ))}
        </div>

        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-2">Resolution Note</label>
        <textarea
          value={resolution}
          onChange={e => setResolution(e.target.value)}
          placeholder="Explain the decision to the parties involved…"
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500/50 resize-none mb-4"
        />

        {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-slate-400 border border-white/10 hover:border-white/30 rounded-xl transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save Decision'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManageDisputes() {
  const [disputes,  setDisputes]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('')      // '' | open | under_review | resolved | rejected
  const [resolving, setResolving] = useState(null)   // dispute object being resolved

  const fetchDisputes = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const res = await api.get(`/disputes${params}`)
      setDisputes(res.data.disputes || [])
    } catch {
      setDisputes([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchDisputes() }, [fetchDisputes])

  const handleResolved = () => {
    setResolving(null)
    fetchDisputes()
  }

  const FILTERS = [
    { label: 'All', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'Under Review', value: 'under_review' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Rejected', value: 'rejected' },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      {resolving && (
        <ResolveModal
          dispute={resolving}
          onClose={() => setResolving(null)}
          onResolved={handleResolved}
        />
      )}

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-white mb-1">Manage Disputes</h1>
          <p className="text-slate-400 text-sm">Review and resolve customer & provider disputes</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                filter === f.value
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                  : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
              }`}
            >{f.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-48 mb-3" />
                <div className="h-3 bg-white/10 rounded w-full mb-2" />
                <div className="h-3 bg-white/10 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="text-5xl mb-4">⚖️</div>
            <p className="text-white font-semibold mb-1">No disputes found</p>
            <p className="text-slate-400 text-sm">All clear — no open disputes matching this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map(d => (
              <div key={d._id} id={`dispute-${d._id}`} className="glass-card p-5 animate-fade-in">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold">
                      {d.bookingId?.bookingID || 'Booking Unavailable'}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Raised by <span className="text-slate-300">{d.raisedBy?.name}</span>
                      {' '}({d.raisedBy?.role})
                      {' · '}
                      {new Date(d.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>

                {/* Reason */}
                <p className="text-sm text-slate-300 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-3 line-clamp-3">
                  {d.reason}
                </p>

                {/* Resolution (if closed) */}
                {d.resolution && (
                  <div className="text-xs bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-3 mb-3">
                    <span className="text-green-400 font-semibold uppercase tracking-wide">Resolution: </span>
                    <span className="text-slate-300">{d.resolution}</span>
                    {d.resolvedBy && (
                      <span className="text-slate-500"> · by {d.resolvedBy.name}</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                {['open', 'under_review'].includes(d.status) && (
                  <button
                    id={`resolve-btn-${d._id}`}
                    onClick={() => setResolving(d)}
                    className="text-xs btn-primary py-2 px-5"
                  >
                    ⚖️ Resolve Dispute
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
