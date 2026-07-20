import { useState, useEffect, useCallback } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'
import { formatCurrency } from '../../utils/format'

export default function EarningsPage() {
    const [bookings, setBookings] = useState([])
    const [payouts, setPayouts] = useState([])
    const [loading, setLoading] = useState(true)
    const [requesting, setRequesting] = useState(false)
    const [message, setMessage] = useState(null)
    const [error, setError] = useState(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            // Fetch provider bookings
            const bRes = await api.get('/bookings/provider')
            const providerBookings = bRes.data.data || []
            setBookings(providerBookings)

            // Try to fetch payouts list (Wait, does the provider route support list payout? 
            // Payout.find({ providerId }) is not in the routes, but we can call GET /payouts. 
            // Wait, GET /payouts is admin only in the spec: "GET /api/payouts (isAdmin)".
            // So providers can't fetch all payouts via GET /api/payouts. Providers just request payouts.
            // Let's deduce payouts received based on completed bookings or check if there is an endpoint.
            // To make it fully functional and reliable, let's keep all tracking in the UI.
            // Wait, we can list pending/settled bookings based on booking status. Let's display the bookings status
            // in the bookings list, and show statistics.)
            
            // To let provider know their payout history, we can either mock payout logs or just fetch completed+paid status.
            // We can also fetch the provider's active bookings.
        } catch (err) {
            console.error(err)
            setError('Failed to load earnings data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Calculate metrics
    const completedPaid = bookings.filter(b => b.status === 'Completed' && b.paymentStatus === 'paid')
    const completedUnpaid = bookings.filter(b => b.status === 'Completed' && b.paymentStatus !== 'paid')
    const activeJobs = bookings.filter(b => ['Worker Assigned', 'In Progress'].includes(b.status))

    const totalEarned = completedPaid.reduce((sum, b) => sum + (b.finalPrice || 0), 0)

    const handlePayoutRequest = async () => {
        setRequesting(true)
        setError(null)
        setMessage(null)
        try {
            const { data } = await api.post('/payouts/request')
            setMessage(data.message || 'Payout requested successfully!')
            fetchData()
        } catch (err) {
            console.error(err)
            setError(err.response?.data?.message || 'Failed to request payout')
        } finally {
            setRequesting(false)
        }
    }

    return (
        <div className="min-h-screen">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-1">Provider Earnings</h1>
                        <p className="text-slate-500 text-sm">Monitor your income and claim payouts</p>
                    </div>
                    {completedPaid.length > 0 && (
                        <button
                            id="request-payout-btn"
                            onClick={handlePayoutRequest}
                            disabled={requesting}
                            className="inline-flex items-center text-sm font-semibold text-slate-800 bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-none transition-all disabled:opacity-50"
                        >
                            {requesting ? 'Requesting…' : 'Request Payout'}
                        </button>
                    )}
                </div>

                {message && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-none text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-none text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="card p-6 animate-pulse h-28" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Statistics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="card p-6">
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Earned (Paid)</p>
                                <p className="text-3xl font-extrabold text-slate-800">{formatCurrency(totalEarned)}</p>
                                <p className="text-[10px] text-slate-500 mt-1">From completed and paid services</p>
                            </div>
                            <div className="card p-6">
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Completed (Unpaid)</p>
                                <p className="text-3xl font-extrabold text-amber-400">{formatCurrency(completedUnpaid.reduce((sum, b) => sum + (b.finalPrice || 0), 0))}</p>
                                <p className="text-[10px] text-slate-500 mt-1">Awaiting customer invoice payment</p>
                            </div>
                            <div className="card p-6">
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Active Job Pipelines</p>
                                <p className="text-3xl font-extrabold text-purple-300">{activeJobs.length}</p>
                                <p className="text-[10px] text-slate-500 mt-1">Jobs currently in progress</p>
                            </div>
                        </div>

                        {/* Booking List */}
                        <div className="card p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Completed Bookings Log</h2>
                            {completedPaid.length === 0 && completedUnpaid.length === 0 ? (
                                <p className="text-slate-500 text-sm py-4 text-center">No completed bookings recorded yet.</p>
                            ) : (
                                <div className="divide-y divide-white/10">
                                    {[...completedPaid, ...completedUnpaid].map((b, i) => (
                                        <div key={b._id || i} className="py-4 flex justify-between items-center text-sm first:pt-0 last:pb-0">
                                            <div>
                                                <p className="text-slate-800 font-semibold">{b.serviceId?.serviceName}</p>
                                                <p className="text-slate-500 text-xs mt-0.5 font-mono">{b.bookingID} · {b.area}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-slate-800 font-bold">{formatCurrency(b.finalPrice)}</p>
                                                <span className={`inline-block px-2.5 py-0.5 rounded-none text-[10px] font-semibold border ${
                                                    b.paymentStatus === 'paid'
                                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                                }`}>
                                                    {b.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}
