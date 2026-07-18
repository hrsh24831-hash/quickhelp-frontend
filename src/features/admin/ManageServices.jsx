import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../api/axiosClient'
import Navbar from '../../components/Navbar'
import { formatCurrency } from '../../utils/format'

const CATEGORIES = [
  'cleaning', 'plumbing', 'electrical', 'ac_repair',
  'carpentry', 'pest_control', 'painting', 'appliance_repair'
]

const AREAS = [
  'Delhi', 'Gurgaon', 'Noida', 'Faridabad',
  'Mumbai', 'Pune', 'Ahmedabad', 'Surat',
  'Bangalore', 'Chennai', 'Hyderabad', 'Kochi', 'Kolkata'
]

const EMPTY_FORM = {
  serviceName: '', category: 'cleaning', basePrice: '',
  baseTime: '', description: '', areasAvailable: []
}

// ── Small badge ─────────────────────────────────────────────────────
function CategoryBadge({ category }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary-500/15 text-primary-300 border border-primary-500/20 capitalize">
      {category.replace('_', ' ')}
    </span>
  )
}

// ── Service form modal ───────────────────────────────────────────────
function ServiceModal({ service, onClose, onSaved }) {
  const isEdit = !!service?._id
  const [form, setForm]       = useState(isEdit ? {
    serviceName:    service.serviceName,
    category:       service.category,
    basePrice:      service.basePrice,
    baseTime:       service.baseTime,
    description:    service.description || '',
    areasAvailable: service.areasAvailable || []
  } : EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const toggleArea = (area) => {
    setForm((f) => ({
      ...f,
      areasAvailable: f.areasAvailable.includes(area)
        ? f.areasAvailable.filter((a) => a !== area)
        : [...f.areasAvailable, area]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        basePrice: Number(form.basePrice),
        baseTime:  Number(form.baseTime),
      }
      if (isEdit) {
        await api.put(`/services/${service._id}`, payload)
      } else {
        await api.post('/services', payload)
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
      <div className="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? 'Edit Service' : 'Add New Service'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form id="service-form" onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Service Name *</label>
            <input
              id="form-service-name"
              type="text"
              value={form.serviceName}
              onChange={(e) => set('serviceName', e.target.value)}
              required
              placeholder="e.g. Bathroom Deep Clean"
              className="glass-input"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Category *</label>
            <select
              id="form-category"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="glass-input cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Price + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Base Price (₹) *</label>
              <input
                id="form-base-price"
                type="number"
                min="1"
                value={form.basePrice}
                onChange={(e) => set('basePrice', e.target.value)}
                required
                placeholder="499"
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">ETA (minutes) *</label>
              <input
                id="form-base-time"
                type="number"
                min="1"
                value={form.baseTime}
                onChange={(e) => set('baseTime', e.target.value)}
                required
                placeholder="60"
                className="glass-input"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              id="form-description"
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Brief description of the service…"
              className="glass-input resize-none"
            />
          </div>

          {/* Areas available */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Areas Available
              <span className="ml-2 text-slate-500 font-normal text-xs">({form.areasAvailable.length} selected)</span>
            </label>
            <div id="areas-grid" className="grid grid-cols-3 gap-1.5">
              {AREAS.map((area) => {
                const selected = form.areasAvailable.includes(area)
                return (
                  <button
                    key={area}
                    type="button"
                    id={`area-toggle-${area}`}
                    onClick={() => toggleArea(area)}
                    className={`text-xs px-2 py-1.5 rounded-lg border transition-all ${
                      selected
                        ? 'bg-primary-500/25 border-primary-500/50 text-primary-200'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {area}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              id="form-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Saving…
                </>
              ) : isEdit ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Confirm deactivate dialog ────────────────────────────────────────
function ConfirmDialog({ service, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-sm p-6 text-center animate-slide-up">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-semibold text-white mb-2">Deactivate Service?</h3>
        <p className="text-slate-400 text-sm mb-5">
          <strong className="text-white">{service.serviceName}</strong> will be hidden from customers.
          Existing bookings are not affected. You can reactivate it later.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            id="confirm-deactivate-btn"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-50"
          >
            {loading ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────
export default function ManageServices() {
  const [services,    setServices]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)   // null = create, obj = edit
  const [deleteTarget,setDeleteTarget]= useState(null)
  const [deleting,    setDeleting]    = useState(false)
  const [filter,      setFilter]      = useState('all')  // 'all' | 'active' | 'inactive'

  // Fetch ALL services including inactive via admin endpoint
  const fetchAllAdmin = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/services')
      setServices(res.data.data || [])
    } catch {
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAllAdmin() }, [fetchAllAdmin])

  const handleSaved = () => {
    setModalOpen(false)
    setEditTarget(null)
    fetchAllAdmin()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/services/${deleteTarget._id}`)
      setDeleteTarget(null)
      fetchAllAdmin()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const displayed = filter === 'all' ? services
    : filter === 'active'   ? services.filter((s) => s.isActive !== false)
    : services.filter((s) => s.isActive === false)

  const totalActive = services.filter((s) => s.isActive !== false).length

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Services</h1>
            <p className="text-slate-400 text-sm mt-0.5">Create, edit and deactivate service listings</p>
          </div>
          <button
            id="add-service-btn"
            onClick={() => { setEditTarget(null); setModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/25"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Service
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 animate-slide-up">
          {[
            { label: 'Total Services', value: services.length, icon: '📦' },
            { label: 'Active',         value: totalActive,     icon: '✅' },
            { label: 'Inactive',       value: services.length - totalActive, icon: '⏸️' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4 flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {['all', 'active', 'inactive'].map((f) => (
            <button
              key={f}
              id={`filter-tab-${f}`}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="glass-card p-8 text-center text-slate-400 animate-pulse">Loading services…</div>
        ) : displayed.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400">No services found.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">ETA</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayed.map((service) => (
                    <tr
                      key={service._id}
                      id={`row-${service._id}`}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{service.serviceName}</div>
                        {service.description && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{service.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <CategoryBadge category={service.category} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white">{formatCurrency(service.basePrice)}</td>
                      <td className="px-4 py-3 text-right text-slate-400 hidden md:table-cell">{service.baseTime}m</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          service.isActive !== false
                            ? 'bg-green-500/15 text-green-300 border border-green-500/20'
                            : 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
                        }`}>
                          {service.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`edit-btn-${service._id}`}
                            onClick={() => { setEditTarget(service); setModalOpen(true) }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-300 hover:bg-primary-500/10 transition-all"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {service.isActive !== false && (
                            <button
                              id={`delete-btn-${service._id}`}
                              onClick={() => setDeleteTarget(service)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Deactivate"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <ServiceModal
          service={editTarget}
          onClose={() => { setModalOpen(false); setEditTarget(null) }}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          service={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  )
}
