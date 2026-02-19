/**
 * Authentication Zustand Store
 * Manages user authentication state and permissions
 * Based on pharma_pos/careverse_pharma implementation
 *
 * COMPREHENSIVE FIX: Authentication Loop Bug
 * - Fixed cookie parsing to handle values with '='
 * - Added boot data validation
 * - Added server validation fallback
 * - Enhanced debug logging
 * - Fixed localStorage versioning
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Version for localStorage - increment to invalidate old cached data
const AUTH_STORE_VERSION = 2

interface User {
  name: string
  email: string
  full_name: string
  user_image: string | null
  roles: string[]
}

interface AuthState {
  // State
  version: number // localStorage version for cache invalidation
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

/**
 * PHASE 1: Robust cookie parser that handles values with '=' correctly
 */
const parseCookies = (): Record<string, string> => {
  return document.cookie.split(';').reduce((acc: Record<string, string>, cookie) => {
    const trimmed = cookie.trim()
    const splitIndex = trimmed.indexOf('=')

    if (splitIndex > 0) {
      const key = trimmed.substring(0, splitIndex)
      const value = trimmed.substring(splitIndex + 1)

      // Validate that we got actual string values
      if (key && typeof value === 'string') {
        acc[key] = value
      }
    }

    return acc
  }, {})
}

/**
 * Clear corrupted localStorage on first load
 * This handles any data that can't be parsed as valid JSON
 */
try {
  const storageKey = 'f360-central-auth-store'
  const oldData = localStorage.getItem(storageKey)

  if (oldData) {
    try {
      // Attempt to parse the stored data
      JSON.parse(oldData)
      // If we get here, data is valid JSON - no action needed
    } catch (parseError) {
      // Data is not valid JSON - clear it
      console.warn('[AUTH DEBUG] Detected corrupted localStorage (invalid JSON), clearing...')
      localStorage.removeItem(storageKey)
    }
  }
} catch (error) {
  // If any error occurs during the check itself, clear storage
  console.warn('[AUTH DEBUG] Error checking localStorage, clearing...', error)
  localStorage.removeItem('f360-central-auth-store')
}

/**
 * PHASE 2: Validate that window.frappe.boot contains complete authentication data
 * Returns null if validation fails, or validated data if success
 */
const validateFrappeBootData = (): {
  user: string
  fullName: string
  userImage: string | null
  roles: string[]
} | null => {
  try {
    // Check if window.frappe exists and is an object
    if (!(window as any).frappe || typeof (window as any).frappe !== 'object') {
      console.warn('[AUTH DEBUG] window.frappe is not defined or not an object')
      return null
    }

    // Check if boot exists and is an object
    if (!(window as any).frappe.boot || typeof (window as any).frappe.boot !== 'object') {
      console.warn('[AUTH DEBUG] window.frappe.boot is not defined or not an object')
      return null
    }

    // Check if session exists and has user field
    const session = (window as any).frappe.boot.session
    if (!session || typeof session !== 'object' || !session.user || typeof session.user !== 'string') {
      console.warn('[AUTH DEBUG] window.frappe.boot.session.user is invalid:', session)
      return null
    }

    // Check if user is not Guest
    if (session.user === 'Guest' || session.user.trim() === '') {
      console.warn('[AUTH DEBUG] User is Guest or empty string')
      return null
    }

    // Extract user data with fallbacks
    const userData = (window as any).frappe.boot.user || {}

    return {
      user: session.user,
      fullName: session.user_fullname || userData.full_name || session.user,
      userImage: session.user_image || userData.user_image || null,
      roles: userData.roles || (window as any).frappe.user_roles || []
    }
  } catch (error) {
    console.error('[AUTH DEBUG] Error validating frappe boot data:', error)
    return null
  }
}

