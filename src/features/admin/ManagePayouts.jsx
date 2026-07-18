import { useState, useEffect, useCallback } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'
import { formatCurrency } from '../../utils/format'

export default function ManagePayouts() {
    const [payouts, setPayouts] = useState([])
    const [loading, setLoading] = useState(true)
    const [settlingId, setSettlingId] = useState(null)
    const [txRef, setTxRef] = useState('')
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)

    const fetchPayouts = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { data } = await api.get('/payouts')
            setPayouts(data.data || [])
        } catch (err) {
            console.error(err)
            setError('Failed to fetch payout requests queue')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPayouts()
    }, [fetchPayouts])

    const handleSettle = async (id) => {
        if (!txRef.trim()) {
            alert('Please enter a transaction reference number')
            return
        }
        setError(null)
        setMessage(null)
        try {
            await api.patch(`/payouts/${id}/settle`, { transactionRef: txRef })
            setMessage('Payout successfully marked as settled')
            setSettlingId(null)
            setTxRef('')
            fetchPayouts()
        } catch (err) {
            console.error(err)
            setError(err.response?.data?.message || 'Settlement update failed')
        }
    }

    return (
        <div className="min-h-screen">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Manage Payouts</h1>
                    <p className="text-slate-400 text-sm">Review provider payout requests and record manual settlements</p>
                </div>

                {message && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm">
                        🎉 {message}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                        ⚠️ {error}
                    </div>
                )}

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="glass-card p-6 animate-pulse h-24" />
                        ))}
                    </div>
                ) : payouts.length === 0 ? (
                    <div className="glass-card p-10 text-center text-slate-400">
                        <div className="text-4xl mb-3">💸</div>
                        <p>No payout requests logged in system.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {payouts.map(p => (
                            <div key={p._id} className="glass-card p-5 animate-fade-in hover:border-white/20 transition-all">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <span className="text-white font-bold text-lg">{formatCurrency(p.amount)}</span>
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                p.status === 'settled'
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                            }`}>
                                                {p.status === 'settled' ? 'Settled' : 'Pending Verification'}
                                            </span>
                                        </div>
                                        <p className="text-slate-300 text-sm font-medium">
                                            Provider: {p.providerId?.name || 'Unknown'} ({p.providerId?.email})
                                        </p>
                                        <p className="text-slate-500 text-xs mt-1">
                                            Requested At: {new Date(p.requestedAt).toLocaleString()} · {p.bookingIds?.length} booking(s) covered
                                        </p>
                                        {p.status === 'settled' && (
                                            <div className="mt-2.5 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-xs text-emerald-300 font-mono">
                                                TxRef: {p.transactionRef} · Settled: {new Date(p.settledAt).toLocaleString()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-shrink-0">
                                        {p.status === 'pending' && (
                                            <>
                                                {settlingId === p._id ? (
                                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                                        <input
                                                            type="text"
                                                            placeholder="Transaction Ref (e.g. TXN12345)"
                                                            value={txRef}
                                                            onChange={(e) => setTxRef(e.target.value)}
                                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary-500"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleSettle(p._id)}
                                                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-1.5 px-3 rounded-lg transition-all"
                                                            >
                                                                Settle
                                                            </button>
                                                            <button
                                                                onClick={() => { setSettlingId(null); setTxRef('') }}
                                                                className="text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setSettlingId(p._id)}
                                                        className="inline-flex items-center text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 px-4 py-2 rounded-xl transition-all"
                                                    >
                                                        Mark Settled
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
