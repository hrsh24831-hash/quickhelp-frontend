import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'
import { useAuthStore } from '../../store/authStore'
import { useProviderLocationBroadcast } from '../../hooks/useTracking'
import DisputeModal from '../customer/DisputeModal'
import { formatCurrency } from '../../utils/format'
import {
  Sliders,
  MapPin,
  Briefcase,
  CheckCircle,
  Save,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Coins,
  MessageSquare,
  AlertCircle
} from 'lucide-react'

const STATUS_COLORS = {
  'Confirmed':       'bg-blue-50 text-blue-700 border-blue-200',
  'Worker Assigned': 'bg-purple-50 text-purple-700 border-purple-200',
  'In Progress':     'bg-amber-50 text-amber-700 border-amber-200',
  'Completed':       'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Cancelled':       'bg-red-50 text-red-700 border-red-200',
}

const NEXT_STATUS = {
  'Worker Assigned': 'In Progress',
  'In Progress':     'Completed',
}

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
    {status}
  </span>
)

const PRESET_CATEGORIES = [
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'ac_repair', label: 'AC Repair' },
  { id: 'carpentry', label: 'Carpentry' },
  { id: 'pest_control', label: 'Pest Control' },
  { id: 'painting', label: 'Painting' },
  { id: 'appliance_repair', label: 'Appliance Repair' }
]

const PRESET_AREAS = [
  'Delhi', 'Gurgaon', 'Noida', 'Faridabad',
  'Mumbai', 'Pune', 'Ahmedabad', 'Surat',
  'Bangalore', 'Chennai', 'Hyderabad', 'Kochi', 'Kolkata'
]

