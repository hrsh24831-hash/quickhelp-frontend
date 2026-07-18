import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * authStore — persists to localStorage so the session survives page reloads.
 *
 * Shape:
 *   token:  string | null      — JWT (7-day expiry, set by /verify-otp)
 *   user:   object | null      — { id, email, role, name, roleSelectedAt }
 *   pendingEmail: string|null  — email awaiting OTP (transient, not persisted)
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token:        null,
      user:         null,
      pendingEmail: null,   // not persisted (see partialize below)

      // Called after /verify-otp succeeds
      setAuth: (token, userData) =>
        set({ token, user: userData }),

      // Called after /role succeeds — update role in store without re-login
      setRole: (role, roleSelectedAt) =>
        set((state) => ({
          user: state.user ? { ...state.user, role, roleSelectedAt } : null
        })),

      // Update user details (e.g. sync profile details from server)
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        })),


      // Transient state during login flow
      setPendingEmail: (email) => set({ pendingEmail: email }),
      clearPendingEmail: ()    => set({ pendingEmail: null }),

      // Full logout — clears persisted storage
      logout: () => set({ token: null, user: null, pendingEmail: null }),

      // Helpers
      isAuthenticated: () => !!get().token,
      getRole:         () => get().user?.role ?? null,
    }),
    {
      name: 'quickhelp-auth',           // localStorage key
      partialize: (state) => ({
        token: state.token,
        user:  state.user,
        // pendingEmail is intentionally excluded from persistence
      }),
    }
  )
)
