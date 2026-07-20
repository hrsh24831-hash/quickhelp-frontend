import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axiosClient'
import Navbar from '../../components/Navbar'
import { formatCurrency } from '../../utils/format'

const CATEGORIES = [
  'all', 'cleaning', 'plumbing', 'electrical', 'ac_repair',
  'carpentry', 'pest_control', 'painting', 'appliance_repair'
]

const AREAS = [
  'all', 'Delhi', 'Gurgaon', 'Noida', 'Faridabad',
  'Mumbai', 'Pune', 'Ahmedabad', 'Surat',
  'Bangalore', 'Chennai', 'Hyderabad', 'Kochi', 'Kolkata'
]

const EMPTY_FORM = {
  name: '', category: 'all', area: 'all', startTime: '18:00', endTime: '22:00', multiplier: 1.5
}

function SurgeRuleModal({ rule, onClose, onSaved }) {
  const isEdit = !!rule?._id
  const [form, setForm] = useState(isEdit ? {
    name: rule.name,
    category: rule.category,
    area: rule.area,
    startTime: rule.startTime,
    endTime: rule.endTime,
    multiplier: rule.multiplier
  } : EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        multiplier: Number(form.multiplier)
      }
      if (isEdit) {
        await api.put(`/pricing/surge-rules/${rule._id}`, payload)
      } else {
        await api.post('/pricing/surge-rules', payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-none">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEdit ? 'Edit Surge Rule' : 'Create Surge Rule'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form id="surge-rule-form" onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-2.5 rounded-none">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5 font-mono">Rule Name</label>
            <input
              id="form-rule-name"
              type="text"
              required
              className="w-full bg-white/5 border border-none rounded-none px-4 py-2 text-slate-800 placeholder-slate-500 focus:outline-none focus:border-slate-900 transition-colors"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Late Night Surge"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5 font-mono">Category</label>
              <select
                id="form-rule-category"
                className="w-full bg-white/5 border border-none rounded-none px-4 py-2 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors capitalize"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c} className="bg-slate-900 capitalize">{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5 font-mono">Area</label>
              <select
                id="form-rule-area"
                className="w-full bg-white/5 border border-none rounded-none px-4 py-2 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors"
                value={form.area}
                onChange={(e) => set('area', e.target.value)}
              >
                {AREAS.map(a => (
                  <option key={a} value={a} className="bg-white text-slate-800">{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5 font-mono">Start Time</label>
              <input
                id="form-rule-start-time"
                type="text"
                required
                className="w-full bg-white/5 border border-none rounded-none px-4 py-2 text-slate-800 placeholder-slate-500 focus:outline-none focus:border-slate-900 transition-colors"
                value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)}
                placeholder="HH:MM e.g. 22:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5 font-mono">End Time</label>
              <input
                id="form-rule-end-time"
                type="text"
                required
                className="w-full bg-white/5 border border-none rounded-none px-4 py-2 text-slate-800 placeholder-slate-500 focus:outline-none focus:border-slate-900 transition-colors"
                value={form.endTime}
                onChange={(e) => set('endTime', e.target.value)}
                placeholder="HH:MM e.g. 02:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5 font-mono">Multiplier</label>
              <input
                id="form-rule-multiplier"
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                required
                className="w-full bg-white/5 border border-none rounded-none px-4 py-2 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors"
                value={form.multiplier}
                onChange={(e) => set('multiplier', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-none">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-surge-rule-btn"
              type="submit"
              disabled={loading}
              className="btn-primary text-sm py-2 px-5 disabled:opacity-40"
            >
              {loading ? 'Saving…' : isEdit ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ManageSurgeRules() {
  const [rules, setRules] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState(null)

  const fetchRulesAndAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const [rRes, aRes] = await Promise.all([
        api.get('/pricing/surge-rules'),
        api.get('/pricing/analytics')
      ])
      setRules(rRes.data || [])
      setAnalytics(aRes.data || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRulesAndAnalytics()
  }, [fetchRulesAndAnalytics])

  const handleToggleActive = async (rule) => {
    try {
      await api.put(`/pricing/surge-rules/${rule._id}`, { isActive: !rule.isActive })
      fetchRulesAndAnalytics()
    } catch (err) {
      alert(err.response?.data?.message || 'Toggle failed')
    }
  }

  const handleEditClick = (rule) => {
    setSelectedRule(rule)
    setModalOpen(true)
  }

  const handleCreateClick = () => {
    setSelectedRule(null)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Dynamic Pricing & Surge Rules</h1>
            <p className="text-slate-500 text-sm">Configure dynamic multiplier rates and monitor surge analytics</p>
          </div>
          <button
            id="create-surge-rule-btn"
            onClick={handleCreateClick}
            className="btn-primary flex items-center gap-2 py-2.5 px-4 font-semibold text-sm shadow-none hover:shadow-none-primary-500/20"
          >
            <span>+</span> Create Surge Rule
          </button>
        </div>

        {/* Analytics Section */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card p-5">
              <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-1">Avg Multiplier</p>
              <p id="stat-avg-multiplier" className="text-2xl font-semibold text-amber-400">{analytics.avgMultiplier}×</p>
            </div>
            <div className="card p-5">
              <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-1">Total Surge Revenue</p>
              <p id="stat-surge-revenue" className="text-2xl font-semibold text-emerald-400">{formatCurrency(analytics.totalSurgeRevenue)}</p>
            </div>
            <div className="card p-5">
              <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-1">Most Surged Area</p>
              <p id="stat-most-surged-area" className="text-2xl font-semibold text-slate-800 capitalize">{analytics.mostSurgedArea}</p>
            </div>
            <div className="card p-5">
              <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-1">Total Surged Bookings</p>
              <p id="stat-surged-count" className="text-2xl font-semibold text-blue-400">{analytics.surgedBookingsCount}</p>
            </div>
          </div>
        )}

        {/* Rules Table */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-none flex justify-between items-center">
            <h2 className="text-base font-semibold text-slate-800">Active & Scheduled Rules</h2>
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              <div className="h-6 bg-white/5 animate-pulse rounded w-3/4" />
              <div className="h-6 bg-white/5 animate-pulse rounded w-1/2" />
              <div className="h-6 bg-white/5 animate-pulse rounded w-2/3" />
            </div>
          ) : rules.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-lg font-semibold text-slate-800 mb-1">No surge rules configured</p>
              <p className="text-sm">Click "Create SurgeRule" above to launch pricing parameters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-none bg-white/[0.02] text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 pl-6">Rule Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Area</th>
                    <th className="p-4">Hours</th>
                    <th className="p-4">Multiplier</th>
                    <th className="p-4">Active</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-600">
                  {rules.map((rule) => (
                    <tr key={rule._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 pl-6 font-medium text-slate-800">{rule.name}</td>
                      <td className="p-4 capitalize">{rule.category.replace('_', ' ')}</td>
                      <td className="p-4">{rule.area}</td>
                      <td className="p-4 font-mono text-xs">{rule.startTime} - {rule.endTime}</td>
                      <td className="p-4 font-mono text-amber-400 font-semibold">{rule.multiplier}×</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(rule)}
                          className={`inline-flex items-center px-2 py-0.5 rounded-none text-xs border font-medium transition-all ${
                            rule.isActive
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-500/15 text-slate-500 border-slate-500/30'
                          }`}
                        >
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-4 pr-6 text-right space-x-3">
                        <button
                          onClick={() => handleEditClick(rule)}
                          className="text-xs text-amber-800 hover:text-amber-700 font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <SurgeRuleModal
          rule={selectedRule}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false)
            fetchRulesAndAnalytics()
          }}
        />
      )}
    </div>
  )
}
