import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Lottie from 'lottie-react'
import {
  Star,
  MessageCircle,
  AlertTriangle,
  MapPin,
  CreditCard,
  Bike,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardList,
} from 'lucide-react'

import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'
import { formatCurrency } from '../../utils/format'
import RatingModal from './RatingModal'
import DisputeModal from './DisputeModal'

/* ── Status badge ─────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  'Requested':       { cls: 'bg-amber-50  text-amber-800  border-amber-200',   dot: 'bg-amber-400'  },
  'Confirmed':       { cls: 'bg-blue-50   text-blue-800   border-blue-200',    dot: 'bg-blue-400'   },
  'Worker Assigned': { cls: 'bg-indigo-50 text-indigo-800 border-indigo-200',  dot: 'bg-indigo-500' },
  'In Progress':     { cls: 'bg-orange-50 text-orange-800 border-orange-200',  dot: 'bg-orange-400' },
  'Completed':       { cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  'Cancelled':       { cls: 'bg-red-50    text-red-800    border-red-200',     dot: 'bg-red-400'    },
}

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  )
}

/* ── Action button ────────────────────────────────────────────────── */
const ActionBtn = ({ icon: Icon, label, onClick, variant = 'ghost', className = '', ...rest }) => {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all'
  const variants = {
    ghost:    'text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700',
    primary:  'text-indigo-600 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100',
    success:  'text-emerald-600 border border-emerald-200 hover:bg-emerald-50',
    danger:   'text-red-600 border border-red-100 hover:bg-red-50',
    warning:  'text-amber-600 border border-amber-200 hover:bg-amber-50',
  }
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {Icon && <Icon size={13} strokeWidth={2.5} />}
      {label}
    </button>
  )
}

/* ── Framer Motion variants ───────────────────────────────────────── */
const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 16 } },
}

