import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'
import { useAuthStore } from '../../store/authStore'
import { useProviderLocationBroadcast } from '../../hooks/useTracking'
import DisputeModal from '../customer/DisputeModal'
import { formatCurrency } from '../../utils/format'


const STATUS_COLORS = {
  'Confirmed':      'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Worker Assigned':'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'In Progress':    'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Completed':      'bg-green-500/20 text-green-300 border-green-500/30',
  'Cancelled':      'bg-red-500/20 text-red-300 border-red-500/30',
}

const NEXT_STATUS = {
  'Worker Assigned': 'In Progress',
  'In Progress':     'Completed',
}

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
    {status}
  </span>
)

// Wrapper that activates navigator.geolocation.watchPosition and socket emissions for an active booking
function ProviderLiveBroadcastPanel({ bookingId, token, userId }) {
  const { isConnected, telemetry } = useProviderLocationBroadcast(bookingId, token, userId)

  return (
    <div className="mt-4 p-3.5 bg-primary-500/5 border border-primary-500/20 rounded-xl flex items-center justify-between text-xs animate-pulse">
      <div className="flex flex-col gap-0.5">
        <span className="text-primary-300 font-semibold uppercase tracking-wider">📡 GPS Tracking Active</span>
        {telemetry.lat !== null && (
          <span className="text-slate-400 font-mono">Coords: {telemetry.lat.toFixed(4)}, {telemetry.lng.toFixed(4)}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 font-medium">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
        <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
          {isConnected ? 'Broadcasting live' : 'Offline'}
        </span>
      </div>
    </div>
  )
}

export default function BookingQueue() {
  const { token, user } = useAuthStore()
  const [bookings, setBookings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [acting, setActing]       = useState(null)
  const [disputeTarget, setDisputeTarget] = useState(null)

  // Geolocation states
  const [coords, setCoords]       = useState(null)
  const [geoError, setGeoError]   = useState(null)

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

  useEffect(() => {
    acquireLocation()
  }, [acquireLocation])

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
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            Booking Queue
            {user?.providerProfile?.isVerified && (
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase" title="Verified Profile">
                ✓ Verified
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm">Open requests in your area · {open.length} available</p>
        </div>

        {geoError && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2">
              <span>📍</span>
              <span>{geoError}</span>
            </span>
            <button
              onClick={acquireLocation}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 px-3 py-1 rounded-lg font-semibold transition-all text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-48 mb-3" />
                <div className="h-3 bg-white/10 rounded w-64 mb-2" />
                <div className="h-3 bg-white/10 rounded w-32" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Open / Available Jobs */}
            {open.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Available Jobs
                </h2>
                <div className="space-y-4">
                  {open.map(b => (
                    <div
                      key={b._id}
                      id={`queue-card-${b._id}`}
                      className="glass-card p-5 border-blue-500/20 animate-fade-in"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold">{b.serviceId?.serviceName}</p>
                          <p className="text-slate-400 text-xs font-mono mt-0.5">{b.bookingID}</p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide">Area</p>
                          <p className="text-slate-200">{b.area}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide">Time Slot</p>
                          <p className="text-slate-200">{b.timeSlot}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide">Payout</p>
                          <p className="text-green-400 font-semibold">{formatCurrency(b.finalPrice)}</p>
                        </div>
                        {b.distanceKm !== undefined && (
                          <div className="col-span-3 bg-primary-500/10 border border-primary-500/20 rounded-lg px-3 py-1.5 text-xs text-primary-300 flex items-center gap-1.5 font-mono">
                            <span>📍</span>
                            <span>{b.distanceKm} km away</span>
                            <span>·</span>
                            <span>~{b.estimatedTravelTime} min to reach</span>
                          </div>
                        )}
                        {b.address && b.address.addressLine && (
                          <div className="col-span-3 border-t border-white/5 pt-2 mt-1">
                            <p className="text-slate-500 text-[10px] uppercase tracking-wide font-mono">📍 Delivery Address</p>
                            <p className="text-slate-300 text-xs mt-0.5 font-medium leading-relaxed">
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
                          className="btn-primary text-sm py-2 px-4 disabled:opacity-40"
                        >
                          {acting === b._id + '_accept' ? 'Accepting…' : '✓ Accept Job'}
                        </button>
                        <button
                          id={`reject-btn-${b._id}`}
                          onClick={() => handleReject(b._id)}
                          disabled={!!acting}
                          className="text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 px-4 py-2 rounded-lg transition-all disabled:opacity-40"
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
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  My Active Jobs
                </h2>
                <div className="space-y-4">
                  {assigned.map(b => (
                    <div
                      key={b._id}
                      id={`my-job-${b._id}`}
                      className="glass-card p-5 animate-fade-in"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold">{b.serviceId?.serviceName}</p>
                          <p className="text-slate-400 text-xs font-mono mt-0.5">{b.bookingID}</p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                        <div>
                          <p className="text-slate-500 text-xs uppercase">Area</p>
                          <p className="text-slate-200">{b.area}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs uppercase">Time Slot</p>
                          <p className="text-slate-200">{b.timeSlot}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs uppercase">Payout</p>
                          <p className="text-green-400 font-semibold">{formatCurrency(b.finalPrice)}</p>
                        </div>
                        {b.distanceKm !== undefined && (
                          <div className="col-span-3 bg-primary-500/10 border border-primary-500/20 rounded-lg px-3 py-1.5 text-xs text-primary-300 flex items-center gap-1.5 font-mono">
                            <span>📍</span>
                            <span>{b.distanceKm} km away</span>
                            <span>·</span>
                            <span>~{b.estimatedTravelTime} min to reach</span>
                          </div>
                        )}
                        {b.address && b.address.addressLine && (
                          <div className="col-span-3 border-t border-white/5 pt-2 mt-1">
                            <p className="text-slate-500 text-[10px] uppercase tracking-wide font-mono">📍 Delivery Address</p>
                            <p className="text-slate-300 text-xs mt-0.5 font-medium leading-relaxed">
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
                            className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
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
                            className="inline-flex items-center text-xs text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/25 px-3.5 py-2 rounded-lg transition-all"
                          >
                            💬 Chat
                          </Link>
                        )}
                        {/* Provider can raise dispute on any non-closed booking */}
                        {!['Cancelled', 'Rejected'].includes(b.status) && (
                          <button
                            id={`dispute-btn-provider-${b._id}`}
                            onClick={() => setDisputeTarget({ id: b._id, serviceName: b.serviceId?.serviceName, bookingID: b.bookingID })}
                            className="text-xs text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/15 px-3.5 py-1.5 rounded-lg transition-all"
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
              <div className="glass-card p-10 text-center animate-fade-in">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-white font-semibold mb-1">No jobs available</p>
                <p className="text-slate-400 text-sm">Bookings matching your areas and categories will appear here.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