// Wrapper that activates navigator.geolocation.watchPosition and socket emissions for an active booking
function ProviderLiveBroadcastPanel({ bookingId, token, userId }) {
  const { isConnected, telemetry } = useProviderLocationBroadcast(bookingId, token, userId)

  return (
    <div className="mt-4 p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs animate-pulse">
      <div className="flex flex-col gap-0.5">
        <span className="text-indigo-700 font-semibold uppercase tracking-wider flex items-center gap-1">
          📡 GPS Tracking Active
        </span>
        {telemetry.lat !== null && (
          <span className="text-slate-500 font-mono">Coords: {telemetry.lat.toFixed(4)}, {telemetry.lng.toFixed(4)}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 font-medium">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className={isConnected ? 'text-emerald-700' : 'text-red-700'}>
          {isConnected ? 'Broadcasting live' : 'Offline'}
        </span>
      </div>
    </div>
  )
}

export default function BookingQueue() {
  const { token, user, updateUser } = useAuthStore()
  const [bookings, setBookings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [acting, setActing]       = useState(null)
  const [disputeTarget, setDisputeTarget] = useState(null)

  // Geolocation states
  const [coords, setCoords]       = useState(null)
  const [geoError, setGeoError]   = useState(null)

  // Preferences / Onboarding form states
  const [showPrefPanel, setShowPrefPanel] = useState(false)
  const [prefCategories, setPrefCategories] = useState([])
  const [prefAreas, setPrefAreas] = useState([])
  const [prefBio, setPrefBio] = useState('')
  const [customArea, setCustomArea] = useState('')
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsMsg, setPrefsMsg] = useState({ type: '', text: '' })

  const fetchQueue = useCallback(async (currentCoords) => {
    setLoading(true)
    try {
      const params = {}
      if (currentCoords) {
        params.lat = currentCoords.latitude
        params.lng = currentCoords.longitude
      }
      const res = await api.get('/bookings/provider', { params })
      setBookings(res.data.data || [])
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [])

  const acquireLocation = useCallback(() => {
    setGeoError(null)
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by this browser.')
      fetchQueue(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(pos.coords)
        fetchQueue(pos.coords)
      },
      (err) => {
        console.warn('getCurrentPosition failed:', err)
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access denied. Displaying bookings by area fallback.'
            : 'Could not fetch location. Displaying bookings by area fallback.'
        )
        fetchQueue(null)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [fetchQueue])

  // Sync profile details manually to ensure store matches DB
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/profile')
      if (res.data.data) {
        updateUser(res.data.data)
      }
    } catch (err) {
      console.error('Failed to load profile', err)
    }
  }, [updateUser])

  useEffect(() => {
    acquireLocation()
    fetchProfile()
  }, [acquireLocation, fetchProfile])

  // Load preferences form data when user state gets populated
  useEffect(() => {
    if (user?.providerProfile) {
      setPrefCategories(user.providerProfile.categories || [])
      setPrefAreas(user.providerProfile.serviceAreas || [])
      setPrefBio(user.providerProfile.bio || '')
      
      // Auto-open panel if profile setup is completely blank
      if ((user.providerProfile.categories || []).length === 0 || (user.providerProfile.serviceAreas || []).length === 0) {
        setShowPrefPanel(true)
      }
    }
  }, [user])

  const handleSavePrefs = async () => {
    setSavingPrefs(true)
    setPrefsMsg({ type: '', text: '' })
    try {
      const res = await api.post('/auth/provider-onboard', {
        bio: prefBio,
        categories: prefCategories,
        serviceAreas: prefAreas
      })
      
      updateUser({
        ...user,
        providerProfile: res.data.data
      })
      
      setPrefsMsg({ type: 'success', text: 'Preferences updated successfully!' })
      
      // Refresh the bookings list
      fetchQueue(coords)
      
      // Collapse after delay
      setTimeout(() => {
        setShowPrefPanel(false)
        setPrefsMsg({ type: '', text: '' })
      }, 1500)
    } catch (err) {
      setPrefsMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save preferences' })
    } finally {
      setSavingPrefs(false)
    }
  }

  const toggleCategory = (catId) => {
    setPrefCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    )
  }

  const handleAddArea = () => {
    const trimmed = customArea.trim()
    if (!trimmed) return
    if (!prefAreas.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      setPrefAreas(prev => [...prev, trimmed])
    }
    setCustomArea('')
  }

  const handleRemoveArea = (areaToRemove) => {
    setPrefAreas(prev => prev.filter(a => a !== areaToRemove))
  }

  const handleTogglePresetArea = (area) => {
    setPrefAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const handleAccept = async (id) => {
    setActing(id + '_accept')
    try {
      await api.patch(`/bookings/${id}/accept`)
      fetchQueue(coords)
    } catch (err) {
      alert(err.response?.data?.message || 'Accept failed')
    } finally {
      setActing(null)
    }
  }

  const handleReject = async (id) => {
    setActing(id + '_reject')
    try {
      await api.patch(`/bookings/${id}/reject`)
      fetchQueue(coords)
    } catch (err) {
      alert(err.response?.data?.message || 'Reject failed')
    } finally {
      setActing(null)
    }
  }

  const handleAdvanceStatus = async (id, nextStatus) => {
    setActing(id + '_advance')
    try {
      await api.patch(`/bookings/${id}/status`, { status: nextStatus })
      fetchQueue(coords)
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed')
    } finally {
      setActing(null)
    }
  }

  const open     = bookings.filter(b => b.status === 'Confirmed' && !b.providerId)
  const assigned = bookings.filter(b => b.status !== 'Confirmed' || b.providerId)

  const isProfileIncomplete = (user?.providerProfile?.categories || []).length === 0 || (user?.providerProfile?.serviceAreas || []).length === 0

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Dispute Modal */}
      {disputeTarget && (
        <DisputeModal
          booking={disputeTarget}
          onClose={() => setDisputeTarget(null)}
          onSubmitted={() => {
            setDisputeTarget(null)
            alert('Dispute submitted. Our team will review it shortly.')
          }}
        />
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
              Booking Queue
              {user?.providerProfile?.isVerified && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase" title="Verified Profile">
                  ✓ Verified
                </span>
              )}
            </h1>
            <p className="text-slate-500 text-sm">Open requests in your area · {open.length} available</p>
          </div>
          
          <button
            onClick={() => setShowPrefPanel(prev => !prev)}
            className="inline-flex items-center justify-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            {showPrefPanel ? 'Hide Settings' : 'Service Preferences'}
            {showPrefPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Profile Incomplete Banner */}
        {isProfileIncomplete && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 animate-fade-in shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Setup Required: Preferences Missing</h3>
              <p className="text-xs text-rose-700 mt-0.5">
                You have not configured your service categories or service areas. You will not receive any jobs until you fill in your preferences below and click Save.
              </p>
            </div>
          </div>
        )}

        {/* Interactive Preferences Panel */}
        <AnimatePresence>
          {showPrefPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <div className="glass-card p-6 border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                  <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-500" />
                    Configure Service Preferences
                  </h2>
                  <span className="text-[10px] text-slate-400 font-mono">ONBOARDING & MATCHING</span>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Professional Bio</label>
                  <textarea
                    value={prefBio}
                    onChange={(e) => setPrefBio(e.target.value)}
                    placeholder="Describe your skills and experience to potential customers..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    Service Categories
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_CATEGORIES.map(cat => {
                      const active = prefCategories.includes(cat.id)
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={`text-xs font-semibold py-2 px-3 rounded-xl border transition-all text-center ${
                            active
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {cat.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Service Areas */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Service Areas
                  </label>

                  {/* Selected areas tags */}
                  {prefAreas.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                      {prefAreas.map(area => (
                        <span key={area} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium shadow-sm">
                          {area}
                          <button
                            onClick={() => handleRemoveArea(area)}
                            className="text-slate-400 hover:text-red-500 p-0.5 rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 italic bg-amber-50 border border-amber-100 p-2.5 rounded-xl flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> No service areas selected yet.
                    </div>
                  )}

                  {/* Preset areas quick checkboxes */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Quick Select Cities</span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_AREAS.map(area => {
                        const active = prefAreas.includes(area)
                        return (
                          <button
                            key={area}
                            onClick={() => handleTogglePresetArea(area)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                              active
                                ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {area}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Custom area field */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Add Custom Area / Town (highly useful for testing)</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customArea}
                        onChange={(e) => setCustomArea(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddArea() } }}
                        placeholder="e.g. Phagwara Tahsil, Punjab, block 38"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors text-xs"
                      />
                      <button
                        onClick={handleAddArea}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save button and Messages */}
                <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    {prefsMsg.text && (
                      <div className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
                        prefsMsg.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        {prefsMsg.text}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSavePrefs}
                    disabled={savingPrefs || prefCategories.length === 0 || prefAreas.length === 0}
                    className="btn-primary sm:w-auto text-xs py-2.5 px-6 font-bold flex items-center justify-center gap-2 shadow-sm rounded-xl"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingPrefs ? 'Saving Settings...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Location fallbacks notice */}
        {geoError && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3.5 rounded-2xl flex items-center justify-between animate-fade-in shadow-sm">
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>{geoError}</span>
            </span>
            <button
              onClick={acquireLocation}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-xl font-bold transition-all text-xs shadow-sm"
            >
              Retry GPS
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="glass-card p-6 animate-pulse space-y-3">
                <div className="h-4 bg-slate-100 rounded w-48" />
                <div className="h-3 bg-slate-100 rounded w-64" />
                <div className="h-3 bg-slate-100 rounded w-32" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Open / Available Jobs */}
            {open.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Available Jobs
                </h2>
                <div className="space-y-4">
                  {open.map(b => (
                    <div
                      key={b._id}
                      id={`queue-card-${b._id}`}
                      className="glass-card p-5 border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 animate-fade-in"
                    >
                      <div className="flex items-start justify-between mb-3.5">
                        <div>
                          <p className="text-slate-800 font-bold text-base">{b.serviceId?.serviceName}</p>
                          <p className="text-slate-400 text-[10px] font-mono mt-0.5">{b.bookingID}</p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-xs mb-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-slate-400 uppercase tracking-wider font-semibold text-[9px]">Area</p>
                          <p className="text-slate-700 font-semibold mt-0.5">{b.area}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 uppercase tracking-wider font-semibold text-[9px]">Time Slot</p>
                          <p className="text-slate-700 font-semibold mt-0.5">{b.timeSlot}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 uppercase tracking-wider font-semibold text-[9px]">Payout</p>
                          <p className="text-emerald-600 font-bold mt-0.5 text-sm">{formatCurrency(b.finalPrice)}</p>
                        </div>
                        
                        {/* Location Details (if distance is calculated) */}
                        {b.distanceKm !== undefined && (
                          <div className="col-span-3 border-t border-slate-100 pt-2 flex items-center gap-3 text-[10px] text-indigo-600 font-mono">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {b.distanceKm} km away
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              ~{b.estimatedTravelTime} mins travel
                            </span>
                          </div>
                        )}

                        {/* Customer Delivery Address */}
                        {b.address && b.address.addressLine && (
                          <div className="col-span-3 border-t border-slate-100 pt-2 mt-1">
                            <p className="text-slate-400 text-[9px] uppercase tracking-wider font-semibold">📍 Delivery Address</p>
                            <p className="text-slate-600 text-xs mt-0.5 font-medium leading-relaxed">
                              {b.address.addressLine}
                              {b.address.locality && `, ${b.address.locality}`}
                              {b.address.city && `, ${b.address.city}`}
                              {b.address.pincode && ` - ${b.address.pincode}`}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          id={`accept-btn-${b._id}`}
                          onClick={() => handleAccept(b._id)}
                          disabled={!!acting}
                          className="btn-primary text-xs py-2 px-5 rounded-xl disabled:opacity-40 w-auto shadow-sm"
                        >
                          {acting === b._id + '_accept' ? 'Accepting…' : '✓ Accept Job'}
                        </button>
                        <button
                          id={`reject-btn-${b._id}`}
                          onClick={() => handleReject(b._id)}
                          disabled={!!acting}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50/50 border border-slate-200 px-4 py-2 rounded-xl transition-all disabled:opacity-40 font-semibold"
                        >
                          {acting === b._id + '_reject' ? 'Rejecting…' : '✗ Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* My Assigned Jobs */}
            {assigned.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  My Active Jobs
                </h2>
                <div className="space-y-4">
                  {assigned.map(b => (
                    <div
                      key={b._id}
                      id={`my-job-${b._id}`}
                      className="glass-card p-5 border-l-4 border-l-indigo-500 shadow-sm animate-fade-in"
                    >
                      <div className="flex items-start justify-between mb-3.5">
                        <div>
                          <p className="text-slate-800 font-bold text-base">{b.serviceId?.serviceName}</p>
                          <p className="text-slate-400 text-[10px] font-mono mt-0.5">{b.bookingID}</p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-xs mb-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-slate-400 uppercase tracking-wider font-semibold text-[9px]">Area</p>
                          <p className="text-slate-700 font-semibold mt-0.5">{b.area}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 uppercase tracking-wider font-semibold text-[9px]">Time Slot</p>
                          <p className="text-slate-700 font-semibold mt-0.5">{b.timeSlot}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 uppercase tracking-wider font-semibold text-[9px]">Payout</p>
                          <p className="text-emerald-600 font-bold mt-0.5 text-sm">{formatCurrency(b.finalPrice)}</p>
                        </div>
                        
                        {/* Distance / ETA Details */}
                        {b.distanceKm !== undefined && (
                          <div className="col-span-3 border-t border-slate-100 pt-2 flex items-center gap-3 text-[10px] text-indigo-600 font-mono">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {b.distanceKm} km away
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              ~{b.estimatedTravelTime} mins travel
                            </span>
                          </div>
                        )}

                        {/* Customer Address */}
                        {b.address && b.address.addressLine && (
                          <div className="col-span-3 border-t border-slate-100 pt-2 mt-1">
                            <p className="text-slate-400 text-[9px] uppercase tracking-wider font-semibold">📍 Delivery Address</p>
                            <p className="text-slate-600 text-xs mt-0.5 font-medium leading-relaxed">
                              {b.address.addressLine}
                              {b.address.locality && `, ${b.address.locality}`}
                              {b.address.city && `, ${b.address.city}`}
                              {b.address.pincode && ` - ${b.address.pincode}`}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 items-center">
                        {NEXT_STATUS[b.status] && (
                          <button
                            id={`advance-btn-${b._id}`}
                            onClick={() => handleAdvanceStatus(b._id, NEXT_STATUS[b.status])}
                            disabled={!!acting}
                            className="btn-secondary text-xs py-2 px-5 rounded-xl disabled:opacity-40 w-auto shadow-sm font-semibold border-slate-200 text-indigo-600"
                          >
                            {acting === b._id + '_advance'
                              ? 'Updating…'
                              : `→ Mark as ${NEXT_STATUS[b.status]}`}
                          </button>
                        )}
                        {!['Cancelled', 'Rejected', 'Completed'].includes(b.status) && (
                          <Link
                            id={`chat-btn-provider-${b._id}`}
                            to={`/chat/${b._id}`}
                            className="inline-flex items-center justify-center gap-1.5 text-xs text-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-500 px-4 py-2 rounded-xl font-bold transition-all shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Chat
                          </Link>
                        )}
                        {/* Provider can raise dispute on any non-closed booking */}
                        {!['Cancelled', 'Rejected'].includes(b.status) && (
                          <button
                            id={`dispute-btn-provider-${b._id}`}
                            onClick={() => setDisputeTarget({ id: b._id, serviceName: b.serviceId?.serviceName, bookingID: b.bookingID })}
                            className="text-xs text-rose-600 hover:text-white border border-rose-100 hover:border-rose-500 bg-rose-50/50 hover:bg-rose-500 px-4 py-2 rounded-xl transition-all shadow-sm font-bold"
                          >
                            ⚠️ Dispute
                          </button>
                        )}
                      </div>

                      {/* Mount tracking panel if the status is active */}
                      {['Worker Assigned', 'In Progress'].includes(b.status) && (
                        <ProviderLiveBroadcastPanel
                          bookingId={b._id}
                          token={token}
                          userId={user?.id}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {open.length === 0 && assigned.length === 0 && (
              <div className="glass-card p-12 text-center animate-fade-in flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl mb-4 shadow-sm">
                  🔍
                </div>
                <p className="text-slate-800 font-bold text-base mb-1">No jobs available</p>
                <p className="text-slate-400 text-xs max-w-sm">
                  We couldn't find any bookings matching your current location or service preference areas.
                </p>
                <button
                  onClick={() => setShowPrefPanel(true)}
                  className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Configure Service Settings →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
