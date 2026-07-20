import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Auth pages
import LoginPage       from './features/auth/LoginPage'
import OtpPage         from './features/auth/OtpPage'
import RoleSelectPage  from './features/auth/RoleSelectPage'

// Customer pages (Phase 2 + 3 + 4 + 5)
import ServiceCatalog  from './features/customer/ServiceCatalog'
import BookingHistory  from './features/customer/BookingHistory'
import BookingPreview  from './features/customer/BookingPreview'
import TrackingPage    from './features/customer/TrackingPage'

// Chat (Phase 6)
import ChatPage        from './features/chat/ChatPage'

// Payments & Payouts (Phase 7)
import PaymentPage     from './features/payment/PaymentPage'
import EarningsPage    from './features/provider/EarningsPage'
import ManagePayouts   from './features/admin/ManagePayouts'

// Ratings & Disputes (Phase 8)
import ManageDisputes  from './features/admin/ManageDisputes'


// Provider pages (Phase 3)
import BookingQueue    from './features/provider/BookingQueue'
import VerificationPage from './features/provider/VerificationPage'

// Admin pages (Phase 2 + 4 + 10)
import ManageServices  from './features/admin/ManageServices'
import ManageSurgeRules from './features/admin/ManageSurgeRules'
import ManageVerifications from './features/admin/ManageVerifications'
import AdminDashboard   from './features/admin/AdminDashboard'
import RevenueReport    from './features/admin/RevenueReport'
import ManageProviders  from './features/admin/ManageProviders'



// Route guard
import ProtectedRoute  from './components/ProtectedRoute'

// ── Shared stub for routes not yet built ──────────────────────────
const Stub = ({ title }) => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <div className="card p-10 max-w-md w-full animate-fade-in">
      <div className="text-4xl mb-4">🚧</div>
      <h1 className="text-xl font-semibold text-slate-800 mb-2">{title}</h1>
      <p className="text-slate-500 text-sm">Coming in an upcoming phase.</p>
    </div>
  </div>
)

const Unauthorized = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <div className="card p-10 max-w-md w-full animate-fade-in">
      <div className="text-5xl mb-4">🔒</div>
      <h1 className="text-xl font-semibold text-slate-800 mb-2">Access Denied</h1>
      <p className="text-slate-500 text-sm">You don't have permission to view this page.</p>
    </div>
  </div>
)

const DevLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const loginAs = (role) => {
    const adminToken    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNTg4MDZlMTEwOWMzZGQyNGQ1MWM5ZCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4NDMxNDU0NywiZXhwIjoxODE1ODUwNTQ3fQ.1GWOcv_1Gov_ig3B4oGCKPF4zU9j0f9B2IlXeZmSCOU'
    const customerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNTg3NDc3YTU0MGE1MDJkMjhlOTEzMyIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc4NDMxNDU0NywiZXhwIjoxODE1ODUwNTQ3fQ.MbRAa3yPsZns3IKEZSvzN57oAwHiE89OtyprlcSfw_M'
    const providerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNTg5YjdmMWI2Y2QwNWI2YWEyNGQyNSIsInJvbGUiOiJwcm92aWRlciIsImlhdCI6MTc4NDMxNDU0NywiZXhwIjoxODE1ODUwNTQ3fQ.RYw_Pd4-IDupVvEF3AY5fnnvFKSxOZbd1xYpj9qZspk'

    const configs = {
      admin:    { token: adminToken,    id: '6a58806e1109c3dd24d51c9d', email: 'admin@quickhelp.dev',    name: 'Admin' },
      customer: { token: customerToken, id: '6a587477a540a502d28e9133', email: 'test@example.com',         name: 'Test Customer' },
      provider: { token: providerToken, id: '6a589b7f1b6cd05b6aa24d25', email: 'provA@quickhelp.dev',     name: 'Provider A' },
    }

    const c = configs[role]
    setAuth(c.token, {
      id: c.id, email: c.email, role, name: c.name,
      roleSelectedAt: '2026-07-16T00:00:00.000Z'
    })

    if (role === 'admin')    navigate('/admin/services')
    else if (role === 'provider') navigate('/provider/bookings')
    else                     navigate('/customer/services')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="card p-10 max-w-md w-full animate-fade-in space-y-4">
        <h1 className="text-xl font-semibold text-slate-800">Dev Login Helper</h1>
        <button id="dev-login-customer" onClick={() => loginAs('customer')} className="btn-primary w-full">
          Login as Customer
        </button>
        <button id="dev-login-provider" onClick={() => loginAs('provider')} className="btn-secondary w-full">
          Login as Provider
        </button>
        <button id="dev-login-admin" onClick={() => loginAs('admin')} className="w-full text-sm text-slate-500 hover:text-slate-800 border border-none hover:border-white/30 py-2 rounded-none transition-all">
          Login as Admin
        </button>
      </div>
    </div>
  )
}


