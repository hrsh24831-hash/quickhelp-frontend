import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'
import { useAuthStore } from '../../store/authStore'
import LiveTrackingMap from '../tracking/LiveTrackingMap'
import { useBookingTracking } from '../../hooks/useTracking'
import { formatCurrency } from '../../utils/format'

const STATUS_DESCRIPTIONS = {
  'Worker Assigned': 'Provider is assigned and heading to your location.',
  'In Progress':     'Service is currently underway.',
}

export default function TrackingPage() {
  const { id } = useParams()
  const { token, user } = useAuthStore()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Call the hook at the top, passing bookingId dynamically (or null if not loaded yet)
  const bookingId = booking?.id || null
  const providerId = booking?.providerId || null
  const { location: liveLocation, isConnected } = useBookingTracking(bookingId, providerId, token, user?.id)

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const res = await api.get('/bookings')
        const item = res.data.find(b => b.id === id)
        if (!item) {
          setError('Booking not found')
        } else {
          setBooking(item)
        }
      } catch (err) {
        setError('Failed to fetch booking details')
      } finally {
        setLoading(false)
      }
    }
    fetchBookingDetails()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8 animate-pulse text-center">
          <div className="h-8 bg-white/10 rounded w-1/3 mx-auto mb-6" />
          <div className="h-[400px] bg-white/5 rounded-none" />
        </main>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="card p-8">
            <h1 className="text-xl font-semibold text-slate-800 mb-2">Error</h1>
            <p className="text-slate-500 text-sm mb-6">{error || 'Booking details not available.'}</p>
            <Link to="/customer/bookings" className="btn-primary py-2 px-5 text-sm">
              Back to Bookings
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // For completed / cancelled bookings, live tracking is not meaningful.
  // Show a friendly completed state instead of the map.
  if (['Completed', 'Cancelled'].includes(booking.status)) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="card p-8">
            <div className="text-5xl mb-4">
              {booking.status === 'Completed' ? '✅' : '❌'}
            </div>
            <h1 className="text-xl font-semibold text-slate-800 mb-2">
              {booking.status === 'Completed' ? 'Job Completed' : 'Booking Cancelled'}
            </h1>
            <p className="text-slate-500 text-sm mb-1">{booking.serviceName}</p>
            <p className="text-slate-500 text-xs font-mono mb-6">{booking.bookingID}</p>
            <p className="text-slate-500 text-sm mb-6">
              {booking.status === 'Completed'
                ? 'This booking has been completed. Live tracking is no longer active.'
                : 'This booking was cancelled. There is no tracking data available.'}
            </p>
            <Link to="/customer/bookings" className="btn-primary py-2 px-5 text-sm">
              ← Back to My Bookings
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // Ensure customer location coordinate stubs (for active tracking only)
  const drop = booking.customerLocation && booking.customerLocation.lat != null
    ? { lat: booking.customerLocation.lat, lng: booking.customerLocation.lng }
    : { lat: 28.6139, lng: 77.2090 }

  let liveEtaVal = null
  if (liveLocation && liveLocation.lat != null && drop.lat != null) {
    const lat1 = liveLocation.lat
    const lon1 = liveLocation.lng
    const lat2 = drop.lat
    const lon2 = drop.lng
    
    // Haversine distance calculation
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    
    // Recalculate duration: speed averages 30 km/h
    liveEtaVal = Math.max(1, Math.round((distance / 30) * 60))
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">Live Tracking</h1>
              <span className="bg-slate-900 text-slate-800 border border-none text-xs px-2.5 py-0.5 rounded-none font-medium">
                {booking.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">{STATUS_DESCRIPTIONS[booking.status] || 'Service update live stream'}</p>
          </div>

          <Link to="/customer/bookings" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
            ← Back to My Bookings
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Column */}
          <div className="lg:col-span-2">
            <LiveTrackingMap
              bookingId={booking.id}
              providerId={booking.providerId}
              pickup={null}
              drop={drop}
              token={token}
              userId={user?.id}
              location={liveLocation}
              isConnected={isConnected}
            />
          </div>

          {/* Details Column */}
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Job details</h2>
              
              <div className="space-y-3.5 text-sm">
                <div>
                  <p className="text-slate-500 text-xs font-mono uppercase">Service Name</p>
                  <p className="text-slate-800 font-medium">{booking.serviceName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-mono uppercase">Booking ID</p>
                  <p className="text-slate-800 font-mono">{booking.bookingID}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-mono uppercase">Live ETA</p>
                  <p className={`text-slate-800 font-medium ${liveEtaVal !== null ? 'text-amber-800 font-bold animate-pulse' : ''}`}>
                    {liveEtaVal !== null ? `${liveEtaVal} min` : `${booking.estimatedArrivalTime} min (Static)`}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-mono uppercase">Price Paid</p>
                  <p className="text-emerald-400 font-semibold">{formatCurrency(booking.finalPrice)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6 border-primary-500/20 bg-primary-500/5">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Safety guidelines</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Please verify the provider matches the details displayed. QuickHelp personnel will always present their onboarding credentials before commencing work.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