const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => {
        /**
         * PHASE 3: Fallback to server validation when boot data is missing
         * Used when boot data is missing or inconsistent
         */
        const validateSessionWithServer = async (): Promise<boolean> => {
          try {
            console.log('[AUTH DEBUG] Falling back to server session validation...')

            const response = await fetch('/api/method/careverse_hq.api.auth_validation.validate_session', {
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
                'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
              }
            })

            if (!response.ok) {
              console.error('[AUTH DEBUG] Server validation failed with status:', response.status)
              return false
            }

            const data = await response.json()
            const result = data.message || data

            console.log('[AUTH DEBUG] Server validation result:', result)

            if (result.is_authenticated && result.user && result.user !== 'Guest') {
              set({
                isAuthenticated: true,
                user: {
                  name: result.user,
                  email: result.user,
                  full_name: result.full_name || result.user,
                  user_image: result.user_image || null,
                  roles: result.roles || []
                },
                loading: false
              })
              return true
            }

            return false
          } catch (error: any) {
            console.error('[AUTH DEBUG] Server validation error:', error)
            return false
          }
        }

        return {
          // State
          version: AUTH_STORE_VERSION, // Add version to state
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
           * PHASE 4: Enhanced checkAuthentication with comprehensive logging
           * Check current authentication status
           */
          checkAuthentication: async () => {
            console.log('[AUTH DEBUG] ======== STARTING AUTHENTICATION CHECK ========')
            console.log('[AUTH DEBUG] Timestamp:', new Date().toISOString())
            console.log('[AUTH DEBUG] Location:', window.location.href)

            set({ loading: true, error: null })

            try {
              // SECURITY: Validate CSRF token exists before checking auth
              console.log('[AUTH DEBUG] CSRF Token present:', !!(window as any).csrf_token)
              if (!(window as any).csrf_token) {
                console.warn('[SECURITY] CSRF token not available during authentication check')
              }

              // Log raw cookies
              console.log('[AUTH DEBUG] Raw document.cookie:', document.cookie)

              // PHASE 1: Parse cookies with robust parser
              const cookies = parseCookies()

              console.log('[AUTH DEBUG] Parsed cookies:', {
                hasSid: !!cookies.sid,
                hasUserId: !!cookies.user_id,
                sidLength: cookies.sid?.length,
                userIdValue: cookies.user_id,
                cookieKeys: Object.keys(cookies)
              })

              // Log window.frappe structure
              console.log('[AUTH DEBUG] window.frappe exists:', !!(window as any).frappe)
              console.log('[AUTH DEBUG] window.frappe.boot exists:', !!(window as any).frappe?.boot)
              console.log('[AUTH DEBUG] window.frappe.boot.session exists:', !!(window as any).frappe?.boot?.session)

              if ((window as any).frappe?.boot?.session) {
                console.log('[AUTH DEBUG] window.frappe.boot.session.user:', (window as any).frappe.boot.session.user)
                console.log('[AUTH DEBUG] Session structure:', JSON.stringify((window as any).frappe.boot.session, null, 2))
              }

              // If no session cookies (sid or user_id), user is not logged in
              if (!cookies.sid && !cookies.user_id) {
                console.log('[AUTH DEBUG] ❌ DECISION: No session cookies found - user NOT authenticated')
                set({
                  isAuthenticated: false,
                  user: null,
                  loading: false
                })
                return false
              }

              console.log('[AUTH DEBUG] ✅ Session cookies found, proceeding to validate boot data...')

              // PHASE 2: Validate boot data with comprehensive checks
              const validatedBootData = validateFrappeBootData()

              if (validatedBootData) {
                console.log('[AUTH DEBUG] ✅ DECISION: Boot data valid - user IS authenticated')
                console.log('[AUTH DEBUG] Authenticated user:', validatedBootData.user)
                set({
                  isAuthenticated: true,
                  user: {
                    name: validatedBootData.user,
                    email: validatedBootData.user,
                    full_name: validatedBootData.fullName,
                    user_image: validatedBootData.userImage,
                    roles: validatedBootData.roles
                  },
                  loading: false
                })
                return true
              }

              console.log('[AUTH DEBUG] ⚠️ Boot data validation failed, attempting server validation...')

              // PHASE 3: Fallback to server validation
              if (cookies.sid || cookies.user_id) {
                const serverValidation = await validateSessionWithServer()

                if (serverValidation) {
                  console.log('[AUTH DEBUG] ✅ DECISION: Server validation success - user IS authenticated')
                  return true
                }
              }

              console.log('[AUTH DEBUG] ⚠️ Server validation failed, attempting User API call...')

              // Final fallback: Try User API
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
                    console.log('[AUTH DEBUG] ✅ DECISION: User API success - user IS authenticated')
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

              // If we get here, all validation methods failed
              console.log('[AUTH DEBUG] ❌ DECISION: All validation methods failed - user NOT authenticated')
              set({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null
              })
              return false
            } catch (error: any) {
              console.error('[AUTH DEBUG] ❌ EXCEPTION during authentication check:', error)
              console.error('[AUTH DEBUG] Stack trace:', error.stack)
              set({
                isAuthenticated: false,
                user: null,
                error: error.message || 'Authentication failed',
                loading: false
              })
              return false
            } finally {
              console.log('[AUTH DEBUG] ======== AUTHENTICATION CHECK COMPLETE ========')
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
            set({ loading: true, error: null })

            // Clear client state immediately
            set({
              isAuthenticated: false,
              user: null,
              loading: false,
              error: null,
              permissions: {},
              permissionsLoading: false
            })

            try {
              localStorage.removeItem('f360-central-auth-store')
            } catch (e) {
              // Silent fail
            }

            // Use Frappe's standard logout route
            window.location.href = '/logout'
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
            version: AUTH_STORE_VERSION,
            isAuthenticated: null,
            user: null,
            loading: false,
            error: null,
            permissions: {},
            permissionsLoading: false
          })
        }
      },
      {
        name: 'f360-central-auth-store',
        partialize: (state) => ({
          version: state.version,
          isAuthenticated: state.isAuthenticated,
          user: state.user
        }) as any,
        /**
         * PHASE 5: Enhanced localStorage with version checking and validation
         */
        storage: {
          getItem: (name: string) => {
            const value = localStorage.getItem(name)
            if (!value) return null

            try {
              const parsed = JSON.parse(value)

              // Version check: invalidate old localStorage formats
              if (!parsed.state?.version || parsed.state.version !== AUTH_STORE_VERSION) {
                console.log('[AUTH DEBUG] localStorage version mismatch, clearing...')
                localStorage.removeItem(name)
                return null
              }

              // Cookie validation: if no cookies, clear localStorage
              const cookies = parseCookies()

              if (!cookies.sid && !cookies.user_id) {
                console.log('[AUTH DEBUG] No session cookies found, clearing localStorage')
                localStorage.removeItem(name)
                return null
              }

              // Additional validation: check if isAuthenticated is true but boot data disagrees
              if (parsed.state?.isAuthenticated === true) {
                const bootUser = (window as any).frappe?.boot?.session?.user
                if (bootUser === 'Guest' || !bootUser) {
                  console.log('[AUTH DEBUG] localStorage says authenticated but boot says Guest, clearing...')
                  localStorage.removeItem(name)
                  return null
                }
              }

              return parsed
            } catch (error) {
              console.error('[AUTH DEBUG] Error parsing localStorage:', error)
              localStorage.removeItem(name)
              return null
            }
          },
          setItem: (name: string, value: any) => {
            // Zustand persist handles the object structure, we just stringify and store
            localStorage.setItem(name, JSON.stringify(value))
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