/* ── Component ────────────────────────────────────────────────────── */
export default function BookingHistory() {
  const location = useLocation()
  const [bookings,      setBookings]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [cancelling,    setCancelling]    = useState(null)
  const [emptyAnimData, setEmptyAnimData] = useState(null)
  const [ratedIds,      setRatedIds]      = useState({})
  const [ratingTarget,  setRatingTarget]  = useState(null)
  const [disputeTarget, setDisputeTarget] = useState(null)

  // Load Lottie empty-state animation
  useEffect(() => {
    fetch('https://assets3.lottiefiles.com/packages/lf20_UJNc2t.json')
      .then(r => r.json())
      .then(setEmptyAnimData)
      .catch(() => {})
  }, [])

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await api.get('/bookings')
      const list = res.data || []
      setBookings(list)

      const completed = list.filter(b => b.status === 'Completed')
      const checks    = await Promise.all(
        completed.map(b =>
          api.get(`/ratings/booking/${b.id}`)
            .then(r => ({ id: b.id, rated: r.data.rated }))
            .catch(() => ({ id: b.id, rated: false }))
        )
      )
      const map = {}
      checks.forEach(({ id, rated }) => { map[id] = rated })
      setRatedIds(map)

      // Auto-open rating modal once per booking per session
      const SESSION_KEY = 'ratingModalShownIds'
      let shownIds = []
      try { shownIds = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]') } catch {}
      const firstUnrated = completed.find(b => !map[b.id] && b.providerId && !shownIds.includes(b.id))
      if (firstUnrated) {
        setRatingTarget(firstUnrated)
        shownIds.push(firstUnrated.id)
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(shownIds))
      }
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings, location.key])

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    setCancelling(id)
    try {
      await api.post(`/bookings/${id}/cancel`, { reason: 'Cancelled by customer' })
      fetchBookings()
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed')
    } finally {
      setCancelling(null)
    }
  }

  const handleConfirm = async (id) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'Confirmed' })
      fetchBookings()
    } catch (err) {
      alert(err.response?.data?.message || 'Confirmation failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <AnimatePresence>
        {ratingTarget && (
          <RatingModal
            booking={ratingTarget}
            onClose={() => setRatingTarget(null)}
            onSubmitted={() => { setRatingTarget(null); fetchBookings() }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {disputeTarget && (
          <DisputeModal
            booking={disputeTarget}
            onClose={() => setDisputeTarget(null)}
            onSubmitted={() => { setDisputeTarget(null); alert('Dispute submitted. Our team will review it shortly.') }}
          />
        )}
      </AnimatePresence>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Bookings</h1>
          <p className="text-slate-500 text-sm mt-1">Track and manage your service requests</p>
        </motion.div>

        {/* Loading skeletons */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse"
                style={{ boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}>
                <div className="flex justify-between mb-4">
                  <div className="h-5 bg-slate-100 rounded-lg w-40" />
                  <div className="h-6 bg-slate-100 rounded-lg w-24" />
                </div>
                <div className="h-3 bg-slate-100 rounded w-56 mb-5" />
                <div className="flex gap-3">
                  <div className="h-8 bg-slate-100 rounded-lg w-20" />
                  <div className="h-8 bg-slate-100 rounded-lg w-16" />
                </div>
              </div>
            ))}
          </div>

        /* Empty state */
        ) : bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-2xl p-14 text-center"
            style={{ boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}
          >
            {emptyAnimData ? (
              <div className="w-52 h-52 mx-auto mb-5">
                <Lottie animationData={emptyAnimData} loop />
              </div>
            ) : (
              <ClipboardList size={48} className="mx-auto mb-5 text-slate-300" strokeWidth={1.5} />
            )}
            <p className="text-slate-800 font-bold text-lg mb-2">No bookings yet</p>
            <p className="text-slate-500 text-sm mb-7">Book your first service to get started.</p>
            <Link
              to="/customer/catalog"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all"
            >
              Explore Services
            </Link>
          </motion.div>

        /* Booking list */
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
            {bookings.map((b, i) => (
              <motion.div
                key={b.id || b._id || i}
                id={`booking-card-${b.bookingID}`}
                variants={cardVariants}
                whileHover={{ y: -3, boxShadow: '0 12px 32px -4px rgba(99,102,241,0.10)' }}
                className="bg-white border border-slate-200 rounded-2xl transition-shadow"
                style={{ boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}
              >
                {/* ── Card header ── */}
                <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-slate-900 font-bold text-base leading-snug truncate">{b.serviceName}</h3>
                    <p className="text-slate-400 text-[11px] font-mono mt-0.5 tracking-wide">{b.bookingID}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {b.status === 'Completed' && ratedIds[b.id] && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                        <Star size={11} fill="currentColor" />
                        Rated
                      </span>
                    )}
                    <StatusBadge status={b.status} />
                  </div>
                </div>

                {/* ── Metadata row ── */}
                <div className="px-6 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
                  {/* Price — typographically prominent, no pill */}
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Amount</p>
                    <p className="text-slate-900 text-lg font-bold leading-none">
                      {formatCurrency(b.finalPrice)}
                    </p>
                    {b.savings > 0 && (
                      <p className="text-emerald-600 text-[11px] font-semibold mt-0.5">
                        − {formatCurrency(b.savings)} saved
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">ETA</p>
                    <p className="text-slate-700 text-sm font-medium flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" strokeWidth={2} />
                      {b.liveETA ?? b.estimatedArrivalTime} min
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Time Slot</p>
                    <p className="text-slate-700 text-sm font-medium">{b.timeSlot}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Area</p>
                    <p className="text-slate-700 text-sm font-medium">{b.area}</p>
                  </div>
                </div>

                {/* ── Service address ── */}
                {b.address?.addressLine && (
                  <div className="mx-6 mb-4 flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" strokeWidth={2} />
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {b.address.addressLine}
                      {b.address.locality && `, ${b.address.locality}`}
                      {b.address.city && `, ${b.address.city}`}
                      {b.address.pincode && ` ${b.address.pincode}`}
                    </p>
                  </div>
                )}

                {/* ── Surge pricing note (plain text, no pill) ── */}
                {b.demandLevel && b.demandLevel !== 'Normal' && (
                  <div className="mx-6 mb-4">
                    <p className="text-[11px] text-slate-500">
                      <span className={`font-semibold ${b.demandLevel === 'High' ? 'text-rose-600' : 'text-amber-600'}`}>
                        {b.demandLevel} demand
                      </span>
                      {' '}surge pricing applied to this booking.
                    </p>
                  </div>
                )}

                {/* ── Divider ── */}
                <div className="border-t border-slate-100 mx-6" />

                {/* ── Actions ── */}
                <div className="px-6 py-3.5 flex flex-wrap items-center gap-2">
                  {b.status === 'Requested' && (
                    <ActionBtn
                      id={`confirm-btn-${b.bookingID}`}
                      icon={CheckCircle2}
                      label="Confirm"
                      variant="success"
                      onClick={() => handleConfirm(b.id)}
                    />
                  )}

                  {['Requested', 'Confirmed'].includes(b.status) && (
                    <ActionBtn
                      id={`cancel-btn-${b.bookingID}`}
                      icon={XCircle}
                      label={cancelling === b.id ? 'Cancelling…' : 'Cancel'}
                      variant="danger"
                      onClick={() => handleCancel(b.id)}
                      disabled={cancelling === b.id}
                    />
                  )}

                  {['Worker Assigned', 'In Progress'].includes(b.status) && (
                    <Link
                      id={`track-btn-${b.bookingID}`}
                      to={`/customer/track/${b.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 transition-all"
                    >
                      <Bike size={13} strokeWidth={2.5} />
                      Track Live
                    </Link>
                  )}

                  {b.status === 'Completed' && b.paymentStatus !== 'paid' && (
                    <Link
                      id={`pay-btn-${b.bookingID}`}
                      to={`/pay/${b.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-600 border border-amber-200 hover:bg-amber-50 transition-all"
                    >
                      <CreditCard size={13} strokeWidth={2.5} />
                      Pay Now
                    </Link>
                  )}

                  {b.status === 'Completed' && !ratedIds[b.id] && b.providerId && (
                    <ActionBtn
                      id={`rate-btn-${b.bookingID}`}
                      icon={Star}
                      label="Rate"
                      variant="primary"
                      onClick={() => setRatingTarget(b)}
                    />
                  )}

                  {!['Cancelled', 'Rejected'].includes(b.status) && (
                    <Link
                      id={`chat-btn-${b.bookingID}`}
                      to={`/chat/${b.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700 transition-all"
                    >
                      <MessageCircle size={13} strokeWidth={2.5} />
                      Chat
                    </Link>
                  )}

                  {!['Cancelled', 'Rejected'].includes(b.status) && (
                    <ActionBtn
                      id={`dispute-btn-${b.bookingID}`}
                      icon={AlertTriangle}
                      label="Dispute"
                      variant="ghost"
                      onClick={() => setDisputeTarget(b)}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  )
}
