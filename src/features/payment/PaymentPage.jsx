import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CreditCard, AlertTriangle, PartyPopper } from 'lucide-react'
import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'
import { useAuthStore } from '../../store/authStore'
import { formatCurrency } from '../../utils/format'

export default function PaymentPage() {
    const { bookingId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const [booking, setBooking] = useState(null)
    const [loading, setLoading] = useState(true)
    const [paying, setPaying] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    // Fetch booking details
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true)
            try {
                const { data } = await api.get(`/bookings/${bookingId}`)
                setBooking(data)
                if (data.paymentStatus === 'paid') {
                    setSuccess(true)
                }
            } catch (err) {
                console.error(err)
                setError(err.response?.data?.message || 'Failed to load booking details')
            } finally {
                setLoading(false)
            }
        }
        if (bookingId) fetchDetails()
    }, [bookingId])

    const handlePayment = async () => {
        if (!booking || paying) return
        setPaying(true)
        setError(null)

        try {
            // 1. Create order on backend
            const { data: orderData } = await api.post('/payments/order', { bookingId })

            // 2. Open Razorpay checkout checkout overlay
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'QuickHelp Marketplace',
                description: `Payment for ${booking.serviceName || booking.serviceId?.serviceName || 'Service'}`,
                order_id: orderData.orderId,
                handler: async function (response) {
                    setPaying(true)
                    try {
                        // Immediately verify signature server-side — standard Razorpay sandbox flow
                        await api.post('/payments/verify', {
                            razorpay_order_id:  response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                        setSuccess(true)
                    } catch (err) {
                        setError(err.response?.data?.message || 'Payment verification failed. Please contact support.')
                    } finally {
                        setPaying(false)
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || ''
                },
                theme: {
                    color: '#7c3aed' // Violet primary
                },
                modal: {
                    ondismiss: function () {
                        setPaying(false)
                    }
                }
            }

            const rzp = new window.Razorpay(options)
            rzp.on('payment.failed', function (response) {
                setError(response.error.description || 'Payment transaction failed')
                setPaying(false)
            })
            rzp.open()

        } catch (err) {
            console.error(err)
            setError(err.response?.data?.message || 'Failed to initialize payment process')
            setPaying(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="max-w-md mx-auto mt-20 p-10 glass-card animate-pulse text-center">
                    <div className="h-6 bg-white/10 rounded w-48 mx-auto mb-4" />
                    <div className="h-4 bg-white/10 rounded w-64 mx-auto mb-2" />
                    <div className="h-4 bg-white/10 rounded w-32 mx-auto" />
                </div>
            </div>
        )
    }

    if (error && !booking) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="max-w-md mx-auto mt-20 p-8 glass-card text-center text-slate-300">
                    <AlertTriangle size={36} className="mx-auto mb-3 text-amber-500" strokeWidth={1.5} />
                    <p className="font-semibold text-lg text-white mb-2">Error</p>
                    <p className="text-sm mb-4">{error}</p>
                    <button onClick={() => navigate('/customer/bookings')} className="btn-secondary py-2 text-sm w-full">
                        Back to Bookings
                    </button>
                </div>
            </div>
        )
    }

    const price = booking?.finalPrice || 0
    const tax = Math.round(price * 0.18) // 18% tax
    const total = price + tax

    return (
        <div className="min-h-screen">
            <Navbar />

            <main className="max-w-md mx-auto px-4 py-12">
                <div className="glass-card p-6 animate-fade-in">
                    {success ? (
                        <div className="text-center py-6">
                            <PartyPopper size={48} className="mx-auto mb-4 text-emerald-500" strokeWidth={1.5} />
                            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
                            <p className="text-slate-400 text-sm mb-6">
                                Booking {booking?.bookingID} has been successfully paid.
                            </p>
                            <button
                                onClick={() => navigate('/customer/bookings')}
                                className="btn-primary py-3 w-full"
                            >
                                View Booking History
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Invoice Summary</h2>
                            <p className="text-slate-400 text-xs font-mono mb-6">{booking?.bookingID}</p>

                            <div className="space-y-4 mb-6 border-b border-white/10 pb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Service Fee ({booking?.serviceName || booking?.serviceId?.serviceName})</span>
                                    <span className="text-white font-medium">{formatCurrency(price)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">GST (18%)</span>
                                    <span className="text-white font-medium">{formatCurrency(tax)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <span className="text-white font-semibold">Total Amount</span>
                                <span className="text-2xl font-extrabold text-primary-300">{formatCurrency(total)}</span>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-xs text-red-300 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <button
                                id="rzp-pay-now-btn"
                                onClick={handlePayment}
                                disabled={paying}
                                className="btn-primary py-3.5 flex items-center justify-center gap-2"
                            >
                                {paying ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>Processing…</span>
                                    </>
                                ) : (
                                    <>
                                        <><CreditCard size={16} strokeWidth={2} /><span>Pay Now via Razorpay</span></>
                                    </>
                                )}
                            </button>

                            <p className="text-center text-slate-500 text-[10px] mt-4">
                                Sandbox Mode Active. Secure transaction powered by Razorpay.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
