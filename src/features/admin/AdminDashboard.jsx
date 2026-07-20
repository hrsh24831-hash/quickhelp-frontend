import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null)
  const [revenue,  setRevenue]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [exporting, setExporting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [statsRes, revRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/revenue')
      ])
      setStats(statsRes.data)
      setRevenue(revRes.data)
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const response = await api.get('/admin/export', { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `bookings_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (err) {
      alert('Failed to export CSV. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  // Quick helper for currency format
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
  }

  const chartData = revenue?.timeBreakdown || []

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">Real-time marketplace statistics and actions</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/admin/revenue"
              className="px-4 py-2.5 rounded-none text-sm font-semibold border border-none hover:border-white/20 text-slate-600 hover:text-slate-800 transition-all bg-white/5"
            >
              📊 Detailed Report
            </Link>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="px-4 py-2.5 rounded-none text-sm font-semibold btn-primary disabled:opacity-50 flex items-center gap-2"
            >
              📥 {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        </div>

        {error && (
          <div className="card p-5 border-red-500/20 text-red-400 text-center mb-6">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card p-6 h-32 animate-pulse bg-white/5 rounded-none" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Stat 1 */}
              <div className="card p-5 flex items-center justify-between border-blue-500/20">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold block mb-1">Total Revenue</span>
                  <span className="text-2xl font-bold text-slate-800">{formatCurrency(stats?.totalPaymentRevenue || 0)}</span>
                </div>
                <div className="w-12 h-12 rounded-none bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl font-bold">💳</div>
              </div>

              {/* Stat 2 */}
              <div className="card p-5 flex items-center justify-between border-purple-500/20">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold block mb-1">Total Bookings</span>
                  <span className="text-2xl font-bold text-slate-800">{stats?.totalBookings || 0}</span>
                </div>
                <div className="w-12 h-12 rounded-none bg-purple-500/10 flex items-center justify-center text-purple-400 text-xl">📋</div>
              </div>

              {/* Stat 3 */}
              <div className="card p-5 flex items-center justify-between border-yellow-500/20">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold block mb-1">Provider Rating</span>
                  <span className="text-2xl font-bold text-slate-800">⭐ {stats?.avgProviderRating || '0.0'}</span>
                </div>
                <div className="w-12 h-12 rounded-none bg-yellow-500/10 flex items-center justify-center text-yellow-400 text-xl">★</div>
              </div>

              {/* Stat 4 */}
              <div className="card p-5 flex items-center justify-between border-red-500/20">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold block mb-1">Open Disputes</span>
                  <span className="text-2xl font-bold text-slate-800">{stats?.totalOpenDisputesCount || 0}</span>
                </div>
                <div className="w-12 h-12 rounded-none bg-red-500/10 flex items-center justify-center text-red-400 text-xl">⚠️</div>
              </div>
            </div>

            {/* Chart Section */}
            <div className="card p-6 mb-8 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Revenue Timeline</h2>
                  <p className="text-xs text-slate-500">Daily transaction volumes over the last 30 days</p>
                </div>
                <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-none border border-emerald-500/20">
                  Settled Payouts: {formatCurrency(stats?.totalPayoutsSettled || 0)}
                </div>
              </div>

              <div className="h-80 w-full font-mono text-xs">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    No revenue transactions recorded in the last 30 days.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link to="/admin/services" className="card p-5 hover:border-white/20 transition-all flex flex-col justify-between h-32 group">
                <span className="text-slate-500 font-semibold group-hover:text-slate-800 text-sm transition-colors">⚙️ Manage Services</span>
                <span className="text-xs text-slate-500">Configure listing inventory & pricing models</span>
              </Link>
              <Link to="/admin/providers" className="card p-5 hover:border-white/20 transition-all flex flex-col justify-between h-32 group">
                <span className="text-slate-500 font-semibold group-hover:text-slate-800 text-sm transition-colors">👤 Manage Providers</span>
                <span className="text-xs text-slate-500">Suspend/verify provider partner registrations</span>
              </Link>
              <Link to="/admin/disputes" className="card p-5 hover:border-white/20 transition-all flex flex-col justify-between h-32 group">
                <span className="text-slate-500 font-semibold group-hover:text-slate-800 text-sm transition-colors">⚖️ Manage Disputes</span>
                <span className="text-xs text-slate-500">Review open tickets and issue resolutions</span>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
