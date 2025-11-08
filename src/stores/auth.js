import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/api/auth'
import { setAuthCallbacks } from '@/api/axios'

export const useAuthStore = defineStore('auth', () => {
  // State
  const userId = ref(localStorage.getItem('userId') || null)
  const userEmail = ref(localStorage.getItem('userEmail') || null)
  const accessToken = ref(localStorage.getItem('accessToken') || null)
  const refreshToken = ref(localStorage.getItem('refreshToken') || null)
  const isLoading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value)

  // Actions
  async function register(name, email, password) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.register({
        name,
        email,
        plainPassword: password
      })

      const { id, email: userEmailResponse, accessToken: token, refreshToken: refresh } = response.data.data

      // Update state
      userId.value = id
      userEmail.value = userEmailResponse
      accessToken.value = token
      refreshToken.value = refresh

      // Persist to localStorage
      localStorage.setItem('userId', id)
      localStorage.setItem('userEmail', userEmailResponse)
      localStorage.setItem('accessToken', token)
      localStorage.setItem('refreshToken', refresh)

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function login(email, password) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.login({
        email,
        plainPassword: password
      })

      const { id, email: userEmailResponse, accessToken: token, refreshToken: refresh } = response.data.data

      // Update state
      userId.value = id
      userEmail.value = userEmailResponse
      accessToken.value = token
      refreshToken.value = refresh

      // Persist to localStorage
      localStorage.setItem('userId', id)
      localStorage.setItem('userEmail', userEmailResponse)
      localStorage.setItem('accessToken', token)
      localStorage.setItem('refreshToken', refresh)

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    // Clear state
    userId.value = null
    userEmail.value = null
    accessToken.value = null
    refreshToken.value = null
    error.value = null

    // Clear localStorage
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  function setTokens(newAccessToken, newRefreshToken) {
    // Update state
    accessToken.value = newAccessToken
    refreshToken.value = newRefreshToken

    // Persist to localStorage
    localStorage.setItem('accessToken', newAccessToken)
    localStorage.setItem('refreshToken', newRefreshToken)
  }

  function clearError() {
    error.value = null
  }

  // Setup callbacks for axios interceptor
  setAuthCallbacks({
    onTokensRefreshed: (newAccessToken, newRefreshToken) => {
      setTokens(newAccessToken, newRefreshToken)
    },
    onLogout: () => {
      logout()
    }
  })

  return {
    // State
    userId,
    userEmail,
    accessToken,
    refreshToken,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    register,
    login,
    logout,
    setTokens,
    clearError
  }
})
