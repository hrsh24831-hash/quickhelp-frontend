import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/axiosClient'

export default function DisputeModal({ booking, onClose, onSubmitted }) {
  const [reason,  setReason]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async () => {
    if (!reason.trim()) return setError('Please describe the issue')
    if (reason.trim().length < 20) return setError('Please provide more detail (at least 20 characters)')
    setLoading(true)
    setError('')
    try {
      await api.post('/disputes', {
        bookingId: booking.id,
        reason: reason.trim()
      })
      onSubmitted()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to raise dispute')
    } finally {
      setLoading(false)
    }
  }

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
        className="bg-white border border-none w-full max-w-md p-7 relative rounded-r-md shadow-none-brand-elevated"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-600 text-xl leading-none transition-colors"
        >×</button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800">Raise a Dispute</h2>
          <p className="text-slate-500 text-sm mt-1">
            {booking.serviceName || booking.bookingID}
          </p>
        </div>

        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 font-mono">
          Describe the issue
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="E.g. Provider did not show up, work was incomplete, behaviour issue…"
          rows={5}
          maxLength={1000}
          className="w-full bg-white border border-none rounded-none px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 resize-none mb-1 transition-all"
        />
        <p className="text-xs text-slate-500 text-right mb-4 font-mono">{reason.length}/1000</p>

        {error && (
          <p className="text-red-500 text-xs text-center mb-3 font-semibold">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-none hover:bg-slate-50 rounded-none transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-slate-800 rounded-none transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit Dispute'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
