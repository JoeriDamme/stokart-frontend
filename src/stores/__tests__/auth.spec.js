import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { authAPI } from '@/api/auth'

// Mock the auth API
vi.mock('@/api/auth', () => ({
  authAPI: {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn()
  }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())

    // Clear localStorage
    localStorage.clear()

    // Clear all mocks
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have null values when no stored data', () => {
      const store = useAuthStore()

      expect(store.userId).toBe(null)
      expect(store.userEmail).toBe(null)
      expect(store.accessToken).toBe(null)
      expect(store.refreshToken).toBe(null)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
      expect(store.isAuthenticated).toBe(false)
    })

    it('should load data from localStorage if available', () => {
      localStorage.setItem('userId', 'test-user-id')
      localStorage.setItem('userEmail', 'test@example.com')
      localStorage.setItem('accessToken', 'test-access-token')
      localStorage.setItem('refreshToken', 'test-refresh-token')

      const store = useAuthStore()

      expect(store.userId).toBe('test-user-id')
      expect(store.userEmail).toBe('test@example.com')
      expect(store.accessToken).toBe('test-access-token')
      expect(store.refreshToken).toBe('test-refresh-token')
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('register action', () => {
    it('should register user successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'user-123',
            email: 'newuser@example.com',
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-123'
          }
        }
      }

      authAPI.register.mockResolvedValue(mockResponse)

      const store = useAuthStore()
      const result = await store.register('John Doe', 'newuser@example.com', 'SecurePass123')

      expect(authAPI.register).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'newuser@example.com',
        plainPassword: 'SecurePass123'
      })

      expect(store.userId).toBe('user-123')
      expect(store.userEmail).toBe('newuser@example.com')
      expect(store.accessToken).toBe('access-token-123')
      expect(store.refreshToken).toBe('refresh-token-123')
      expect(store.isAuthenticated).toBe(true)
      expect(store.error).toBe(null)

      // Check localStorage
      expect(localStorage.getItem('userId')).toBe('user-123')
      expect(localStorage.getItem('userEmail')).toBe('newuser@example.com')
      expect(localStorage.getItem('accessToken')).toBe('access-token-123')
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token-123')

      expect(result).toEqual(mockResponse.data)
    })

    it('should handle registration error', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Email already exists'
          }
        }
      }

      authAPI.register.mockRejectedValue(mockError)

      const store = useAuthStore()

      await expect(
        store.register('John Doe', 'existing@example.com', 'SecurePass123')
      ).rejects.toEqual(mockError)

      expect(store.error).toBe('Email already exists')
      expect(store.userId).toBe(null)
      expect(store.userEmail).toBe(null)
      expect(store.accessToken).toBe(null)
      expect(store.isAuthenticated).toBe(false)
    })

    it('should set loading state during registration', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'user-123',
            email: 'newuser@example.com',
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-123'
          }
        }
      }

      authAPI.register.mockImplementation(() => {
        const store = useAuthStore()
        expect(store.isLoading).toBe(true)
        return Promise.resolve(mockResponse)
      })

      const store = useAuthStore()
      await store.register('John Doe', 'newuser@example.com', 'SecurePass123')

      expect(store.isLoading).toBe(false)
    })
  })

  describe('login action', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'user-456',
            email: 'user@example.com',
            accessToken: 'access-token-456',
            refreshToken: 'refresh-token-456'
          }
        }
      }

      authAPI.login.mockResolvedValue(mockResponse)

      const store = useAuthStore()
      const result = await store.login('user@example.com', 'SecurePass123')

      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        plainPassword: 'SecurePass123'
      })

      expect(store.userId).toBe('user-456')
      expect(store.userEmail).toBe('user@example.com')
      expect(store.accessToken).toBe('access-token-456')
      expect(store.refreshToken).toBe('refresh-token-456')
      expect(store.isAuthenticated).toBe(true)

      expect(result).toEqual(mockResponse.data)
    })

    it('should handle login error', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid credentials'
          }
        }
      }

      authAPI.login.mockRejectedValue(mockError)

      const store = useAuthStore()

      await expect(
        store.login('user@example.com', 'WrongPassword')
      ).rejects.toEqual(mockError)

      expect(store.error).toBe('Invalid credentials')
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('logout action', () => {
    it('should clear all user data', () => {
      localStorage.setItem('userId', 'user-123')
      localStorage.setItem('userEmail', 'user@example.com')
      localStorage.setItem('accessToken', 'access-token')
      localStorage.setItem('refreshToken', 'refresh-token')

      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(true)

      store.logout()

      expect(store.userId).toBe(null)
      expect(store.userEmail).toBe(null)
      expect(store.accessToken).toBe(null)
      expect(store.refreshToken).toBe(null)
      expect(store.error).toBe(null)
      expect(store.isAuthenticated).toBe(false)

      expect(localStorage.getItem('userId')).toBe(null)
      expect(localStorage.getItem('userEmail')).toBe(null)
      expect(localStorage.getItem('accessToken')).toBe(null)
      expect(localStorage.getItem('refreshToken')).toBe(null)
    })
  })

  describe('clearError action', () => {
    it('should clear error state', () => {
      const store = useAuthStore()
      store.error = 'Some error'

      store.clearError()

      expect(store.error).toBe(null)
    })
  })

  describe('isAuthenticated computed', () => {
    it('should return true when accessToken exists', () => {
      const store = useAuthStore()
      store.accessToken = 'some-token'

      expect(store.isAuthenticated).toBe(true)
    })

    it('should return false when accessToken is null', () => {
      const store = useAuthStore()
      store.accessToken = null

      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('setTokens action (US-1.4: Automatic Token Refresh)', () => {
    it('should update tokens in state and localStorage', () => {
      const store = useAuthStore()

      // Set initial tokens
      store.accessToken = 'old-access-token'
      store.refreshToken = 'old-refresh-token'

      // Call setTokens with new tokens
      store.setTokens('new-access-token', 'new-refresh-token')

      // Verify state is updated
      expect(store.accessToken).toBe('new-access-token')
      expect(store.refreshToken).toBe('new-refresh-token')

      // Verify localStorage is updated
      expect(localStorage.getItem('accessToken')).toBe('new-access-token')
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token')
    })

    it('should update authentication status when tokens are set', () => {
      const store = useAuthStore()

      // Initially no token
      expect(store.isAuthenticated).toBe(false)

      // Set tokens
      store.setTokens('new-access-token', 'new-refresh-token')

      // Now authenticated
      expect(store.isAuthenticated).toBe(true)
    })

    it('should replace existing tokens correctly', () => {
      const store = useAuthStore()

      // Set initial tokens
      localStorage.setItem('accessToken', 'old-access')
      localStorage.setItem('refreshToken', 'old-refresh')
      store.accessToken = 'old-access'
      store.refreshToken = 'old-refresh'

      // Update with new tokens
      store.setTokens('updated-access', 'updated-refresh')

      // Verify old tokens are replaced
      expect(store.accessToken).toBe('updated-access')
      expect(store.refreshToken).toBe('updated-refresh')
      expect(localStorage.getItem('accessToken')).toBe('updated-access')
      expect(localStorage.getItem('refreshToken')).toBe('updated-refresh')
    })
  })
})
