import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuthStore } from '../../store/authStore'
import { useChat } from '../../hooks/useChat'
import api from '../../api/axiosClient'

// ─── Utility: format message timestamp ────────────────────────────────────────
function formatTime(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDateLabel(dateStr) {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

// ─── Bubble component ─────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }) {
    const isRead = msg.readBy && msg.readBy.length > 0

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
            <div
                className={`max-w-xs lg:max-w-md px-4 py-2.5 text-sm leading-relaxed ${
                    isOwn
                        ? 'bg-slate-900 text-white rounded-2xl rounded-br-xs shadow-sm'
                        : 'bg-slate-100 border border-slate-200/90 text-slate-800 rounded-2xl rounded-bl-xs shadow-sm'
                }`}
            >
                {!isOwn && (
                    <p className="text-xs text-amber-700 font-bold mb-0.5">{msg.senderName}</p>
                )}
                <p style={{ wordBreak: 'break-word' }}>{msg.text}</p>
                <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] ${isOwn ? 'text-slate-300 opacity-80' : 'text-slate-400'}`}>
                        {formatTime(msg.createdAt)}
                    </span>
                    {isOwn && (
                        <span className="text-[11px] font-bold">
                            {isRead ? (
                                <span className="text-amber-400">✓✓</span>
                            ) : (
                                <span className="text-slate-400">✓</span>
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Date separator ───────────────────────────────────────────────────────────
function DateSeparator({ label }) {
    return (
        <div className="flex items-center gap-3 my-4 px-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-500 font-medium px-3 py-0.5 bg-slate-100 rounded-full border border-slate-200/80">{label}</span>
            <div className="flex-1 h-px bg-slate-200" />
        </div>
    )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ typingUsers }) {
    if (!typingUsers.length) return null
    const names = typingUsers.map(u => u.userName).join(', ')
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 my-1 bg-slate-100 border border-slate-200/60 rounded-full w-fit">
            <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-slate-600 italic font-medium">{names} {typingUsers.length === 1 ? 'is' : 'are'} typing…</span>
        </div>
    )
}

// ─── Connection badge ─────────────────────────────────────────────────────────
function ConnectionBadge({ isConnected }) {
    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-semibold border ${
            isConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isConnected ? 'Live' : 'Reconnecting…'}
        </div>
    )
}

// ─── Main ChatPage ─────────────────────────────────────────────────────────────
export default function ChatPage() {
    const { bookingId } = useParams()
    const navigate = useNavigate()
    const { token, user } = useAuthStore()

    const [booking, setBooking] = useState(null)
    const [bookingLoading, setBookingLoading] = useState(true)
    const [inputText, setInputText]   = useState('')
    const [sending, setSending]       = useState(false)

    const messagesEndRef  = useRef(null)
    const messagesTopRef  = useRef(null)
    const inputRef        = useRef(null)
    const typingStopTimer = useRef(null)
    const isTypingRef     = useRef(false)

    const {
        messages,
        typingUsers,
        isConnected,
        hasMore,
        loadingHistory,
        error,
        sendMessage,
        sendTypingStart,
        sendTypingStop,
        loadMore,
    } = useChat(bookingId, token, user?.id)

    // Load booking metadata for header display
    useEffect(() => {
        const load = async () => {
            setBookingLoading(true)
            try {
                const { data } = await api.get(`/bookings/${bookingId}`)
                setBooking(data)
            } catch {
                // Fallback — show just the ID
            } finally {
                setBookingLoading(false)
            }
        }
        if (bookingId) load()
    }, [bookingId])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Infinite scroll — detect when user scrolls to top
    const handleScroll = useCallback((e) => {
        if (e.target.scrollTop < 40 && hasMore && !loadingHistory) {
            loadMore()
        }
    }, [hasMore, loadingHistory, loadMore])

    // Group messages by date
    const groupedMessages = messages.reduce((acc, msg) => {
        const label = formatDateLabel(msg.createdAt)
        const last = acc[acc.length - 1]
        if (!last || last.label !== label) {
            acc.push({ label, msgs: [msg] })
        } else {
            last.msgs.push(msg)
        }
        return acc
    }, [])

    // Handle send
    const handleSend = () => {
        const text = inputText.trim()
        if (!text || sending) return
        setSending(true)
        sendMessage(text)
        setInputText('')
        // Stop typing indicator
        if (isTypingRef.current) {
            sendTypingStop()
            isTypingRef.current = false
        }
        clearTimeout(typingStopTimer.current)
        setTimeout(() => setSending(false), 300)
        inputRef.current?.focus()
    }

    // Handle input change — fire typing indicators
    const handleInputChange = (e) => {
        setInputText(e.target.value)

        if (!isTypingRef.current) {
            isTypingRef.current = true
            sendTypingStart()
        }

        // Reset auto-stop timer (2 seconds of idle)
        clearTimeout(typingStopTimer.current)
        typingStopTimer.current = setTimeout(() => {
            sendTypingStop()
            isTypingRef.current = false
        }, 2000)
    }

    // Enter to send (Shift+Enter for newline)
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const partnerName = booking
        ? (user?.role === 'customer' ? 'Provider' : 'Customer')
        : '…'

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            {/* Chat Container */}
            <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>

                {/* Header */}
                <div className="card px-5 py-3.5 mb-3 flex items-center justify-between animate-fade-in flex-shrink-0 bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-slate-500 hover:text-slate-900 transition-colors text-xl leading-none"
                            aria-label="Go back"
                        >
                            ←
                        </button>
                        <div>
                            <p className="text-slate-900 font-bold text-sm">
                                💬 {bookingLoading ? '…' : (booking?.serviceName || booking?.serviceId?.serviceName || 'Booking Chat')}
                            </p>
                            <p className="text-slate-500 text-xs mt-0.5 font-medium">
                                Chat with {partnerName}
                                {booking?.bookingID ? ` · ${booking.bookingID}` : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ConnectionBadge isConnected={isConnected} />
                        {booking && ['Worker Assigned', 'In Progress'].includes(booking.status) && user?.role === 'customer' && (
                            <Link
                                to={`/customer/track/${bookingId}`}
                                className="inline-flex items-center text-xs font-semibold text-amber-800 hover:text-slate-900 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-none transition-all"
                            >
                                🛵 Track
                            </Link>
                        )}
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-none text-xs font-medium text-red-700 text-center flex-shrink-0 animate-fade-in">
                        ⚠️ {error}
                    </div>
                )}

                {/* Messages area */}
                <div
                    className="flex-1 overflow-y-auto px-4 py-3 bg-white border border-slate-200 shadow-sm scroll-smooth"
                    onScroll={handleScroll}
                    style={{ minHeight: 0 }}
                    id="chat-messages-container"
                >
                    {/* Load more spinner */}
                    {loadingHistory && (
                        <div className="text-center py-4">
                            <div className="inline-block w-5 h-5 border-2 border-slate-200 border-t-amber-600 rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Empty state */}
                    {!loadingHistory && messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                            <div className="text-5xl">💬</div>
                            <p className="text-slate-700 font-medium text-sm">No messages yet.</p>
                            <p className="text-slate-400 text-xs">Say hello to get started!</p>
                        </div>
                    )}

                    {/* Message groups */}
                    {groupedMessages.map((group, gi) => (
                        <div key={gi}>
                            <DateSeparator label={group.label} />
                            {group.msgs.map((msg) => (
                                <MessageBubble
                                    key={msg._id}
                                    msg={msg}
                                    isOwn={msg.senderId === user?.id || msg.senderId?.toString() === user?.id}
                                />
                            ))}
                        </div>
                    ))}

                    {/* Typing indicator */}
                    <TypingIndicator typingUsers={typingUsers} />

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <div className="flex-shrink-0 mt-3">
                    <div className="card px-3 py-2.5 flex gap-3 items-end bg-white border border-slate-200 shadow-sm">
                        <textarea
                            ref={inputRef}
                            id="chat-input"
                            rows={1}
                            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                            value={inputText}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={!isConnected}
                            className="flex-1 resize-none bg-transparent text-slate-900 placeholder-slate-400 text-sm outline-none py-1.5 min-h-[38px] max-h-[120px] overflow-y-auto disabled:opacity-40"
                            style={{ lineHeight: '1.5' }}
                        />
                        <button
                            id="chat-send-btn"
                            onClick={handleSend}
                            disabled={!inputText.trim() || !isConnected || sending}
                            className="flex-shrink-0 w-9 h-9 rounded-none bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
                            aria-label="Send message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.903 6.557H13.5a.75.75 0 010 1.5H4.182l-1.903 6.557a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}

