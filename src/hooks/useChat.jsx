import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import api from '../api/axiosClient'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
const PAGE_SIZE = 30

/**
 * useChat — manages real-time chat for a booking
 * @param {string} bookingId  Mongo _id of the booking
 * @param {string} token      JWT for socket auth
 * @param {string} userId     Current user's id (for read-receipts)
 */
export function useChat(bookingId, token, userId) {
    const [messages, setMessages]         = useState([])   // oldest-first for display
    const [typingUsers, setTypingUsers]   = useState([])
    const [isConnected, setIsConnected]   = useState(false)
    const [hasMore, setHasMore]           = useState(false)
    const [nextCursor, setNextCursor]     = useState(null)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [error, setError]               = useState(null)

    const socketRef     = useRef(null)
    const typingTimers  = useRef({})  // userId → timer handle

    // ── Load initial message history via REST ─────────────────────────────
    const loadHistory = useCallback(async (cursor = null) => {
        if (!bookingId) return
        setLoadingHistory(true)
        try {
            const params = { limit: PAGE_SIZE }
            if (cursor) params.before = cursor
            const { data } = await api.get(`/chat/${bookingId}/messages`, { params })

            // API returns newest-first; reverse so oldest renders at top
            const incoming = [...data.messages].reverse()

            setMessages(prev => cursor ? [...incoming, ...prev] : incoming)
            setHasMore(data.hasMore)
            setNextCursor(data.nextCursor)
        } catch (err) {
            console.error('useChat: failed to load history', err)
        } finally {
            setLoadingHistory(false)
        }
    }, [bookingId])

    // ── Load older page (called when user scrolls to top) ─────────────────
    const loadMore = useCallback(() => {
        if (hasMore && nextCursor && !loadingHistory) {
            loadHistory(nextCursor)
        }
    }, [hasMore, nextCursor, loadingHistory, loadHistory])

    // ── Socket lifecycle ───────────────────────────────────────────────────
    useEffect(() => {
        if (!bookingId || !token) return

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        })

        socketRef.current = socket

        socket.on('connect', () => {
            setIsConnected(true)
            setError(null)
            socket.emit('chat:join', { bookingId })
            // Mark history as read on (re)connect
            api.patch(`/chat/${bookingId}/read`).catch(() => {})
        })

        socket.on('disconnect', () => setIsConnected(false))

        socket.on('error', (msg) => {
            console.error('Chat socket error:', msg)
            setError(msg)
        })

        socket.on('message:receive', (msg) => {
            setMessages(prev => {
                // Dedupe by _id (socket may echo back our own optimistic msg)
                if (prev.some(m => m._id === msg._id)) return prev
                return [...prev, msg]
            })
            // Mark as read automatically when we receive a message
            api.patch(`/chat/${bookingId}/read`).catch(() => {})
        })

        socket.on('typing:indicator', ({ userId: uid, userName, isTyping }) => {
            if (uid === userId) return  // ignore own typing

            // Clear any existing auto-stop timer
            if (typingTimers.current[uid]) {
                clearTimeout(typingTimers.current[uid])
                delete typingTimers.current[uid]
            }

            setTypingUsers(prev => {
                const filtered = prev.filter(u => u.userId !== uid)
                return isTyping ? [...filtered, { userId: uid, userName }] : filtered
            })

            if (isTyping) {
                // Auto-clear if no stop event arrives after 4 seconds
                typingTimers.current[uid] = setTimeout(() => {
                    setTypingUsers(prev => prev.filter(u => u.userId !== uid))
                }, 4000)
            }
        })

        // Load initial history
        loadHistory()

        return () => {
            socket.disconnect()
            Object.values(typingTimers.current).forEach(clearTimeout)
        }
    }, [bookingId, token])  // eslint-disable-line react-hooks/exhaustive-deps

    // ── Send a message ─────────────────────────────────────────────────────
    const sendMessage = useCallback((text) => {
        if (!text || !text.trim()) return
        if (!socketRef.current?.connected) {
            setError('Not connected — please wait for reconnection')
            return
        }
        socketRef.current.emit('message:send', { bookingId, text: text.trim() })
    }, [bookingId])

    // ── Typing indicators ─────────────────────────────────────────────────
    const sendTypingStart = useCallback(() => {
        socketRef.current?.emit('typing:start', { bookingId })
    }, [bookingId])

    const sendTypingStop = useCallback(() => {
        socketRef.current?.emit('typing:stop', { bookingId })
    }, [bookingId])

    return {
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
    }
}
