import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axiosClient'

async function reverseGeocodeStructured(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'QuickHelp-App/1.0' } }
    )
    const data = await res.json()
    const a = data.address || {}
    return {
      addressLine: [a.road, a.house_number].filter(Boolean).join(' ') || a.amenity || a.building || a.neighbourhood || '',
      locality:    a.neighbourhood || a.suburb || a.village || a.town || a.city_district || '',
      city:        a.city || a.county || a.state_district || a.state || '',
      pincode:     a.postcode || '',
    }
  } catch {
    return { addressLine: '', locality: '', city: '', pincode: '' }
  }
}

const AREAS = ['Delhi','Gurgaon','Noida','Faridabad','Mumbai','Pune','Ahmedabad','Surat','Bangalore','Chennai','Hyderabad','Kochi','Kolkata']
const TIME_SLOTS = ['09:00 AM','11:00 AM','01:00 PM','03:00 PM','05:00 PM','07:00 PM','09:00 PM','11:00 PM']

const LABEL_ICONS = { Home: '\u{1F3E0}', Work: '\u{1F4BC}', Other: '\u{1F4CD}' }
const LABELS = ['Home', 'Work', 'Other']
const EMPTY_FORM = { label: 'Home', addressLine: '', locality: '', city: '', pincode: '', lat: null, lng: null }

