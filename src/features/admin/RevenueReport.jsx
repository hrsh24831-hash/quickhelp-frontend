import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'
import { Link } from 'react-router-dom'

export default function RevenueReport() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const fetchBreakdowns = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admin/revenue')
      setData(res.data)
    } catch (err) {
      setError('Failed to fetch breakdown report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBreakdowns()
  }, [])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8 text-sm text-slate-400">
          <Link to="/admin" className="hover:text-white">Admin</Link>
          <span>/</span>
          <span className="text-slate-200">Revenue Breakdown</span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Financial Breakdown Report</h1>
          <p className="text-slate-400 text-sm">Category, geographic area, surge, and payout allocations</p>
        </div>

        {error && (
          <div className="glass-card p-5 border-red-500/20 text-red-400 text-center mb-6">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 h-64 animate-pulse rounded-2xl" />
            <div className="glass-card p-6 h-64 animate-pulse rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category Breakdown */}
            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Category Allocations</h3>
                <p className="text-xs text-slate-400 mb-5">Revenue distributed by service category type</p>
                
                <div className="space-y-4">
                  {data?.categoryBreakdown?.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No bookings recorded.</p>
                  ) : (
                    data?.categoryBreakdown?.map(c => (
                      <div key={c.category} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300 font-medium capitalize">{c.category}</span>
                          <span className="text-white font-semibold">{formatCurrency(c.revenue)}</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full" style={{ width: '60%' }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Area Breakdown */}
            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Geographic Areas</h3>
                <p className="text-xs text-slate-400 mb-5">Revenue distributed across operations cities</p>

                <div className="space-y-4">
                  {data?.areaBreakdown?.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No bookings recorded.</p>
                  ) : (
                    data?.areaBreakdown?.map(a => (
                      <div key={a.area} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300 font-medium">{a.area}</span>
                          <span className="text-white font-semibold">{formatCurrency(a.revenue)}</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: '45%' }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Payout Allocations */}
            <div className="glass-card p-6">
              <h3 className="text-base font-bold text-white mb-1">Payout Ratios</h3>
              <p className="text-xs text-slate-400 mb-5">Settled provider payouts vs pending claims</p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                  <span className="text-xs text-slate-500 block uppercase mb-1">Settled</span>
                  <span className="text-xl font-bold text-emerald-400">{formatCurrency(data?.payoutTotals?.settled || 0)}</span>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                  <span className="text-xs text-slate-500 block uppercase mb-1">Pending Review</span>
                  <span className="text-xl font-bold text-amber-400">{formatCurrency(data?.payoutTotals?.pending || 0)}</span>
                </div>
              </div>
            </div>

            {/* Surge Performance Share */}
            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Surge Pricing Impact</h3>
                <p className="text-xs text-slate-400 mb-5">Incremental revenue generated by dynamic surge pricing</p>
                
                <div className="mt-4 bg-primary-500/5 border border-primary-500/10 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-primary-300 font-semibold uppercase block mb-1">Surge Lift</span>
                    <span className="text-3xl font-extrabold text-white">{formatCurrency(data?.totalSurgeRevenue || 0)}</span>
                  </div>
                  <div className="text-4xl">⚡</div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
