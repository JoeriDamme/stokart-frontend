import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import EditCardView from '../EditCardView.vue'
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
    getCard: vi.fn(),
    updateCard: vi.fn()
  }
}))

describe('EditCardView - US-5.1: Edit Existing Card', () => {
  let router
  let pinia
  let cardsStore

  const mockCard = {
    id: 'card-123',
    cardNumber: '1234567890123',
    cardName: 'My Store Card',
    barcodeType: 'EAN13',
    barcodeData: '1234567890123',
    storeId: '550e8400-e29b-41d4-a716-446655440000',
    createdAt: 1735732800,
    updatedAt: 1735732800
  }

  beforeEach(() => {
    // Create fresh pinia instance
    pinia = createPinia()
    setActivePinia(pinia)
    cardsStore = useCardsStore()

    // Create router
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/cards/:id/edit', name: 'edit-card', component: EditCardView },
        { path: '/cards/:id', name: 'card-detail', component: { template: '<div>Card Detail</div>' } },
        { path: '/cards', name: 'cards', component: { template: '<div>Cards List</div>' } }
      ]
    })

    // Clear all mocks
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should show loading state while fetching card', async () => {
      // Don't resolve the promise yet
      cardsAPI.getCard.mockImplementation(() => new Promise(() => {}))

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.loading-state').exists()).toBe(true)
      expect(wrapper.find('.loading-state').text()).toContain('Loading card details')
    })

    it('should show error state when card not found (404)', async () => {
      const error404 = {
        response: {
          status: 404,
          data: {
            message: 'Card not found'
          }
        }
      }

      cardsAPI.getCard.mockRejectedValue(error404)

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.find('.error-state h2').text()).toBe('Card Not Found')
      expect(wrapper.find('.error-state p').text()).toContain('Card not found')
    })

    it('should render edit form with pre-filled data', async () => {
      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Check header
      expect(wrapper.find('h1').text()).toBe('Edit Card')
      expect(wrapper.find('.cancel-button').exists()).toBe(true)

      // Check form is rendered
      expect(wrapper.find('.card-form').exists()).toBe(true)

      // Check fields are pre-filled
      expect(wrapper.find('#cardNumber').element.value).toBe(mockCard.cardNumber)
      expect(wrapper.find('#cardName').element.value).toBe(mockCard.cardName)
      expect(wrapper.find('#barcodeType').element.value).toBe(mockCard.barcodeType)
      expect(wrapper.find('#storeId').element.value).toBe(mockCard.storeId)

      // Check submit button
      expect(wrapper.find('.submit-button').text()).toBe('Update Card')
    })

    it('should pre-fill form with empty strings for null optional fields', async () => {
      const cardWithNulls = {
        ...mockCard,
        cardName: null,
        storeId: null
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: cardWithNulls }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('#cardName').element.value).toBe('')
      expect(wrapper.find('#storeId').element.value).toBe('')
    })
  })

  describe('Form Validation', () => {
    it('should validate required card number field', async () => {
      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Clear card number
      await wrapper.find('#cardNumber').setValue('')
      await wrapper.find('#cardNumber').trigger('blur')

      expect(wrapper.find('.error-message').text()).toContain('Card number is required')
    })

    it('should validate EAN13 format', async () => {
      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Set invalid EAN13
      await wrapper.find('#cardNumber').setValue('123')
      await wrapper.find('#cardNumber').trigger('blur')

      expect(wrapper.find('.error-message').text()).toContain('EAN13 must be 12-13 digits only')
    })

    it('should validate UUID v4 format for storeId', async () => {
      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Set invalid UUID
      await wrapper.find('#storeId').setValue('not-a-uuid')
      await wrapper.find('#storeId').trigger('blur')

      expect(wrapper.find('.error-message').text()).toContain('Must be a valid UUID v4 format')
    })

    it('should accept empty storeId (optional field)', async () => {
      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Clear storeId
      await wrapper.find('#storeId').setValue('')
      await wrapper.find('#storeId').trigger('blur')

      // Should not show error
      const storeIdErrors = wrapper.findAll('.error-message').filter(
        el => el.element.previousElementSibling?.id === 'storeId'
      )
      expect(storeIdErrors.length).toBe(0)
    })
  })

  describe('Form Submission', () => {
    it('should successfully update card and redirect to detail view', async () => {
      const updatedCard = {
        ...mockCard,
        cardNumber: '9876543210987',
        cardName: 'Updated Card Name',
        updatedAt: 1735819200
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      cardsAPI.updateCard.mockResolvedValue({
        data: { data: updatedCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Update form fields
      await wrapper.find('#cardNumber').setValue('9876543210987')
      await wrapper.find('#cardName').setValue('Updated Card Name')

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Check API was called with correct data
      expect(cardsAPI.updateCard).toHaveBeenCalledWith('card-123', {
        cardNumber: '9876543210987',
        cardName: 'Updated Card Name',
        barcodeType: 'EAN13',
        storeId: '550e8400-e29b-41d4-a716-446655440000'
      })

      // Check redirect to detail view
      expect(router.currentRoute.value.path).toBe('/cards/card-123')
    })

    it('should convert empty strings to null for optional fields', async () => {
      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      cardsAPI.updateCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Clear optional fields
      await wrapper.find('#cardName').setValue('')
      await wrapper.find('#storeId').setValue('')

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Check that empty strings were converted to null
      expect(cardsAPI.updateCard).toHaveBeenCalledWith('card-123', {
        cardNumber: '1234567890123',
        cardName: null,
        barcodeType: 'EAN13',
        storeId: null
      })
    })

    it('should not submit form if validation fails', async () => {
      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Set invalid data
      await wrapper.find('#cardNumber').setValue('')

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // API should not be called
      expect(cardsAPI.updateCard).not.toHaveBeenCalled()
    })

    it('should disable submit button while submitting', async () => {
      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      // Make updateCard hang to test loading state
      cardsAPI.updateCard.mockImplementation(() => new Promise(() => {}))

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Button should be disabled and show loading text
      const submitButton = wrapper.find('.submit-button')
      expect(submitButton.attributes('disabled')).toBeDefined()
      expect(submitButton.text()).toBe('Updating Card...')
    })
  })

  describe('Error Handling', () => {
    it('should display validation errors from API (422)', async () => {
      const validationError = {
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: {
              cardNumber: ['EAN13 must be 12-13 digits only']
            }
          }
        }
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      cardsAPI.updateCard.mockRejectedValue(validationError)

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Check error is displayed
      expect(wrapper.find('.error-message').text()).toContain('EAN13 must be 12-13 digits only')
    })

    it('should display duplicate card error (409)', async () => {
      const duplicateError = {
        response: {
          status: 409,
          data: {
            message: 'Duplicate card found'
          }
        }
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      cardsAPI.updateCard.mockRejectedValue(duplicateError)

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Check error is displayed
      expect(wrapper.find('.api-error').text()).toContain('A card with this number already exists')
    })

    it('should display not found error (404)', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: {
            message: 'Card not found'
          }
        }
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      cardsAPI.updateCard.mockRejectedValue(notFoundError)

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Check error is displayed
      expect(wrapper.find('.api-error').text()).toContain('Card not found')
    })

    it('should display generic error for other failures', async () => {
      const genericError = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error'
          }
        }
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      cardsAPI.updateCard.mockRejectedValue(genericError)

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Check error is displayed (shows error from response data)
      expect(wrapper.find('.api-error').text()).toContain('Internal server error')
    })
  })

  describe('Navigation', () => {
    it('should navigate back to card detail when cancel is clicked', async () => {
      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Click cancel button
      await wrapper.find('.cancel-button').trigger('click')
      await flushPromises()

      // Should navigate back to detail view
      expect(router.currentRoute.value.path).toBe('/cards/card-123')
    })

    it('should not make API calls when cancel is clicked', async () => {
      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Make changes to the form
      await wrapper.find('#cardName').setValue('Changed Name')
      await wrapper.find('#cardNumber').setValue('9999999999999')

      // Click cancel button
      await wrapper.find('.cancel-button').trigger('click')
      await flushPromises()

      // Should NOT call updateCard API
      expect(cardsAPI.updateCard).not.toHaveBeenCalled()
    })

    it('should discard all changes when cancel is clicked', async () => {
      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Original card data should be in store
      expect(cardsStore.currentCard.cardName).toBe('My Store Card')

      // Make changes to the form
      await wrapper.find('#cardName').setValue('Changed Name')
      await wrapper.find('#cardNumber').setValue('9999999999999')

      // Click cancel button
      await wrapper.find('.cancel-button').trigger('click')
      await flushPromises()

      // Store should still have original data (not changed)
      expect(cardsStore.currentCard.cardName).toBe('My Store Card')
    })

    it('should navigate to cards list from error state', async () => {
      const error404 = {
        response: {
          status: 404,
          data: {
            message: 'Card not found'
          }
        }
      }

      cardsAPI.getCard.mockRejectedValue(error404)

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Click back button
      await wrapper.find('.back-button').trigger('click')
      await flushPromises()

      // Should navigate to cards list
      expect(router.currentRoute.value.path).toBe('/cards')
    })
  })

  describe('Barcode Preview', () => {
    it('should show barcode preview when card number and type are filled', async () => {
      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Barcode preview should be visible
      expect(wrapper.find('.barcode-preview-section').exists()).toBe(true)
    })

    it('should update preview when card number changes', async () => {
      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Change card number
      await wrapper.find('#cardNumber').setValue('9876543210987')
      await flushPromises()

      // Preview should still be visible
      expect(wrapper.find('.barcode-preview-section').exists()).toBe(true)
    })

    it('should show QR preview for QR barcode type', async () => {
      const qrCard = {
        ...mockCard,
        barcodeType: 'QR'
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: qrCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.qr-preview').exists()).toBe(true)
    })
  })

  describe('Store Integration', () => {
    it('should call fetchCard on mount', async () => {
      const fetchCardSpy = vi.spyOn(cardsStore, 'fetchCard')

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123/edit')
      mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(fetchCardSpy).toHaveBeenCalledWith('card-123')
    })

    it('should update card in store on successful edit', async () => {
      const updatedCard = {
        ...mockCard,
        cardName: 'Updated Name'
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      cardsAPI.updateCard.mockResolvedValue({
        data: { data: updatedCard }
      })

      await router.push('/cards/card-123/edit')
      const wrapper = mount(EditCardView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      // Update and submit
      await wrapper.find('#cardName').setValue('Updated Name')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Check store was updated
      expect(cardsStore.currentCard.cardName).toBe('Updated Name')
    })
  })
})
