/**
 * Authentication Zustand Store
 * Manages user authentication state and permissions
 * Based on pharma_pos/careverse_pharma implementation
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface User {
  name: string
  email: string
  full_name: string
  user_image: string | null
  roles: string[]
}

interface AuthState {
  // State
  isAuthenticated: boolean | null // null = checking, true/false = result
  user: User | null
  loading: boolean
  error: string | null
  permissions: Record<string, any> // Cached permissions by DocType
  permissionsLoading: boolean

  // Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  checkAuthentication: () => Promise<boolean>
  handleSessionExpiry: () => void
  login: () => void
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  handlePostLoginRedirect: () => void
  hasWritePermission: (doctype: string) => Promise<boolean>
  hasReadPermission: (doctype: string) => Promise<boolean>
  getUserPermissions: () => string[]
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  reset: () => void
}

const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        isAuthenticated: null,
        user: null,
        loading: false,
        error: null,
        permissions: {},
        permissionsLoading: false,

        // Actions
        setLoading: (loading) => set({ loading }),

        setError: (error) => set({ error }),

        clearError: () => set({ error: null }),

        /**
         * Check current authentication status
         */
        checkAuthentication: async () => {
          set({ loading: true, error: null })

          try {
            // SECURITY: Validate CSRF token exists before checking auth
            if (!(window as any).csrf_token) {
              console.warn('[SECURITY] CSRF token not available during authentication check')
            }

            // Check if user has valid session cookies first
            const cookies = document.cookie.split(';').reduce((acc: Record<string, string>, cookie) => {
              const [key, value] = cookie.trim().split('=')
              acc[key] = value
              return acc
            }, {})

            console.log('[AUTH DEBUG] Checking authentication...', {
              hasSidCookie: !!cookies.sid,
              hasUserIdCookie: !!cookies.user_id,
              hasFrappeSession: !!(window as any).frappe?.session,
              frappeUser: (window as any).frappe?.session?.user,
              frappeUserFullname: (window as any).frappe?.session?.user_fullname
            })

            // If no session cookies (sid or user_id), user is not logged in
            if (!cookies.sid && !cookies.user_id) {
              console.log('[AUTH DEBUG] No session cookies found - user not authenticated')
              set({
                isAuthenticated: false,
                user: null,
                loading: false
              })
              return false
            }

            // If frappe session data is available in window, use it
            const frappeSession = (window as any).frappe?.session
            if (frappeSession?.user && frappeSession.user !== 'Guest') {
              console.log('[AUTH DEBUG] User authenticated:', frappeSession.user)
              set({
                isAuthenticated: true,
                user: {
                  name: frappeSession.user,
                  email: frappeSession.user,
                  full_name: frappeSession.user_fullname || frappeSession.user,
                  user_image: frappeSession.user_image || null,
                  roles: (window as any).frappe?.boot?.user?.roles || (window as any).frappe?.user_roles || frappeSession.roles || []
                },
                loading: false
              })
              return true
            }

            // If we have session cookies but frappe session is not available yet,
            // try fetching user info from API
            console.log('[AUTH DEBUG] Has session cookies but no frappe.session, attempting API call...')
            try {
              const response = await fetch('/api/resource/User', {
                credentials: 'include',
                headers: {
                  'Accept': 'application/json',
                  'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
                }
              })

              if (response.ok) {
                const data = await response.json()
                console.log('[AUTH DEBUG] User API response:', data)
                const userName = data.data?.name || data.data?.[0]?.name
                if (userName && userName !== 'Guest') {
                  set({
                    isAuthenticated: true,
                    user: {
                      name: userName,
                      email: userName,
                      full_name: data.data?.full_name || userName,
                      user_image: data.data?.user_image || null,
                      roles: data.data?.roles || []
                    },
                    loading: false
                  })
                  return true
                }
              }
            } catch (apiError: any) {
              console.log('[AUTH DEBUG] User API call failed:', apiError.message)
            }

            // If we get here but have cookies, user might be guest
            console.log('[AUTH DEBUG] Could not determine user - setting to unauthenticated')
            set({
              isAuthenticated: false,
              user: null,
              loading: false,
              error: null
            })
            return false
          } catch (error: any) {
            console.error('[AUTH DEBUG] Authentication check failed:', error)
            set({
              isAuthenticated: false,
              user: null,
              error: error.message || 'Authentication failed',
              loading: false
            })
            return false
          }
        },

        /**
         * Handle session expiry (called when 401 error is detected)
         */
        handleSessionExpiry: () => {
          console.warn('[SECURITY] Session has expired. Clearing authentication state.')
          set({
            isAuthenticated: false,
            user: null,
            error: 'Your session has expired. Please log in again.',
            loading: false
          })
        },

        /**
         * Login user (redirects to Frappe login)
         */
        login: () => {
          const currentUrl = window.location.href
          const loginUrl = `/login?redirect-to=${encodeURIComponent(currentUrl)}`
          window.location.href = loginUrl
        },

        /**
         * Logout user
         */
        logout: async () => {
          set({ loading: true })

          try {
            const response = await fetch('/api/method/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
              }
            })
            console.log('[AuthService] Logout API response:', response.status)
          } catch (error) {
            console.warn('[AuthService] Logout API call failed, proceeding with redirect:', error)
          } finally {
            set({
              isAuthenticated: false,
              user: null,
              loading: false,
              error: null,
              permissions: {}
            })
            window.location.href = '/'
          }
        },

        /**
         * Update user profile
         */
        updateUser: (userData) => set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        })),

        /**
         * Handle post-login redirect
         */
        handlePostLoginRedirect: () => {
          const urlParams = new URLSearchParams(window.location.search)
          const redirectTo = urlParams.get('redirect-to')

          if (redirectTo) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash)
            window.location.href = redirectTo
          }
        },

        /**
         * Check if user has write permission for a DocType
         */
        hasWritePermission: async (doctype: string) => {
          try {
            const { permissions } = get()
            if (permissions[doctype]) {
              return permissions[doctype].write === true || permissions[doctype].write === 1
            }
            // For now, return true - implement actual permission check later
            return true
          } catch (error) {
            console.error(`Error checking write permission for ${doctype}:`, error)
            return false
          }
        },

        /**
         * Check if user has read permission for a DocType
         */
        hasReadPermission: async (doctype: string) => {
          try {
            const { permissions } = get()
            if (permissions[doctype]) {
              return permissions[doctype].read === true || permissions[doctype].read === 1
            }
            // For now, return true - implement actual permission check later
            return true
          } catch (error) {
            console.error(`Error checking read permission for ${doctype}:`, error)
            return false
          }
        },

        /**
         * Get user permissions (legacy method for backward compatibility)
         */
        getUserPermissions: () => {
          const { user } = get()
          if (!user) return []
          // Return mock permissions based on user role
          return [
            'read:hr',
            'read:stock',
            'read:accounting',
            'manage:company'
          ]
        },

        /**
         * Check if user has specific permission (legacy method)
         */
        hasPermission: (permission: string) => {
          const permissions = get().getUserPermissions()
          return permissions.includes(permission)
        },

        /**
         * Check if user has any of the specified permissions (legacy method)
         */
        hasAnyPermission: (permissions: string[]) => {
          const userPermissions = get().getUserPermissions()
          return permissions.some(permission => userPermissions.includes(permission))
        },

        /**
         * Check if user has all of the specified permissions (legacy method)
         */
        hasAllPermissions: (permissions: string[]) => {
          const userPermissions = get().getUserPermissions()
          return permissions.every(permission => userPermissions.includes(permission))
        },

        /**
         * Reset auth state
         */
        reset: () => set({
          isAuthenticated: null,
          user: null,
          loading: false,
          error: null,
          permissions: {},
          permissionsLoading: false
        })
      }),
      {
        name: 'f360-central-auth-store',
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user
        }),
        storage: {
          getItem: (name: string) => {
            const value = localStorage.getItem(name)
            if (value) {
              try {
                const parsed = JSON.parse(value)
                const cookies = document.cookie.split(';').reduce((acc: Record<string, string>, cookie) => {
                  const [key, val] = cookie.trim().split('=')
                  acc[key] = val
                  return acc
                }, {})

                if (!cookies.sid && !cookies.user_id) {
                  localStorage.removeItem(name)
                  return null
                }
                return parsed
              } catch {
                return null
              }
            }
            return null
          },
          setItem: (name: string, value: string) => {
            localStorage.setItem(name, value)
          },
          removeItem: (name: string) => {
            localStorage.removeItem(name)
          }
        }
      }
    ),
    {
      name: 'admin-central-auth-store'
    }
  )
)

export default useAuthStore

