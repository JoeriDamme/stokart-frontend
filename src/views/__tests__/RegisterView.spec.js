import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import RegisterView from '../RegisterView.vue'
import { useAuthStore } from '@/stores/auth'

// Mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/register', component: RegisterView },
    { path: '/login', component: { template: '<div>Login</div>' } },
    { path: '/cards', component: { template: '<div>Cards</div>' } }
  ]
})

describe('RegisterView', () => {
  let wrapper
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()

    wrapper = mount(RegisterView, {
      global: {
        plugins: [router]
      }
    })
  })

  describe('Form Rendering', () => {
    it('should render registration form with all fields', () => {
      expect(wrapper.find('h1').text()).toBe('Create Account')
      expect(wrapper.find('#name').exists()).toBe(true)
      expect(wrapper.find('#email').exists()).toBe(true)
      expect(wrapper.find('#password').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('should have a link to login page', () => {
      const loginLink = wrapper.find('a[href="/login"]')
      expect(loginLink.exists()).toBe(true)
      expect(loginLink.text()).toBe('Login here')
    })
  })

  describe('Form Validation', () => {
    it('should show error when name is empty on blur', async () => {
      const nameInput = wrapper.find('#name')
      await nameInput.trigger('blur')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Name is required')
    })

    it('should show error for invalid email format', async () => {
      const emailInput = wrapper.find('#email')
      await emailInput.setValue('invalid-email')
      await emailInput.trigger('blur')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Please enter a valid email address')
    })

    it('should show error when email is empty', async () => {
      const emailInput = wrapper.find('#email')
      await emailInput.trigger('blur')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Email is required')
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

    it('should show error when password is too short', async () => {
      const passwordInput = wrapper.find('#password')
      await passwordInput.setValue('Short1')
      await passwordInput.trigger('blur')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Password must be at least 8 characters')
    })

    it('should show error when password lacks uppercase', async () => {
      const passwordInput = wrapper.find('#password')
      await passwordInput.setValue('lowercase123')
      await passwordInput.trigger('blur')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Password must contain uppercase, lowercase, and number')
    })

    it('should show error when password lacks lowercase', async () => {
      const passwordInput = wrapper.find('#password')
      await passwordInput.setValue('UPPERCASE123')
      await passwordInput.trigger('blur')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Password must contain uppercase, lowercase, and number')
    })

    it('should show error when password lacks number', async () => {
      const passwordInput = wrapper.find('#password')
      await passwordInput.setValue('NoNumbers')
      await passwordInput.trigger('blur')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Password must contain uppercase, lowercase, and number')
    })

    it('should accept valid password', async () => {
      const passwordInput = wrapper.find('#password')
      await passwordInput.setValue('ValidPass123')
      await passwordInput.trigger('blur')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Password must')
    })

    it('should clear field error on input', async () => {
      const nameInput = wrapper.find('#name')

      // Trigger error
      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Name is required')

      // Start typing
      await nameInput.setValue('J')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('Name is required')
    })
  })

  describe('Form Submission', () => {
    it('should not submit form with invalid data', async () => {
      const registerSpy = vi.spyOn(authStore, 'register')

      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(registerSpy).not.toHaveBeenCalled()
    })

    it('should submit form with valid data', async () => {
      const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          accessToken: 'token',
          refreshToken: 'refresh'
        }
      })

      const pushSpy = vi.spyOn(router, 'push')

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('SecurePass123')

      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(registerSpy).toHaveBeenCalledWith('John Doe', 'test@example.com', 'SecurePass123')

      // Wait for the async operation
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(pushSpy).toHaveBeenCalledWith('/cards')
    })

    it('should display API error for duplicate email (409)', async () => {
      const mockError = {
        response: {
          status: 409,
          data: {
            message: 'Email already exists'
          }
        }
      }

      vi.spyOn(authStore, 'register').mockRejectedValue(mockError)

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('existing@example.com')
      await wrapper.find('#password').setValue('SecurePass123')

      await wrapper.find('form').trigger('submit.prevent')

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('An account with this email already exists')
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

      vi.spyOn(authStore, 'register').mockRejectedValue(mockError)

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('invalid@example.com')
      await wrapper.find('#password').setValue('SecurePass123')

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

      vi.spyOn(authStore, 'register').mockRejectedValue(mockError)

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('SecurePass123')

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
      expect(submitButton.text()).toBe('Creating Account...')
    })

    it('should enable submit button when not loading', async () => {
      authStore.isLoading = false
      await wrapper.vm.$nextTick()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeUndefined()
      expect(submitButton.text()).toBe('Create Account')
    })
  })

  describe('Password Requirements Display', () => {
    it('should show password requirements help text', () => {
      expect(wrapper.text()).toContain('Must be at least 8 characters with uppercase, lowercase, and number')
    })
  })
})
