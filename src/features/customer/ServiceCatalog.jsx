import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Wrench,
  Zap,
  Snowflake,
  Hammer,
  Bug,
  Paintbrush,
  Plug,
  Home,
  Star,
  Clock,
  MapPin
} from 'lucide-react'
import api from '../../api/axiosClient'
import Navbar from '../../components/Navbar'
import { formatCurrency } from '../../utils/format'

const CATEGORIES = [
  { value: 'all',              label: 'All Services',    icon: Home },
  { value: 'cleaning',         label: 'Cleaning',        icon: Sparkles },
  { value: 'plumbing',         label: 'Plumbing',        icon: Wrench },
  { value: 'electrical',       label: 'Electrical',      icon: Zap },
  { value: 'ac_repair',        label: 'AC Repair',       icon: Snowflake },
  { value: 'carpentry',        label: 'Carpentry',       icon: Hammer },
  { value: 'pest_control',     label: 'Pest Control',    icon: Bug },
  { value: 'painting',         label: 'Painting',        icon: Paintbrush },
  { value: 'appliance_repair', label: 'Appliances',      icon: Plug },
]

const AREAS = [
  'all', 'Delhi', 'Gurgaon', 'Noida', 'Faridabad',
  'Mumbai', 'Pune', 'Ahmedabad', 'Surat',
  'Bangalore', 'Chennai', 'Hyderabad', 'Kochi', 'Kolkata'
]

const CATEGORY_IMAGES = {
  all:              'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=480&q=80',
  cleaning:         'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=480&q=80',
  plumbing:         'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=480&q=80',
  electrical:       'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=480&q=80',
  ac_repair:        'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=480&q=80',
  carpentry:        'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?auto=format&fit=crop&w=480&q=80',
  pest_control:     'https://images.unsplash.com/photo-1587334206572-ee2624b4957a?auto=format&fit=crop&w=480&q=80',
  painting:         'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=480&q=80',
  appliance_repair: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=480&q=80',
}

const CATEGORY_META = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]))

