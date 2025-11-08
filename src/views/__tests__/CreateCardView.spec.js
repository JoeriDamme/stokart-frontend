import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CreateCardView from '../CreateCardView.vue'
import { useCardsStore } from '@/stores/cards'
import { cardsAPI } from '@/api/cards'

// Mock the barcode libraries
vi.mock('jsbarcode', () => ({
  default: vi.fn()
}))

vi.mock('qrcode.vue', () => ({
  default: {
    name: 'QrcodeVue',
    props: ['value', 'size', 'level'],
    template: '<div class="qrcode-mock">QR Code</div>'
  }
}))

// Mock the cards API
vi.mock('@/api/cards', () => ({
  cardsAPI: {
    createCard: vi.fn()
  }
}))

describe('CreateCardView - US-3.1: Create New Card', () => {
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
        { path: '/cards/new', component: CreateCardView },
        { path: '/cards', component: { template: '<div>Cards List</div>' } }
      ]
    })

    // Clear all mocks
    vi.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('should render the card creation form with all required fields', () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Check header
      expect(wrapper.find('h1').text()).toBe('Add New Card')
      expect(wrapper.find('.cancel-button').exists()).toBe(true)

      // Check form fields
      expect(wrapper.find('#cardNumber').exists()).toBe(true)
      expect(wrapper.find('#cardName').exists()).toBe(true)
      expect(wrapper.find('#barcodeType').exists()).toBe(true)
      expect(wrapper.find('#storeId').exists()).toBe(true)

      // Check submit button
      expect(wrapper.find('.submit-button').exists()).toBe(true)
      expect(wrapper.find('.submit-button').text()).toBe('Create Card')
    })

    it('should display all barcode type options in dropdown', () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const barcodeTypeSelect = wrapper.find('#barcodeType')
      const options = barcodeTypeSelect.findAll('option')

      expect(options.length).toBe(7) // 1 placeholder + 6 barcode types
      expect(options[1].text()).toContain('EAN8')
      expect(options[2].text()).toContain('EAN13')
      expect(options[3].text()).toContain('CODE128')
      expect(options[4].text()).toContain('QR')
      expect(options[5].text()).toContain('AZTEC')
      expect(options[6].text()).toContain('PDF417')
    })

    it('should show required asterisk for required fields', () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const labels = wrapper.findAll('label')
      const cardNumberLabel = labels.find(l => l.text().includes('Card Number'))
      const barcodeTypeLabel = labels.find(l => l.text().includes('Barcode Type'))

      expect(cardNumberLabel.find('.required').exists()).toBe(true)
      expect(barcodeTypeLabel.find('.required').exists()).toBe(true)
    })
  })

  describe('Client-Side Validation', () => {
    it('should show error when card number is empty', async () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardNumberInput = wrapper.find('#cardNumber')
      await cardNumberInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.error-message').text()).toBe('Card number is required')
    })

    it('should validate EAN8 format (7-8 digits)', async () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const barcodeTypeSelect = wrapper.find('#barcodeType')
      await barcodeTypeSelect.setValue('EAN8')

      const cardNumberInput = wrapper.find('#cardNumber')

      // Test invalid format
      await cardNumberInput.setValue('12345')
      await cardNumberInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('EAN8 must be 7-8 digits only')

      // Test valid format
      await cardNumberInput.setValue('1234567')
      await cardNumberInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('EAN8 must be 7-8 digits only')
    })

    it('should validate EAN13 format (12-13 digits)', async () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const barcodeTypeSelect = wrapper.find('#barcodeType')
      await barcodeTypeSelect.setValue('EAN13')

      const cardNumberInput = wrapper.find('#cardNumber')

      // Test invalid format
      await cardNumberInput.setValue('12345')
      await cardNumberInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('EAN13 must be 12-13 digits only')

      // Test valid format
      await cardNumberInput.setValue('123456789012')
      await cardNumberInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('EAN13 must be 12-13 digits only')
    })

    it('should validate CODE128 format (ASCII characters)', async () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const barcodeTypeSelect = wrapper.find('#barcodeType')
      await barcodeTypeSelect.setValue('CODE128')

      const cardNumberInput = wrapper.find('#cardNumber')

      // Test valid ASCII
      await cardNumberInput.setValue('ABC123-XYZ')
      await cardNumberInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('CODE128 must contain only ASCII characters')
    })

    it('should show error when barcode type is not selected', async () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const barcodeTypeSelect = wrapper.find('#barcodeType')
      await barcodeTypeSelect.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Barcode type is required')
    })

    it('should validate store ID UUID v4 format', async () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const storeIdInput = wrapper.find('#storeId')

      // Test invalid UUID
      await storeIdInput.setValue('invalid-uuid')
      await storeIdInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Must be a valid UUID v4 format')

      // Test valid UUID v4
      await storeIdInput.setValue('550e8400-e29b-41d4-a716-446655440000')
      await storeIdInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('Must be a valid UUID v4 format')
    })

    it('should allow empty store ID (optional field)', async () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const storeIdInput = wrapper.find('#storeId')
      await storeIdInput.setValue('')
      await storeIdInput.trigger('blur')
      await wrapper.vm.$nextTick()

      // Should not show any error for empty store ID
      const errorMessages = wrapper.findAll('.error-message')
      const storeIdError = errorMessages.find(el => el.text().includes('UUID'))
      expect(storeIdError).toBeUndefined()
    })

    it('should clear field error when user starts typing', async () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardNumberInput = wrapper.find('#cardNumber')

      // Trigger error
      await cardNumberInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Card number is required')

      // Start typing
      await cardNumberInput.setValue('123')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('Card number is required')
    })
  })

  describe('Barcode Preview', () => {
    it('should not show preview when card number or barcode type is missing', () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      expect(wrapper.find('.barcode-preview-section').exists()).toBe(false)
    })

    it('should show preview when both card number and barcode type are provided', async () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await wrapper.find('#cardNumber').setValue('1234567')
      await wrapper.find('#barcodeType').setValue('EAN8')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.barcode-preview-section').exists()).toBe(true)
      expect(wrapper.find('h3').text()).toBe('Barcode Preview')
    })

    it('should update preview when card number changes', async () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await wrapper.find('#cardNumber').setValue('1234567')
      await wrapper.find('#barcodeType').setValue('EAN8')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.barcode-preview-section').exists()).toBe(true)

      // Change card number
      await wrapper.find('#cardNumber').setValue('7654321')
      await wrapper.vm.$nextTick()

      // Preview should still be visible
      expect(wrapper.find('.barcode-preview-section').exists()).toBe(true)
    })

    it('should show fallback preview for AZTEC and PDF417', async () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await wrapper.find('#cardNumber').setValue('TEST123')
      await wrapper.find('#barcodeType').setValue('AZTEC')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.fallback-preview').exists()).toBe(true)
      expect(wrapper.find('.fallback-text').text()).toBe('TEST123')
      expect(wrapper.find('.fallback-info').text()).toContain('AZTEC')
    })
  })

  describe('Form Submission', () => {
    it('should successfully create card with valid data', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'card-123',
            cardNumber: '1234567890123',
            cardName: 'My Store Card',
            barcodeType: 'EAN13',
            barcodeData: '1234567890123',
            storeId: null,
            createdAt: 1735732800,
            updatedAt: 1735732800
          }
        }
      }

      cardsAPI.createCard.mockResolvedValue(mockResponse)

      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Fill in form
      await wrapper.find('#cardNumber').setValue('1234567890123')
      await wrapper.find('#cardName').setValue('My Store Card')
      await wrapper.find('#barcodeType').setValue('EAN13')

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Verify API was called with correct data
      expect(cardsAPI.createCard).toHaveBeenCalledWith({
        cardNumber: '1234567890123',
        cardName: 'My Store Card',
        barcodeType: 'EAN13',
        storeId: null
      })

      // Verify redirect to cards list
      expect(router.currentRoute.value.path).toBe('/cards')
    })

    it('should create card with only required fields', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'card-456',
            cardNumber: '1234567',
            cardName: null,
            barcodeType: 'EAN8',
            barcodeData: '1234567',
            storeId: null,
            createdAt: 1735732800,
            updatedAt: 1735732800
          }
        }
      }

      cardsAPI.createCard.mockResolvedValue(mockResponse)

      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Fill in only required fields
      await wrapper.find('#cardNumber').setValue('1234567')
      await wrapper.find('#barcodeType').setValue('EAN8')

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Verify API was called with null for optional fields
      expect(cardsAPI.createCard).toHaveBeenCalledWith({
        cardNumber: '1234567',
        cardName: null,
        barcodeType: 'EAN8',
        storeId: null
      })
    })

    it('should include storeId when provided', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'card-789',
            cardNumber: '1234567890123',
            cardName: 'Store Card',
            barcodeType: 'EAN13',
            barcodeData: '1234567890123',
            storeId: '550e8400-e29b-41d4-a716-446655440000',
            createdAt: 1735732800,
            updatedAt: 1735732800
          }
        }
      }

      cardsAPI.createCard.mockResolvedValue(mockResponse)

      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Fill in all fields
      await wrapper.find('#cardNumber').setValue('1234567890123')
      await wrapper.find('#cardName').setValue('Store Card')
      await wrapper.find('#barcodeType').setValue('EAN13')
      await wrapper.find('#storeId').setValue('550e8400-e29b-41d4-a716-446655440000')

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Verify API was called with storeId
      expect(cardsAPI.createCard).toHaveBeenCalledWith({
        cardNumber: '1234567890123',
        cardName: 'Store Card',
        barcodeType: 'EAN13',
        storeId: '550e8400-e29b-41d4-a716-446655440000'
      })
    })

    it('should disable submit button while loading', async () => {
      cardsAPI.createCard.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await wrapper.find('#cardNumber').setValue('1234567')
      await wrapper.find('#barcodeType').setValue('EAN8')

      const submitButton = wrapper.find('.submit-button')
      expect(submitButton.attributes('disabled')).toBeUndefined()

      // Submit form
      wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      // Button should be disabled
      expect(submitButton.attributes('disabled')).toBeDefined()
      expect(submitButton.text()).toBe('Creating Card...')
    })

    it('should not submit if validation fails', async () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Try to submit without filling required fields
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // API should not be called
      expect(cardsAPI.createCard).not.toHaveBeenCalled()

      // Errors should be shown
      expect(wrapper.text()).toContain('Card number is required')
      expect(wrapper.text()).toContain('Barcode type is required')
    })
  })

  describe('Error Handling', () => {
    it('should display API validation errors (422)', async () => {
      const mockError = {
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: {
              cardNumber: ['Invalid card number format']
            }
          }
        }
      }

      cardsAPI.createCard.mockRejectedValue(mockError)

      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await wrapper.find('#cardNumber').setValue('1234567')
      await wrapper.find('#barcodeType').setValue('EAN8')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Field error should be displayed
      expect(wrapper.text()).toContain('Invalid card number format')
    })

    it('should display duplicate card error (409)', async () => {
      const mockError = {
        response: {
          status: 409,
          data: {
            message: 'Card already exists'
          }
        }
      }

      cardsAPI.createCard.mockRejectedValue(mockError)

      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await wrapper.find('#cardNumber').setValue('1234567')
      await wrapper.find('#barcodeType').setValue('EAN8')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Duplicate error message should be displayed
      expect(wrapper.find('.api-error').exists()).toBe(true)
      expect(wrapper.find('.api-error').text()).toContain('already exists')
    })

    it('should display generic error for other failures', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error'
          }
        }
      }

      cardsAPI.createCard.mockRejectedValue(mockError)

      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await wrapper.find('#cardNumber').setValue('1234567')
      await wrapper.find('#barcodeType').setValue('EAN8')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Generic error message should be displayed
      expect(wrapper.find('.api-error').exists()).toBe(true)
      expect(wrapper.find('.api-error').text()).toContain('Internal server error')
    })
  })

  describe('Navigation', () => {
    it('should navigate back to cards list when cancel button is clicked', async () => {
      const wrapper = mount(CreateCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cancelButton = wrapper.find('.cancel-button')
      await cancelButton.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/cards')
    })
  })
})
