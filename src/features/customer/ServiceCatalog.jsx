import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axiosClient'
import Navbar from '../../components/Navbar'
import { formatCurrency } from '../../utils/format'

const CATEGORIES = [
  { value: 'all',              label: 'All Services',    icon: '🏠' },
  { value: 'cleaning',         label: 'Cleaning',        icon: '🧹' },
  { value: 'plumbing',         label: 'Plumbing',        icon: '🔧' },
  { value: 'electrical',       label: 'Electrical',      icon: '⚡' },
  { value: 'ac_repair',        label: 'AC Repair',       icon: '❄️' },
  { value: 'carpentry',        label: 'Carpentry',       icon: '🪚' },
  { value: 'pest_control',     label: 'Pest Control',    icon: '🐛' },
  { value: 'painting',         label: 'Painting',        icon: '🎨' },
  { value: 'appliance_repair', label: 'Appliances',      icon: '🔌' },
]

const AREAS = [
  'all', 'Delhi', 'Gurgaon', 'Noida', 'Faridabad',
  'Mumbai', 'Pune', 'Ahmedabad', 'Surat',
  'Bangalore', 'Chennai', 'Hyderabad', 'Kochi', 'Kolkata'
]

const CATEGORY_META = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]))

// ── Service Card ────────────────────────────────────────────────────
function ServiceCard({ service, onBook }) {
  const meta = CATEGORY_META[service.category] || { icon: '🔧', label: service.category }

  return (
    <div
      id={`service-card-${service._id}`}
      className="glass-card p-5 flex flex-col gap-4 group hover:scale-[1.02] hover:border-primary-500/30 transition-all duration-200 cursor-pointer"
      onClick={() => onBook(service)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-500/15 border border-primary-500/20 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-primary-500/25 transition-colors">
            {meta.icon}
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight">{service.serviceName}</h3>
            <span className="text-xs text-primary-400 font-medium capitalize">
              {meta.label}
            </span>
          </div>
        </div>
        {/* Price */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-white">{formatCurrency(service.basePrice)}</div>
          <div className="text-xs text-slate-500">base price</div>
        </div>
      </div>

      {/* Description */}
      {service.description && (
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
          {service.description}
        </p>
      )}

      {/* Footer meta */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ~{service.baseTime} min
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {service.areasAvailable?.length ?? 0} areas
        </div>
        <button
          className="px-3 py-1 rounded-lg bg-primary-500/20 text-primary-300 text-xs font-medium hover:bg-primary-500/40 transition-colors"
          onClick={(e) => { e.stopPropagation(); onBook(service) }}
        >
          Book now
        </button>
      </div>
    </div>
  )
}

// ── Loading skeleton ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-white/5" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3.5 bg-white/5 rounded w-2/3" />
          <div className="h-2.5 bg-white/5 rounded w-1/3" />
        </div>
        <div className="w-14 space-y-2">
          <div className="h-5 bg-white/5 rounded" />
          <div className="h-2.5 bg-white/5 rounded w-2/3" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 bg-white/5 rounded" />
        <div className="h-2.5 bg-white/5 rounded w-4/5" />
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────
export default function ServiceCatalog() {
  const navigate = useNavigate()

  const [services,  setServices]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [query,     setQuery]     = useState('')
  const [category,  setCategory]  = useState('all')
  const [area,      setArea]      = useState('all')

  const fetchServices = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (category !== 'all') params.set('category', category)
      if (area !== 'all') params.set('area', area)

      const endpoint = params.toString()
        ? `/services/search?${params}`
        : '/services'

      const res = await api.get(endpoint)
      // Both endpoints return either array or { data: [] }
      setServices(Array.isArray(res.data) ? res.data : res.data.data)
    } catch {
      setError('Failed to load services. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [query, category, area])

  // Re-fetch whenever filters change (debounced for text query)
  useEffect(() => {
    const timer = setTimeout(fetchServices, query ? 400 : 0)
    return () => clearTimeout(timer)
  }, [fetchServices, query])

  const handleBook = (service) => {
    // Phase 3 will wire this to BookingPreview
    navigate(`/customer/services/${service._id}`)
  }

  const activeFilters = (category !== 'all' ? 1 : 0) + (area !== 'all' ? 1 : 0) + (query ? 1 : 0)

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Hero search bar */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-white mb-1">Find a Service</h1>
          <p className="text-slate-400 text-sm mb-5">Browse and book trusted professionals near you</p>

          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="service-search-input"
              type="text"
              placeholder="Search services (e.g. pipe leak, deep clean…)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="glass-input pl-10 pr-10"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up">
          {/* Category pills */}
          <div id="category-filters" className="flex gap-2 flex-wrap flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                id={`category-filter-${cat.value}`}
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  category === cat.value
                    ? 'bg-primary-500/30 border-primary-500/60 text-primary-200'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Area dropdown */}
          <div className="flex-shrink-0">
            <select
              id="area-filter-select"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="glass-input py-2 text-sm min-w-[140px] cursor-pointer"
            >
              <option value="all">All Areas</option>
              {AREAS.filter((a) => a !== 'all').map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-400 text-sm">
            {loading ? 'Loading…' : `${services.length} service${services.length !== 1 ? 's' : ''} found`}
            {activeFilters > 0 && (
              <span className="ml-2 text-primary-400">({activeFilters} filter{activeFilters > 1 ? 's' : ''} active)</span>
            )}
          </p>
          {activeFilters > 0 && (
            <button
              id="clear-filters-btn"
              onClick={() => { setQuery(''); setCategory('all'); setArea('all') }}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card p-4 border-red-500/20 text-red-400 text-sm mb-4">{error}</div>
        )}

        {/* Service grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : services.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-white mb-2">No services found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div id="services-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {services.map((s) => (
              <ServiceCard key={s._id} service={s} onBook={handleBook} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
