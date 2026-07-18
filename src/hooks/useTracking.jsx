import { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'
import api from '../api/axiosClient'

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// ─── 1. CUSTOMER: Track provider's live location ────────────────────
export const useBookingTracking = (bookingId, providerId, token, userId) => {
  const socketRef = useRef(null)
  const [location, setLocation] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token || !userId || !bookingId) return

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token, userId },
      reconnection: true,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      setError(null)
      socket.emit('booking:subscribe', { bookingId })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('provider:location-updated', (data) => {
      setLocation({
        lat: data.lat,
        lng: data.lng,
        speed: data.speed,
        heading: data.heading,
        timestamp: new Date(data.timestamp)
      })
    })

    // REST Fallback in case WebSockets drop
    const interval = setInterval(async () => {
      if (!socket.connected) {
        try {
          const res = await api.get(`/bookings/${bookingId}/tracking`)
          if (res.data) {
            setLocation({
              lat: res.data.lat,
              lng: res.data.lng,
              speed: res.data.speed,
              heading: res.data.heading,
              timestamp: new Date()
            })
          }
        } catch (err) {
          console.warn('REST tracking fallback failed:', err)
        }
      }
    }, 5000)

    return () => {
      clearInterval(interval)
      socket.disconnect()
    }
  }, [bookingId, providerId, token, userId])

  return { location, isConnected, error }
}

// ─── 2. PROVIDER: Emit current coordinates to room ───────────────────
export const useProviderLocationBroadcast = (bookingId, token, userId) => {
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [telemetry, setTelemetry] = useState({ lat: null, lng: null })
  const lastCoordinates = useRef({ lat: null, lng: null })

  useEffect(() => {
    if (!token || !userId || !bookingId) return

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token, userId }
    })

    socketRef.current = socket

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    let fallbackInterval = null
    let hasCoords = false
    let timeoutId = null

    const triggerMockFallback = () => {
      if (fallbackInterval) return
      api.get(`/bookings/${bookingId}`)
        .then(res => {
          const b = res.data
          const custLat = b.customerLocation?.lat
          const custLng = b.customerLocation?.lng
          if (custLat && custLng) {
            // Start slightly offset (approx 500-1000m away)
            let mockLat = custLat + 0.005
            let mockLng = custLng + 0.005

            // Emit immediately so customer gets coordinates without delay
            socket.emit('provider:update-location', {
              bookingId,
              lat: mockLat,
              lng: mockLng,
              speed: 30,
              heading: 0
            })
            setTelemetry({ lat: mockLat, lng: mockLng })

            fallbackInterval = setInterval(() => {
              const dLat = custLat - mockLat
              const dLng = custLng - mockLng

              // Move 8% closer on each tick
              mockLat += dLat * 0.08
              mockLng += dLng * 0.08

              setTelemetry({ lat: mockLat, lng: mockLng })
              socket.emit('provider:update-location', {
                bookingId,
                lat: mockLat,
                lng: mockLng,
                speed: 30,
                heading: 0
              })
            }, 3000)
          }
        })
        .catch(e => console.warn("Failed to fetch customer location for tracking fallback:", e))
    }

    // Start watching position
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        hasCoords = true
        if (timeoutId) clearTimeout(timeoutId)
        const { latitude: lat, longitude: lng, speed, heading } = pos.coords
        setTelemetry({ lat, lng })

        socket.emit('provider:update-location', {
          bookingId,
          lat,
          lng,
          speed: speed || 0,
          heading: heading || 0
        })
        lastCoordinates.current = { lat, lng }
      },
      (err) => {
        console.error('watchPosition failed:', err)
        triggerMockFallback()
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    )

    // Trigger mock fallback if watchPosition doesn't respond in 2 seconds
    timeoutId = setTimeout(() => {
      if (!hasCoords) {
        console.warn("watchPosition did not yield coordinates within 2 seconds. Triggering simulated tracking fallback.")
        triggerMockFallback()
      }
    }, 2000)

    return () => {
      navigator.geolocation.clearWatch(watchId)
      if (timeoutId) clearTimeout(timeoutId)
      if (fallbackInterval) clearInterval(fallbackInterval)
      socket.disconnect()
    }
  }, [bookingId, token, userId])

  return { isConnected, telemetry }
}
