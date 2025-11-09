import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CardDetailView from '@/views/CardDetailView.vue'
import { useCardsStore } from '@/stores/cards'
import { cardsAPI } from '@/api/cards'

// Mock the API
vi.mock('@/api/cards', () => ({
  cardsAPI: {
    getCard: vi.fn()
  }
}))

// Mock barcode libraries
vi.mock('jsbarcode', () => ({
  default: vi.fn()
}))

vi.mock('qrcode.vue', () => ({
  default: {
    name: 'QrcodeVue',
    template: '<div class="qrcode-mock"></div>'
  }
}))

describe('CardDetailView', () => {
  let pinia
  let router
  let cardsStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    cardsStore = useCardsStore()

    // Create router with mock routes
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/cards/:id',
          name: 'card-detail',
          component: CardDetailView
        },
        {
          path: '/cards',
          name: 'cards',
          component: { template: '<div>Cards List</div>' }
        },
        {
          path: '/cards/:id/edit',
          name: 'edit-card',
          component: { template: '<div>Edit Card</div>' }
        }
      ]
    })

    // Reset mocks
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should show loading state while fetching card', async () => {
      // Set the store to loading state manually
      cardsStore.isLoading = true

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

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

      await router.push('/cards/non-existent')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.find('.error-state h2').text()).toBe('Card Not Found')
      expect(wrapper.find('.error-state p').text()).toContain('Card not found')
    })

    it('should show card details when loaded successfully', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890123',
        cardName: 'My Loyalty Card',
        barcodeType: 'EAN13',
        barcodeData: '1234567890123',
        storeId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: {
          data: mockCard
        }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.loading-state').exists()).toBe(false)
      expect(wrapper.find('.error-state').exists()).toBe(false)
      expect(wrapper.find('.card-detail').exists()).toBe(true)
    })
  })

  describe('Card Information Display', () => {
    it('should display card name when provided', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890123',
        cardName: 'My Loyalty Card',
        barcodeType: 'EAN13',
        barcodeData: '1234567890123',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.card-header h1').text()).toBe('My Loyalty Card')
    })

    it('should display "Unnamed Card" when cardName is null', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890123',
        cardName: null,
        barcodeType: 'EAN13',
        barcodeData: '1234567890123',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.card-header h1').text()).toBe('Unnamed Card')
    })

    it('should display all card information fields', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890123',
        cardName: 'Test Card',
        barcodeType: 'EAN13',
        barcodeData: '1234567890123',
        storeId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      const infoValues = wrapper.findAll('.info-value')

      expect(infoValues[0].text()).toBe('1234567890123')
      expect(infoValues[1].text()).toBe('EAN13')
      expect(infoValues[2].text()).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('should display "Not specified" when storeId is null', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890123',
        cardName: 'Test Card',
        barcodeType: 'EAN13',
        barcodeData: '1234567890123',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      const infoValues = wrapper.findAll('.info-value')
      expect(infoValues[2].text()).toBe('Not specified')
    })

    it('should format timestamps as readable dates', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890123',
        cardName: 'Test Card',
        barcodeType: 'EAN13',
        barcodeData: '1234567890123',
        storeId: null,
        createdAt: 1735732800, // January 1, 2025, 12:00:00
        updatedAt: 1735819200 // January 2, 2025, 12:00:00
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      const infoValues = wrapper.findAll('.info-value')

      // Check that the dates are formatted (not just the timestamp)
      expect(infoValues[3].text()).not.toBe('1735732800')
      expect(infoValues[4].text()).not.toBe('1735819200')

      // Check that the dates contain expected parts (month, day, year)
      expect(infoValues[3].text()).toMatch(/2025/)
      expect(infoValues[4].text()).toMatch(/2025/)
    })
  })

  describe('Barcode Display', () => {
    it('should render QR code for QR barcode type', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890123',
        cardName: 'Test Card',
        barcodeType: 'QR',
        barcodeData: '1234567890123',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.qr-display').exists()).toBe(true)
    })

    it('should render linear barcode for EAN13 type', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890123',
        cardName: 'Test Card',
        barcodeType: 'EAN13',
        barcodeData: '1234567890123',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.linear-display').exists()).toBe(true)
      expect(wrapper.find('.linear-display svg').exists()).toBe(true)
    })

    it('should render linear barcode for EAN8 type', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567',
        cardName: 'Test Card',
        barcodeType: 'EAN8',
        barcodeData: '1234567',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.linear-display').exists()).toBe(true)
    })

    it('should render linear barcode for CODE128 type', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: 'ABC123',
        cardName: 'Test Card',
        barcodeType: 'CODE128',
        barcodeData: 'ABC123',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.linear-display').exists()).toBe(true)
    })

    it('should show fallback display for AZTEC barcode type', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890',
        cardName: 'Test Card',
        barcodeType: 'AZTEC',
        barcodeData: '1234567890',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.fallback-display').exists()).toBe(true)
      expect(wrapper.find('.fallback-text').text()).toBe('1234567890')
      expect(wrapper.find('.fallback-info').text()).toContain('AZTEC')
    })

    it('should show fallback display for PDF417 barcode type', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890',
        cardName: 'Test Card',
        barcodeType: 'PDF417',
        barcodeData: '1234567890',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.fallback-display').exists()).toBe(true)
      expect(wrapper.find('.fallback-text').text()).toBe('1234567890')
      expect(wrapper.find('.fallback-info').text()).toContain('PDF417')
    })
  })

  describe('Navigation', () => {
    it('should navigate back to cards list when back button is clicked', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890123',
        cardName: 'Test Card',
        barcodeType: 'EAN13',
        barcodeData: '1234567890123',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      const backButton = wrapper.find('.back-button-small')
      await backButton.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/cards')
    })

    it('should navigate to edit page when edit button is clicked', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890123',
        cardName: 'Test Card',
        barcodeType: 'EAN13',
        barcodeData: '1234567890123',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      const editButton = wrapper.find('.edit-button')
      await editButton.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/cards/card-123/edit')
    })

    it('should have delete button (functionality pending US-6.1)', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890123',
        cardName: 'Test Card',
        barcodeType: 'EAN13',
        barcodeData: '1234567890123',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.delete-button').exists()).toBe(true)
    })

    it('should navigate back to cards list from error state', async () => {
      const error404 = {
        response: {
          status: 404,
          data: {
            message: 'Card not found'
          }
        }
      }

      cardsAPI.getCard.mockRejectedValue(error404)

      await router.push('/cards/non-existent')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      const backButton = wrapper.find('.error-state .back-button')
      await backButton.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/cards')
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 error gracefully', async () => {
      const error404 = {
        response: {
          status: 404,
          data: {
            message: 'Card not found or belongs to another user'
          }
        }
      }

      cardsAPI.getCard.mockRejectedValue(error404)

      await router.push('/cards/non-existent')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.find('.error-icon').text()).toBe('⚠️')
      expect(wrapper.find('.error-state h2').text()).toBe('Card Not Found')
    })

    it('should handle generic API errors', async () => {
      const genericError = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error'
          }
        }
      }

      cardsAPI.getCard.mockRejectedValue(genericError)

      await router.push('/cards/card-123')
      const wrapper = mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.find('.error-state p').text()).toContain('Internal server error')
    })

    it('should call clearCurrentCard and clearError on mount', async () => {
      const clearCurrentCardSpy = vi.spyOn(cardsStore, 'clearCurrentCard')
      const clearErrorSpy = vi.spyOn(cardsStore, 'clearError')

      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890123',
        cardName: 'Test Card',
        barcodeType: 'EAN13',
        barcodeData: '1234567890123',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      expect(clearCurrentCardSpy).toHaveBeenCalled()
      expect(clearErrorSpy).toHaveBeenCalled()
    })
  })

  describe('API Integration', () => {
    it('should call cardsAPI.getCard with correct card ID', async () => {
      const mockCard = {
        id: 'card-abc-123',
        cardNumber: '1234567890123',
        cardName: 'Test Card',
        barcodeType: 'EAN13',
        barcodeData: '1234567890123',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-abc-123')
      mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(cardsAPI.getCard).toHaveBeenCalledWith('card-abc-123')
    })

    it('should update store currentCard after successful fetch', async () => {
      const mockCard = {
        id: 'card-123',
        cardNumber: '1234567890123',
        cardName: 'Test Card',
        barcodeType: 'EAN13',
        barcodeData: '1234567890123',
        storeId: null,
        createdAt: 1735732800,
        updatedAt: 1735732800
      }

      cardsAPI.getCard.mockResolvedValue({
        data: { data: mockCard }
      })

      await router.push('/cards/card-123')
      mount(CardDetailView, {
        global: {
          plugins: [pinia, router]
        }
      })

      await flushPromises()

      expect(cardsStore.currentCard).toEqual(mockCard)
    })
  })
})
