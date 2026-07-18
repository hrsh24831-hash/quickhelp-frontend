import { useEffect, useState, useRef } from 'react'
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre'
import { Wifi, WifiOff } from 'lucide-react'
import { useBookingTracking } from '../../hooks/useTracking'
import api from '../../api/axiosClient'

// Import Maplibre CSS styles
import 'maplibre-gl/dist/maplibre-gl.css'

const MAP_STYLE_DARK = 'https://tiles.openfreemap.org/styles/liberty'

const ProviderPin = () => (
  <div className="w-9 h-9 bg-primary-600 rounded-full border-4 border-white flex items-center justify-center shadow-lg text-lg animate-bounce">
    🛵
  </div>
)

const DestinationPin = () => (
  <div 
    className="w-7 h-7 bg-red-500 rounded-full border-4 border-white shadow-md transform -rotate-45"
    style={{ borderRadius: '50% 50% 50% 0' }}
  />
)

const toGeoJSONLine = (polyline) => ({
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: polyline.map(([lat, lng]) => [lng, lat]) // MapLibre takes [lng, lat]
  }
})

export default function LiveTrackingMap({ bookingId, providerId, pickup, drop, token, userId, location: propLocation, isConnected: propIsConnected }) {
  const hookData = useBookingTracking((propLocation || propIsConnected !== undefined) ? null : bookingId, providerId, token, userId)
  const location = propLocation || hookData.location
  const isConnected = propIsConnected !== undefined ? propIsConnected : hookData.isConnected

  const mapRef = useRef(null)
  const userPannedRef = useRef(false)
  const panTimeoutRef = useRef(null)
  
  const [routeData, setRouteData] = useState(null)

  // Fetch OSRM route path
  useEffect(() => {
    if (!pickup || !drop) return
    api.get(`/pricing/route`, {
      params: {
        fromLat: pickup.lat,
        fromLng: pickup.lng,
        toLat: drop.lat,
        toLng: drop.lng
      }
    })
    .then(res => {
      if (res.data?.polyline) {
        setRouteData(toGeoJSONLine(res.data.polyline))
      }
    })
    .catch(err => {
      console.warn("Failed to fetch route proxy, falls back to direct line:", err)
    })
  }, [pickup, drop])

  // Center camera on provider's location smoothly unless user has panned manually
  useEffect(() => {
    if (location && !userPannedRef.current && mapRef.current) {
      mapRef.current.easeTo({
        center: [location.lng, location.lat],
        duration: 800,
        zoom: 15
      })
    }
  }, [location])

  const handleViewportDragStart = () => {
    userPannedRef.current = true
    if (panTimeoutRef.current) clearTimeout(panTimeoutRef.current)
    panTimeoutRef.current = setTimeout(() => {
      userPannedRef.current = false
    }, 5000)
  }

  const initialCenter = location 
    ? { longitude: location.lng, latitude: location.lat }
    : { longitude: drop.lng, latitude: drop.lat }

  return (
    <div className="h-[450px] w-full relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      {/* Network banner */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 text-xs font-semibold">
        {isConnected ? (
          <>
            <Wifi size={13} className="text-emerald-400 animate-pulse" />
            <span className="text-emerald-400">Live Connection</span>
          </>
        ) : (
          <>
            <WifiOff size={13} className="text-red-400" />
            <span className="text-red-400">Reconnecting...</span>
          </>
        )}
      </div>

      <Map
        ref={mapRef}
        initialViewState={{ ...initialCenter, zoom: 14 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE_DARK}
        onDragStart={handleViewportDragStart}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* 1. Polyline path layer */}
        {routeData && (
          <Source id="route-source" type="geojson" data={routeData}>
            <Layer
              id="route-layer"
              type="line"
              paint={{
                'line-color': '#7c3aed',
                'line-width': 5,
                'line-opacity': 0.8
              }}
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
            />
          </Source>
        )}

        {/* 2. Destination Pin (Customer Location) */}
        <Marker longitude={drop.lng} latitude={drop.lat} anchor="bottom">
          <DestinationPin />
        </Marker>

        {/* 3. Live Provider Pin */}
        {location && (
          <Marker longitude={location.lng} latitude={location.lat} anchor="center">
            <ProviderPin />
          </Marker>
        )}
      </Map>
    </div>
  )
}