export default function BookingPreview() {
  const navigate = useNavigate()

  const [services,       setServices]       = useState([])
  const [serviceId,      setServiceId]      = useState('')
  const [timeSlot,       setTimeSlot]       = useState('11:00 AM')

  const [addresses,      setAddresses]      = useState([])
  const [selectedAddrId, setSelectedAddrId] = useState(null)

  const [showForm,       setShowForm]       = useState(false)
  const [form,           setForm]           = useState(EMPTY_FORM)
  const [formSaving,     setFormSaving]     = useState(false)
  const [formError,      setFormError]      = useState('')

  const [geoLoading,     setGeoLoading]     = useState(false)
  const [geoMsg,         setGeoMsg]         = useState('')

  const [preview,        setPreview]        = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error,          setError]          = useState('')

  useEffect(() => {
    api.get('/services').then(r => {
      const list = r.data || []
      setServices(list)
      if (list.length > 0) setServiceId(list[0]._id)
    }).catch(console.error)
  }, [])

  const loadAddresses = useCallback(async () => {
    try {
      const r = await api.get('/auth/addresses')
      const list = r.data.addresses || []
      setAddresses(list)
      const def = list.find(a => a.isDefault) || list[0]
      if (def) setSelectedAddrId(def._id)
    } catch {
      // no addresses or not logged in
    }
  }, [])

  useEffect(() => { loadAddresses() }, [loadAddresses])

  const activeAddress = addresses.find(a => a._id === selectedAddrId)
  const derivedArea = activeAddress ? (activeAddress.city || activeAddress.locality || 'Delhi') : 'Delhi'

  const handleCalculatePreview = useCallback(async () => {
    if (!serviceId) return
    setLoading(true)
    setError('')
    try {
      const r = await api.get('/pricing/preview', { params: { serviceId, area: derivedArea, timeSlot } })
      setPreview(r.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Preview failed')
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }, [serviceId, derivedArea, timeSlot])

  useEffect(() => {
    if (serviceId) handleCalculatePreview()
  }, [serviceId, derivedArea, timeSlot, handleCalculatePreview])

  const handleDetectLocation = () => {
    setGeoMsg('')
    if (!navigator.geolocation) {
      setGeoMsg('warn:Geolocation not supported — fill manually.')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const s = await reverseGeocodeStructured(latitude, longitude)
        setForm(f => ({
          ...f,
          addressLine: s.addressLine || f.addressLine,
          locality:    s.locality    || f.locality,
          city:        s.city        || f.city,
          pincode:     s.pincode     || f.pincode,
          lat: latitude, lng: longitude,
        }))
        setGeoLoading(false)
        setGeoMsg('ok:Location detected — review and save below.')
      },
      (err) => {
        setGeoLoading(false)
        setGeoMsg(err.code === err.PERMISSION_DENIED
          ? 'warn:Location access denied — fill manually.'
          : 'warn:Could not detect location — fill manually.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  const handleSaveAddress = async () => {
    setFormError('')
    if (!form.addressLine.trim()) { setFormError('Address / House is required.'); return }
    setFormSaving(true)
    try {
      let updatedForm = { ...form }
      if (updatedForm.lat === null || updatedForm.lng === null) {
        const query = `${form.addressLine}, ${form.locality}, ${form.city}, ${form.pincode}`
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
            headers: { 'User-Agent': 'QuickHelp-App/1.0' }
          })
          const geoData = await geoRes.json()
          if (geoData && geoData.length > 0) {
            updatedForm.lat = parseFloat(geoData[0].lat)
            updatedForm.lng = parseFloat(geoData[0].lon)
          } else {
            updatedForm.lat = 28.6139
            updatedForm.lng = 77.2090
          }
        } catch (geoErr) {
          console.warn("Geocoding failed, using default coordinates:", geoErr)
          updatedForm.lat = 28.6139
          updatedForm.lng = 77.2090
        }
      }
      const r = await api.post('/auth/addresses', updatedForm)
      const saved = r.data.addresses || []
      setAddresses(saved)
      const newAddr = r.data.address
      if (newAddr) setSelectedAddrId(newAddr._id)
      setShowForm(false)
      setForm(EMPTY_FORM)
      setGeoMsg('')
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save address.')
    } finally {
      setFormSaving(false)
    }
  }

  const handleDeleteAddress = async (addrId) => {
    try {
      const r = await api.delete(`/auth/addresses/${addrId}`)
      const updated = r.data.addresses || []
      setAddresses(updated)
      if (selectedAddrId === addrId) {
        const next = updated.find(a => a.isDefault) || updated[0]
        setSelectedAddrId(next?._id || null)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleBook = async () => {
    const selectedAddr = addresses.find(a => a._id === selectedAddrId)
    if (!selectedAddr) { setError('Please select or add a delivery address.'); return }
    setBookingLoading(true)
    setError('')
    try {
      await api.post('/bookings', {
        serviceId,
        area: derivedArea,
        timeSlot,
        customerLocation: { lat: selectedAddr.lat ?? 28.6139, lng: selectedAddr.lng ?? 77.2090 },
        address: {
          addressLine: selectedAddr.addressLine,
          locality: selectedAddr.locality,
          city: selectedAddr.city,
          pincode: selectedAddr.pincode,
          label: selectedAddr.label
        }
      })
      navigate('/customer/bookings')
    } catch (err) {
      setError(err.response?.data?.message || 'Booking creation failed')
    } finally {
      setBookingLoading(false)
    }
  }

  const selectedService = services.find(s => s._id === serviceId)

  // geo message helpers
  const geoIsOk   = geoMsg.startsWith('ok:')
  const geoIsWarn = geoMsg.startsWith('warn:')
  const geoText   = geoMsg.replace(/^(ok|warn):/, '')

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Book a Service</h1>
          <p className="text-slate-500 text-sm">Configure your booking and choose a delivery address</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* LEFT */}
          <div className="space-y-6">

            {/* Service config */}
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-800">Service Configuration</h2>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-2.5 rounded-none">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 font-mono uppercase tracking-wide">Service</label>
                <select id="select-service-input" className="w-full bg-white/5 border border-none rounded-none px-4 py-2.5 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors text-sm" value={serviceId} onChange={e => setServiceId(e.target.value)}>
                  {services.map(s => <option key={s._id} value={s._id} className="bg-white text-slate-800">{s.serviceName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 font-mono uppercase tracking-wide">Time Slot</label>
                  <select id="select-time-input" className="w-full bg-white/5 border border-none rounded-none px-4 py-2.5 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors text-sm" value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
                    {TIME_SLOTS.map(t => <option key={t} value={t} className="bg-white text-slate-800">{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Delivery address */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Delivery Address</h2>
                {!showForm && (
                  <button type="button" onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setGeoMsg('') }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-slate-800 border border-none hover:border-primary-500/60 bg-transparent hover:bg-amber-100 px-3 py-1.5 rounded-none transition-all">
                    + Add Address
                  </button>
                )}
              </div>

              {addresses.length > 0 && !showForm && (
                <div className="space-y-2.5">
                  {addresses.map(addr => {
                    const isSelected = addr._id === selectedAddrId
                    const icon = LABEL_ICONS[addr.label] || '\u{1F4CD}'
                    return (
                      <div key={addr._id} onClick={() => setSelectedAddrId(addr._id)}
                        className={`relative flex items-start gap-3 p-3.5 rounded-none border cursor-pointer transition-all group ${isSelected ? 'border-primary-500/60 bg-primary-500/10 ring-1 ring-primary-500/30' : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5'}`}>
                        <div className={`mt-0.5 w-4 h-4 rounded-none border-2 flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'border-primary-400 bg-primary-500' : 'border-white/20'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-none" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm">{icon}</span>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-amber-700' : 'text-slate-500'}`}>{addr.label}</span>
                            {addr.isDefault && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">DEFAULT</span>}
                          </div>
                          <p className="text-sm text-slate-800 font-medium leading-snug">{addr.addressLine}</p>
                          {(addr.locality || addr.city) && (
                            <p className="text-xs text-slate-500 mt-0.5">{[addr.locality, addr.city, addr.pincode].filter(Boolean).join(', ')}</p>
                          )}
                        </div>
                        <button type="button" onClick={e => { e.stopPropagation(); handleDeleteAddress(addr._id) }}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-slate-500 hover:text-red-400 transition-all p-1 rounded-none hover:bg-red-500/10" title="Remove">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468A.75.75 0 003 5.41v.538a.75.75 0 00.75.75h12.5A.75.75 0 0017 5.948V5.41a.75.75 0 00-.635-.749A22.1 22.1 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM5 8a.75.75 0 01.75.75v6.5c0 .414.336.75.75.75h7a.75.75 0 00.75-.75v-6.5A.75.75 0 0115 8a.75.75 0 01.75.75v6.5A2.25 2.25 0 0113.5 17.5h-7A2.25 2.25 0 014.25 15.25v-6.5A.75.75 0 015 8z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {addresses.length === 0 && !showForm && (
                <div className="text-center py-6 text-slate-500">
                  <div className="text-3xl mb-2">{'\u{1F4CD}'}</div>
                  <p className="text-sm">No saved addresses yet.</p>
                  <p className="text-xs mt-1">Click "+ Add Address" above to add one.</p>
                </div>
              )}

              {showForm && (
                <div className="border border-none rounded-none p-4 space-y-4 bg-white/3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-800">New Address</p>
                    <button type="button" onClick={() => { setShowForm(false); setGeoMsg('') }} className="text-slate-500 hover:text-slate-800 text-lg leading-none transition-colors">&times;</button>
                  </div>

                  <button type="button" id="detect-location-btn" onClick={handleDetectLocation} disabled={geoLoading}
                    className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-none text-sm font-semibold border transition-all ${geoLoading ? 'bg-primary-500/10 border-none text-amber-800 cursor-not-allowed' : 'bg-primary-500/15 border-primary-500/40 text-amber-700 hover:bg-primary-500/25 hover:border-primary-500/70 hover:text-slate-800'}`}>
                    {geoLoading ? (
                      <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Detecting location&hellip;</>
                    ) : (
                      <>{'\u{1F4CD}'} Auto-detect My Location</>
                    )}
                  </button>

                  {geoMsg && (
                    <p className={`text-xs px-3 py-1.5 rounded-none border ${geoIsOk ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                      {geoIsOk ? '\u2713' : '\u26a0\ufe0f'} {geoText}
                    </p>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2 font-mono uppercase tracking-wide">Label</label>
                    <div className="flex gap-2">
                      {LABELS.map(l => (
                        <button key={l} type="button" onClick={() => setForm(f => ({ ...f, label: l }))}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-none border transition-all ${form.label === l ? 'border-primary-500/60 bg-slate-900 text-slate-800' : 'border-none bg-white/3 text-slate-500 hover:border-white/20 hover:text-slate-800'}`}>
                          {LABEL_ICONS[l]} {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 font-mono uppercase tracking-wide">House / Flat / Building <span className="text-red-400">*</span></label>
                    <input id="address-line-input" type="text" placeholder="e.g. Flat 4B, Sunrise Apartments"
                      className="w-full bg-white/5 border border-none rounded-none px-4 py-2.5 text-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-900 transition-colors"
                      value={form.addressLine} onChange={e => setForm(f => ({ ...f, addressLine: e.target.value }))} />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 font-mono uppercase tracking-wide">Locality / Area</label>
                    <input id="locality-input" type="text" placeholder="e.g. Rohini, Connaught Place"
                      className="w-full bg-white/5 border border-none rounded-none px-4 py-2.5 text-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-900 transition-colors"
                      value={form.locality} onChange={e => setForm(f => ({ ...f, locality: e.target.value }))} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5 font-mono uppercase tracking-wide">City</label>
                      <input id="city-input" type="text" placeholder="e.g. Delhi"
                        className="w-full bg-white/5 border border-none rounded-none px-4 py-2.5 text-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-900 transition-colors"
                        value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5 font-mono uppercase tracking-wide">Pincode</label>
                      <input id="pincode-input" type="text" placeholder="e.g. 110085" maxLength={10}
                        className="w-full bg-white/5 border border-none rounded-none px-4 py-2.5 text-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-900 transition-colors font-mono"
                        value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
                    </div>
                  </div>

                  {formError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-none px-3 py-1.5">{formError}</p>}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setShowForm(false); setGeoMsg('') }}
                      className="flex-1 py-2 text-sm text-slate-500 hover:text-slate-800 border border-none hover:border-white/30 rounded-none transition-all">Cancel</button>
                    <button id="save-address-btn" type="button" onClick={handleSaveAddress} disabled={formSaving}
                      className="flex-1 py-2 text-sm font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-slate-800 rounded-none transition-all disabled:opacity-50">
                      {formSaving ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="card p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800 mb-4">Price Estimation Breakdown</h2>
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-white/5 w-2/3 rounded" />
                  <div className="h-4 bg-white/5 w-1/2 rounded" />
                  <div className="h-8 bg-white/5 w-1/3 rounded" />
                </div>
              ) : preview ? (
                <div className="space-y-4 text-sm">
                  {selectedService && (
                    <div className="border-b border-none pb-3">
                      <p className="text-xs text-slate-500 font-mono">Service Selected</p>
                      <p className="text-slate-800 font-medium">{selectedService.serviceName}</p>
                      <p className="text-slate-500 text-xs mt-1">{selectedService.description}</p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Price</span>
                    <span className="text-slate-200 font-mono">&#x20B9;{preview.basePrice}</span>
                  </div>
                  {preview.surgeMultiplier > 1 && (
                    <div className="flex justify-between items-center text-amber-400">
                      <span className="flex items-center gap-1.5">
                        {'\u26a1'} Surge Multiplier
                        <span id="surge-multiplier-badge" className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded font-mono">{preview.surgeMultiplier}&times;</span>
                      </span>
                      <span className="font-mono">&times; {preview.surgeMultiplier}</span>
                    </div>
                  )}
                  {preview.isClustered && (
                    <div className="flex justify-between text-emerald-400">
                      <span>{'\u{1F389}'} Cluster Discount (10% Off)</span>
                      <span className="font-mono">&minus;10%</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-white/15 pt-4">
                    <span className="text-base font-medium text-slate-800">Final Price</span>
                    <span id="preview-final-price" className="text-xl font-bold text-amber-800 font-mono">&#x20B9;{preview.finalPrice}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-none pt-4 text-xs text-slate-500">
                    <div>
                      <p className="font-mono">Est. Arrival</p>
                      <p className="text-slate-800 font-medium mt-0.5">{preview.estimatedArrivalTime} min</p>
                    </div>
                    <div>
                      <p className="font-mono">Demand Level</p>
                      <p className={`font-medium mt-0.5 ${preview.demandLevel === 'High' ? 'text-red-400' : preview.demandLevel === 'Moderate' ? 'text-yellow-400' : 'text-green-400'}`}>{preview.demandLevel}</p>
                    </div>
                  </div>
                  {activeAddress && (
                    <div className="mt-2 border-t border-none pt-4">
                      <p className="text-xs text-slate-500 font-mono mb-1">Delivering to</p>
                      <div className="flex items-start gap-2">
                        <span className="text-sm">{LABEL_ICONS[activeAddress.label] || '\u{1F4CD}'}</span>
                        <div>
                          <p className="text-slate-800 text-sm font-medium">{activeAddress.addressLine}</p>
                          {(activeAddress.locality || activeAddress.city) && (
                            <p className="text-slate-500 text-xs mt-0.5">{[activeAddress.locality, activeAddress.city, activeAddress.pincode].filter(Boolean).join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Select a service above to see pricing.</p>
              )}
            </div>
            <div>
              <button id="confirm-booking-btn" onClick={handleBook}
                disabled={!preview || bookingLoading || addresses.length === 0}
                className="btn-primary w-full mt-6 py-2.5 font-semibold text-sm disabled:opacity-40">
                {bookingLoading ? 'Processing...' : '\u2713 Confirm Booking'}
              </button>
              {addresses.length === 0 && (
                <p className="text-center text-xs text-amber-400 mt-2">Add a delivery address to continue</p>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}