// ── Service Card ────────────────────────────────────────────────────
function ServiceCard({ service, onBook }) {
  const meta = CATEGORY_META[service.category] || { icon: Wrench, label: service.category }
  const imageUrl = CATEGORY_IMAGES[service.category] || CATEGORY_IMAGES.all

  return (
    <div
      id={`service-card-${service._id}`}
      className="bg-white p-5 flex flex-col gap-4 transition-colors hover:bg-slate-50/50 cursor-pointer rounded-none"
      onClick={() => onBook(service)}
    >
      {/* Service photo */}
      <div className="w-full h-36 bg-slate-100 overflow-hidden rounded-none relative">
        <img
          src={imageUrl}
          alt={service.serviceName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-slate-900 text-sm leading-snug truncate">
            {service.serviceName}
          </h3>
          <div className="text-sm font-bold text-slate-900 flex-shrink-0">
            {formatCurrency(service.basePrice)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
            {meta.label}
          </span>
          <span className="text-[10px] text-slate-400">•</span>
          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
            <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" /> 4.8
          </span>
        </div>

        {service.description && (
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mt-1">
            {service.description}
          </p>
        )}
      </div>

      {/* Footer meta & action */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1 text-[11px]">
            <Clock size={12} />
            {service.baseTime} min
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <MapPin size={12} />
            {service.areasAvailable?.length ?? 0} areas
          </div>
        </div>

        <button
          className="px-4 py-1.5 bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors rounded-none"
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
    <div className="bg-white p-5 flex flex-col gap-4 rounded-none border border-slate-200 animate-pulse">
      <div className="w-full h-36 bg-slate-100" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3.5 bg-slate-100 rounded w-2/3" />
        <div className="h-2.5 bg-slate-100 rounded w-1/3" />
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────
export default function ServiceCatalog() {
  const navigate = useNavigate()

  const [services,  setServices]  = useState([])
  const [allServices, setAllServices] = useState([])
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
      const list = Array.isArray(res.data) ? res.data : res.data.data;
      setServices(list)

      if (allServices.length === 0) {
        if (!params.toString()) {
          setAllServices(list)
        } else {
          const raw = await api.get('/services')
          setAllServices(Array.isArray(raw.data) ? raw.data : raw.data.data)
        }
      }
    } catch {
      setError('Failed to load services. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [query, category, area, allServices.length])

  // Re-fetch whenever filters change (debounced for text query)
  useEffect(() => {
    const timer = setTimeout(fetchServices, query ? 400 : 0)
    return () => clearTimeout(timer)
  }, [fetchServices, query])

  const handleBook = (service) => {
    navigate(`/customer/services/${service._id}`)
  }

  const activeFilters = (category !== 'all' ? 1 : 0) + (area !== 'all' ? 1 : 0) + (query ? 1 : 0)

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Hero section */}
        <div className="bg-slate-50 border border-slate-200 rounded-none p-8 mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            Find a Trusted <span className="text-amber-500">Service</span>
          </h1>
          <p className="text-slate-600 text-sm mb-6">Browse and book trusted home service professionals at your doorstep</p>

          <div className="flex flex-col md:flex-row gap-3 bg-white p-2 border border-slate-200 rounded-none">
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2 px-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="service-search-input"
                type="text"
                placeholder="Search services (e.g. pipe leak, deep clean…)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-sm py-1.5"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            {/* Divider */}
            <div className="hidden md:block w-[1px] bg-slate-200 my-1" />
            {/* Area dropdown */}
            <div className="flex items-center gap-2 px-2 select-container">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <select
                id="area-filter-select"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-800 text-sm cursor-pointer pr-6 py-1.5"
              >
                <option value="all">All Areas</option>
                {AREAS.filter((a) => a !== 'all').map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            {/* Search action button */}
            <button
              onClick={fetchServices}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-none px-6 py-2 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Category strip */}
        <div id="category-filters" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-[1px] bg-slate-200 border border-slate-200 mb-8 rounded-none">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.value;
            const IconComponent = cat.icon;
            const sourceList = allServices.length > 0 ? allServices : services;
            const count = sourceList.filter(s => cat.value === 'all' || s.category === cat.value).length;
            return (
              <button
                key={cat.value}
                id={`category-filter-${cat.value}`}
                onClick={() => setCategory(cat.value)}
                className={`flex flex-col items-center justify-center p-4 bg-white transition-all rounded-none ${
                  isSelected
                    ? 'border-b-2 border-b-amber-400 relative z-10'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className={`w-9 h-9 flex items-center justify-center rounded-none mb-2 ${
                  isSelected ? 'bg-slate-900 text-amber-400' : 'bg-slate-100 text-slate-700'
                }`}>
                  <IconComponent size={18} />
                </div>
                <span className="text-slate-800 text-[10px] font-semibold text-center leading-tight tracking-wider uppercase truncate w-full">
                  {cat.label}
                </span>
                <span className="text-slate-500 text-[9px] mt-0.5">
                  {count} options
                </span>
              </button>
            )
          })}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-500 text-sm">
            {loading ? 'Loading…' : `${services.length} service${services.length !== 1 ? 's' : ''} found`}
            {activeFilters > 0 && (
              <span className="ml-2 text-amber-600 font-medium">({activeFilters} filter{activeFilters > 1 ? 's' : ''} active)</span>
            )}
          </p>
          {activeFilters > 0 && (
            <button
              id="clear-filters-btn"
              onClick={() => { setQuery(''); setCategory('all'); setArea('all') }}
              className="text-xs text-slate-500 hover:text-slate-800 hover:underline transition-all"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="border border-red-500/20 text-red-500 text-sm p-4 mb-4 bg-red-50 rounded-none">{error}</div>
        )}

        {/* Service grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : services.length === 0 ? (
          <div className="border border-slate-200 bg-white p-12 text-center animate-fade-in rounded-none">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No services found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div id="services-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-slate-200 border border-slate-200 animate-fade-in rounded-none">
            {services.map((s) => (
              <ServiceCard key={s._id} service={s} onBook={handleBook} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
