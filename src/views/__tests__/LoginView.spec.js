import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from '../LoginView.vue'
import { useAuthStore } from '@/stores/auth'

// Mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/login', component: LoginView },
    { path: '/register', component: { template: '<div>Register</div>' } },
    { path: '/cards', component: { template: '<div>Cards</div>' } }
  ]
})

describe('LoginView', () => {
  let wrapper
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()

    wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })
  })

  describe('Form Rendering', () => {
    it('should render login form with all fields', () => {
      expect(wrapper.find('h1').text()).toBe('Welcome Back')
      expect(wrapper.find('#email').exists()).toBe(true)
      expect(wrapper.find('#password').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('should have a link to register page', () => {
      const registerLink = wrapper.find('a[href="/register"]')
      expect(registerLink.exists()).toBe(true)
      expect(registerLink.text()).toBe('Register here')
    })
  })

  describe('Form Validation', () => {
    it('should show error when email is empty on blur', async () => {
      const emailInput = wrapper.find('#email')
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Email is required')
    })

    it('should show error for invalid email format', async () => {
      const emailInput = wrapper.find('#email')
      await emailInput.setValue('invalid-email')
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Please enter a valid email address')
    })

    it('should validate email format correctly', async () => {
      const emailInput = wrapper.find('#email')

      // Valid email
      await emailInput.setValue('user@example.com')
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('Please enter a valid email address')

      // Invalid email
      await emailInput.setValue('invalid')
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Please enter a valid email address')
    })

    it('should show error when password is empty on blur', async () => {
      const passwordInput = wrapper.find('#password')
      await passwordInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Password is required')
    })

    it('should accept any non-empty password', async () => {
      const passwordInput = wrapper.find('#password')
      await passwordInput.setValue('anypassword')
      await passwordInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Password is required')
    })

    it('should clear field error on input', async () => {
      const emailInput = wrapper.find('#email')

      // Trigger error
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Email is required')

      // Start typing
      await emailInput.setValue('u')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('Email is required')
    })
  })

  describe('Form Submission', () => {
    it('should not submit form with invalid data', async () => {
      const loginSpy = vi.spyOn(authStore, 'login')

      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(loginSpy).not.toHaveBeenCalled()
    })

    it('should submit form with valid data and redirect to /cards', async () => {
      const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          accessToken: 'token',
          refreshToken: 'refresh'
        }
      })

      const pushSpy = vi.spyOn(router, 'push')

      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('password123')

      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(loginSpy).toHaveBeenCalledWith('test@example.com', 'password123')

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(pushSpy).toHaveBeenCalledWith('/cards')
    })

    it('should redirect to previous URL after login if query param exists', async () => {
      // Remount with route query parameter
      await router.push('/login?redirect=/cards/123')

      wrapper = mount(LoginView, {
        global: {
          plugins: [router]
        }
      })

      const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          accessToken: 'token',
          refreshToken: 'refresh'
        }
      })

      const pushSpy = vi.spyOn(router, 'push')

      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('password123')

      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(pushSpy).toHaveBeenCalledWith('/cards/123')
    })

    it('should display error for invalid credentials (401)', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            message: 'Invalid credentials'
          }
        }
      }

      vi.spyOn(authStore, 'login').mockRejectedValue(mockError)

      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('wrongpassword')

      await wrapper.find('form').trigger('submit.prevent')

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Invalid email or password')
    })

    it('should display API error for validation error (422)', async () => {
      const mockError = {
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: {
              email: ['The email format is invalid']
            }
          }
        }
      }

      vi.spyOn(authStore, 'login').mockRejectedValue(mockError)

      await wrapper.find('#email').setValue('invalid@example.com')
      await wrapper.find('#password').setValue('password123')

      await wrapper.find('form').trigger('submit.prevent')

      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('The email format is invalid')
    })

    it('should display generic API error for other errors', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            message: 'Server error'
          }
        }
      }

      vi.spyOn(authStore, 'login').mockRejectedValue(mockError)

      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('password123')

      await wrapper.find('form').trigger('submit.prevent')

      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Server error')
    })

    it('should disable submit button while loading', async () => {
      authStore.isLoading = true
      await wrapper.vm.$nextTick()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
      expect(submitButton.text()).toBe('Logging in...')
    })

    it('should enable submit button when not loading', async () => {
      authStore.isLoading = false
      await wrapper.vm.$nextTick()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeUndefined()
      expect(submitButton.text()).toBe('Login')
    })
  })

  describe('User Experience', () => {
    it('should clear API error when user starts typing', async () => {
      // Trigger an API error first
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      }

      vi.spyOn(authStore, 'login').mockRejectedValue(mockError)

      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('wrongpassword')
      await wrapper.find('form').trigger('submit.prevent')

      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Invalid email or password')

      // Start typing in email field
      await wrapper.find('#email').setValue('test2@example.com')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Invalid email or password')
    })
  })
})
