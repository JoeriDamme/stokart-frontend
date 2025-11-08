import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CardsView from '../CardsView.vue'
import { useAuthStore } from '@/stores/auth'

describe('CardsView', () => {
  let router
  let pinia

  beforeEach(() => {
    // Create fresh pinia instance
    pinia = createPinia()
    setActivePinia(pinia)

    // Create router
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/cards', component: CardsView },
        { path: '/login', component: { template: '<div>Login</div>' } }
      ]
    })

    // Clear localStorage
    localStorage.clear()
  })

  describe('US-1.3: User Logout', () => {
    it('should display logout button in the header', () => {
      // Set up authenticated user
      localStorage.setItem('userId', 'user-123')
      localStorage.setItem('userEmail', 'test@example.com')
      localStorage.setItem('accessToken', 'test-token')
      localStorage.setItem('refreshToken', 'refresh-token')

      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const logoutButton = wrapper.find('.logout-button')
      expect(logoutButton.exists()).toBe(true)
      expect(logoutButton.text()).toBe('Logout')
    })

    it('should display user email in welcome message', () => {
      // Set up authenticated user
      localStorage.setItem('userId', 'user-123')
      localStorage.setItem('userEmail', 'test@example.com')
      localStorage.setItem('accessToken', 'test-token')
      localStorage.setItem('refreshToken', 'refresh-token')

      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const welcomeMessage = wrapper.find('.welcome-message')
      expect(welcomeMessage.text()).toContain('test@example.com')
    })

    it('should call logout and redirect to login when logout button is clicked', async () => {
      // Set up authenticated user
      localStorage.setItem('userId', 'user-123')
      localStorage.setItem('userEmail', 'test@example.com')
      localStorage.setItem('accessToken', 'test-token')
      localStorage.setItem('refreshToken', 'refresh-token')

      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const authStore = useAuthStore()
      const logoutSpy = vi.spyOn(authStore, 'logout')
      const pushSpy = vi.spyOn(router, 'push')

      // Verify user is authenticated before logout
      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.userEmail).toBe('test@example.com')

      // Click logout button
      const logoutButton = wrapper.find('.logout-button')
      await logoutButton.trigger('click')

      // Verify logout was called
      expect(logoutSpy).toHaveBeenCalled()

      // Verify user data is cleared from store
      expect(authStore.userId).toBe(null)
      expect(authStore.userEmail).toBe(null)
      expect(authStore.accessToken).toBe(null)
      expect(authStore.refreshToken).toBe(null)
      expect(authStore.isAuthenticated).toBe(false)

      // Verify localStorage is cleared
      expect(localStorage.getItem('userId')).toBe(null)
      expect(localStorage.getItem('userEmail')).toBe(null)
      expect(localStorage.getItem('accessToken')).toBe(null)
      expect(localStorage.getItem('refreshToken')).toBe(null)

      // Verify redirect to login
      expect(pushSpy).toHaveBeenCalledWith('/login')
    })

    it('should clear all tokens from localStorage when logging out', async () => {
      // Set up authenticated user with all tokens
      localStorage.setItem('userId', 'user-123')
      localStorage.setItem('userEmail', 'test@example.com')
      localStorage.setItem('accessToken', 'test-access-token')
      localStorage.setItem('refreshToken', 'test-refresh-token')

      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Verify tokens are present before logout
      expect(localStorage.getItem('accessToken')).toBe('test-access-token')
      expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token')

      // Click logout button
      const logoutButton = wrapper.find('.logout-button')
      await logoutButton.trigger('click')

      // Verify all tokens are cleared from localStorage
      expect(localStorage.getItem('userId')).toBe(null)
      expect(localStorage.getItem('userEmail')).toBe(null)
      expect(localStorage.getItem('accessToken')).toBe(null)
      expect(localStorage.getItem('refreshToken')).toBe(null)
    })

    it('should clear user state from Pinia store when logging out', async () => {
      // Set up authenticated user
      localStorage.setItem('userId', 'user-123')
      localStorage.setItem('userEmail', 'test@example.com')
      localStorage.setItem('accessToken', 'test-token')
      localStorage.setItem('refreshToken', 'refresh-token')

      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const authStore = useAuthStore()

      // Verify user state is present before logout
      expect(authStore.userId).toBe('user-123')
      expect(authStore.userEmail).toBe('test@example.com')
      expect(authStore.accessToken).toBe('test-token')
      expect(authStore.refreshToken).toBe('refresh-token')
      expect(authStore.isAuthenticated).toBe(true)

      // Click logout button
      const logoutButton = wrapper.find('.logout-button')
      await logoutButton.trigger('click')

      // Verify all user state is cleared from Pinia store
      expect(authStore.userId).toBe(null)
      expect(authStore.userEmail).toBe(null)
      expect(authStore.accessToken).toBe(null)
      expect(authStore.refreshToken).toBe(null)
      expect(authStore.error).toBe(null)
      expect(authStore.isAuthenticated).toBe(false)
    })
  })
})