export default function App() {
  const { token, user } = useAuthStore()

  return (
    <BrowserRouter>
      <div className="bg-dots">
        <Routes>
          {/* ── Public auth routes ─────────────────────────── */}
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/otp"          element={<OtpPage />} />
          <Route path="/role-select"  element={<RoleSelectPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route
            path="/dev-login"
            element={
              (import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true' || import.meta.env.DEV)
                ? <DevLogin />
                : <Navigate to="/login" replace />
            }
          />


          {/* ── Customer routes ────────────────────────────── */}
          <Route
            path="/customer/services"
            element={
              <ProtectedRoute roles={['customer']}>
                <ServiceCatalog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/preview"
            element={
              <ProtectedRoute roles={['customer']}>
                <BookingPreview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/services/:id"
            element={
              <ProtectedRoute roles={['customer']}>
                <Navigate to="/customer/preview" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bookings"
            element={
              <ProtectedRoute roles={['customer']}>
                <BookingHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/track/:id"
            element={
              <ProtectedRoute roles={['customer']}>
                <TrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pay/:bookingId"
            element={
              <ProtectedRoute roles={['customer']}>
                <PaymentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/*"
            element={
              <ProtectedRoute roles={['customer']}>
                <Navigate to="/customer/services" replace />
              </ProtectedRoute>
            }
          />

          {/* ── Provider routes (Phase 3) ──────────────────── */}
          <Route
            path="/provider/bookings"
            element={
              <ProtectedRoute roles={['provider']}>
                <BookingQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/earnings"
            element={
              <ProtectedRoute roles={['provider']}>
                <EarningsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/verification"
            element={
              <ProtectedRoute roles={['provider']}>
                <VerificationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/*"
            element={
              <ProtectedRoute roles={['provider']}>
                <Navigate to="/provider/bookings" replace />
              </ProtectedRoute>
            }
          />


          {/* ── Chat routes (Phase 6) ────────────────────────── */}
          <Route
            path="/chat/:bookingId"
            element={
              <ProtectedRoute roles={['customer', 'provider', 'admin']}>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* ── Admin routes ────────────────────────────────── */}
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute roles={['admin']}>
                <ManageServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/surge-rules"
            element={
              <ProtectedRoute roles={['admin']}>
                <ManageSurgeRules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payouts"
            element={
              <ProtectedRoute roles={['admin']}>
                <ManagePayouts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/disputes"
            element={
              <ProtectedRoute roles={['admin']}>
                <ManageDisputes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verifications"
            element={
              <ProtectedRoute roles={['admin']}>
                <ManageVerifications />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/revenue"
            element={
              <ProtectedRoute roles={['admin']}>
                <RevenueReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/providers"
            element={
              <ProtectedRoute roles={['admin']}>
                <ManageProviders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute roles={['admin']}>
                <Stub title="Admin — Coming Soon" />
              </ProtectedRoute>
            }
          />

          {/* ── Root smart redirect ─────────────────────────── */}
          <Route
            path="/"
            element={
              token && user
                ? user.roleSelectedAt
                  ? <Navigate to={
                      user.role === 'admin'    ? '/admin' :
                      user.role === 'provider' ? '/provider/dashboard' :
                                                 '/customer/services'
                    } replace />
                  : <Navigate to="/role-select" replace />
                : <Navigate to="/login" replace />
            }
          />

          {/* 404 catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
