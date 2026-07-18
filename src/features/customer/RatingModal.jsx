import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/axiosClient'

const STAR_LABELS = { 1: 'Terrible', 2: 'Poor', 3: 'Okay', 4: 'Good', 5: 'Excellent' }

export default function RatingModal({ booking, onClose, onSubmitted }) {
  const [score,   setScore]   = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async () => {
    if (score < 1) return setError('Please select a rating')
    setLoading(true)
    setError('')
    try {
      await api.post('/ratings', {
        bookingId: booking.id,
        score,
        comment: comment.trim()
      })
      onSubmitted()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating')
    } finally {
      setLoading(false)
    }
  }

  const display = hovered || score

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white border border-slate-200 w-full max-w-md p-7 relative rounded-r-md shadow-brand-elevated"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl leading-none transition-colors"
        >×</button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⭐</div>
          <h2 className="text-xl font-bold text-slate-900">Rate Your Service</h2>
          <p className="text-slate-500 text-sm mt-1">
            {booking.serviceName} · {booking.bookingID}
          </p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setScore(n)}
              className={`text-4xl transition-transform duration-100 ${
                n <= display ? 'text-yellow-400 scale-110' : 'text-slate-200 hover:scale-105 hover:text-slate-300'
              }`}
            >★</button>
          ))}
        </div>
        <p className="text-center text-sm font-semibold mb-5 h-5 text-yellow-600">
          {display ? STAR_LABELS[display] : ''}
        </p>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your experience (optional)…"
          rows={3}
          maxLength={500}
          className="w-full bg-white border border-slate-200 rounded-r-sm px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 resize-none mb-4 transition-all"
        />

        {error && (
          <p className="text-red-500 text-xs text-center mb-3 font-semibold">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-r-sm transition-all"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || score < 1}
            className="flex-1 py-2.5 text-sm font-semibold bg-brand-primary hover:bg-brand-primaryHover text-white rounded-r-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
