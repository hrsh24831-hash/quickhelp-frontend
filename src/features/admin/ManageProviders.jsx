import { useState, useEffect, useCallback } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'

export default function ManageProviders() {
  const [providers, setProviders] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [acting,    setActing]    = useState(null) // ID of provider currently being suspended

  const fetchProviders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admin/providers')
      setProviders(res.data.data || [])
    } catch (err) {
      setError('Failed to load providers list.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const handleToggleSuspend = async (id, isCurrentlySuspended) => {
    if (!window.confirm(`Are you sure you want to ${isCurrentlySuspended ? 'unsuspend' : 'suspend'} this provider?`)) return
    setActing(id)


    try {
      await api.patch(`/admin/providers/${id}/suspend`)
      await fetchProviders()
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed')
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-white mb-1">Manage Providers</h1>
          <p className="text-slate-400 text-sm">Review, verify, and moderate partner provider accounts</p>
        </div>

        {error && (
          <div className="glass-card p-5 border-red-500/20 text-red-400 text-center mb-6">{error}</div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-6 h-28 animate-pulse bg-white/5 rounded-2xl" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-white font-semibold mb-1">No providers found</p>
            <p className="text-slate-400 text-sm">No provider partner accounts exist in the database.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map(p => (
              <div
                key={p._id}
                id={`provider-card-${p._id}`}
                className={`glass-card p-5 border-l-4 transition-all ${
                  p.isSuspended 
                    ? 'border-l-red-500 bg-red-500/5' 
                    : p.isVerified 
                      ? 'border-l-emerald-500' 
                      : 'border-l-slate-600'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold text-base">{p.name}</h3>
                      {p.isVerified && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          ✓ Verified
                        </span>
                      )}
                      {p.isSuspended && (
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Suspended
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Email: {p.email} · Phone: {p.phone}
                    </p>
                  </div>
                  
                  {/* Stats columns */}
                  <div className="flex gap-6 text-sm">
                    <div className="text-center sm:text-left">
                      <span className="text-xs text-slate-500 block uppercase font-semibold">Avg Rating</span>
                      <span className="text-slate-200 font-medium">{p.avgRating > 0 ? `⭐ ${p.avgRating.toFixed(1)}` : 'N/A'}</span>
                    </div>
                    <div className="text-center sm:text-left">
                      <span className="text-xs text-slate-500 block uppercase font-semibold">Jobs Completed</span>
                      <span className="text-slate-200 font-medium">{p.completedBookings}</span>
                    </div>
                  </div>

                  {/* Suspend Toggle action */}
                  <div>
                    <button
                      id={`suspend-btn-${p._id}`}
                      onClick={() => handleToggleSuspend(p._id, p.isSuspended)}
                      disabled={acting === p._id}
                      className={`text-xs px-4 py-2 rounded-xl font-bold transition-all border ${
                        p.isSuspended
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-white'
                          : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-white'
                      }`}
                    >
                      {acting === p._id 
                        ? 'Processing…' 
                        : p.isSuspended 
                          ? 'Unsuspend Profile' 
                          : 'Suspend Profile'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
