import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CardsView from '../CardsView.vue'
import { useAuthStore } from '@/stores/auth'
import { useCardsStore } from '@/stores/cards'

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

  describe('US-2.1: View All Cards', () => {
    beforeEach(() => {
      // Set up authenticated user for all tests
      localStorage.setItem('userId', 'user-123')
      localStorage.setItem('userEmail', 'test@example.com')
      localStorage.setItem('accessToken', 'test-token')
      localStorage.setItem('refreshToken', 'refresh-token')
    })

    it('should display loading spinner while fetching cards', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = true

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.loading-container').exists()).toBe(true)
      expect(wrapper.find('.spinner').exists()).toBe(true)
      expect(wrapper.text()).toContain('Loading your cards...')
    })

    it('should display empty state when user has no cards', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = []
      cardsStore.pagination = { total: 0, currentPage: 1, lastPage: 1, perPage: 20 }

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('No cards yet')
      expect(wrapper.text()).toContain('Start adding your loyalty cards')
      expect(wrapper.find('.add-card-button-large').exists()).toBe(true)
    })

    it('should display cards in a grid when cards are available', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        {
          id: 'card-1',
          cardName: 'Supermarket Card',
          cardNumber: '1234567890123',
          barcodeType: 'EAN13'
        },
        {
          id: 'card-2',
          cardName: null,
          cardNumber: '9876543210',
          barcodeType: 'CODE128'
        }
      ]
      cardsStore.pagination = { total: 2, currentPage: 1, lastPage: 1, perPage: 20 }

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.cards-grid').exists()).toBe(true)
      expect(wrapper.findAll('.card-item').length).toBe(2)

      // Check first card
      const firstCard = wrapper.findAll('.card-item')[0]
      expect(firstCard.find('.card-name').text()).toBe('Supermarket Card')
      expect(firstCard.find('.card-number').text()).toBe('1234567890123')
      expect(firstCard.find('.card-barcode-type').text()).toBe('EAN13')

      // Check second card (unnamed)
      const secondCard = wrapper.findAll('.card-item')[1]
      expect(secondCard.find('.card-name').text()).toBe('Unnamed Card')
      expect(secondCard.find('.card-number').text()).toBe('9876543210')
    })

    it('should display quick action buttons on each card', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        {
          id: 'card-1',
          cardName: 'Test Card',
          cardNumber: '1234567890',
          barcodeType: 'EAN13'
        }
      ]
      cardsStore.pagination = { total: 1, currentPage: 1, lastPage: 1, perPage: 20 }

      await wrapper.vm.$nextTick()

      const cardItem = wrapper.find('.card-item')
      expect(cardItem.find('.view-button').exists()).toBe(true)
      expect(cardItem.find('.edit-button').exists()).toBe(true)
      expect(cardItem.find('.delete-button').exists()).toBe(true)
    })

    it('should show total cards count', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        { id: 'card-1', cardName: 'Card 1', cardNumber: '123', barcodeType: 'EAN13' },
        { id: 'card-2', cardName: 'Card 2', cardNumber: '456', barcodeType: 'EAN13' }
      ]
      cardsStore.pagination = { total: 45, currentPage: 1, lastPage: 3, perPage: 20 }

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.cards-count').text()).toBe('45 cards')
    })
  })

  describe('US-2.2: Pagination', () => {
    beforeEach(() => {
      // Set up authenticated user for all tests
      localStorage.setItem('userId', 'user-123')
      localStorage.setItem('userEmail', 'test@example.com')
      localStorage.setItem('accessToken', 'test-token')
      localStorage.setItem('refreshToken', 'refresh-token')
    })

    it('should display pagination controls when cards are available', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        { id: 'card-1', cardName: 'Card 1', cardNumber: '123', barcodeType: 'EAN13' }
      ]
      cardsStore.pagination = { total: 45, currentPage: 1, lastPage: 3, perPage: 20 }

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.pagination-container').exists()).toBe(true)
      expect(wrapper.find('.pagination-controls').exists()).toBe(true)
    })

    it('should show current page and total pages', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        { id: 'card-1', cardName: 'Card 1', cardNumber: '123', barcodeType: 'EAN13' }
      ]
      cardsStore.pagination = { total: 45, currentPage: 2, lastPage: 3, perPage: 20 }

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.pagination-info').text()).toContain('Page 2 of 3')
    })

    it('should display page size selector with options', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        { id: 'card-1', cardName: 'Card 1', cardNumber: '123', barcodeType: 'EAN13' }
      ]
      cardsStore.pagination = { total: 45, currentPage: 1, lastPage: 3, perPage: 20 }

      await wrapper.vm.$nextTick()

      const selector = wrapper.find('.page-size-selector')
      expect(selector.exists()).toBe(true)

      const options = selector.findAll('option')
      expect(options.length).toBe(3)
      expect(options[0].text()).toBe('20 per page')
      expect(options[1].text()).toBe('50 per page')
      expect(options[2].text()).toBe('100 per page')
    })

    it('should disable Previous button on first page', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        { id: 'card-1', cardName: 'Card 1', cardNumber: '123', barcodeType: 'EAN13' }
      ]
      cardsStore.pagination = { total: 45, currentPage: 1, lastPage: 3, perPage: 20 }

      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('.pagination-button')
      const firstButton = buttons.find(btn => btn.text() === 'First')
      const prevButton = buttons.find(btn => btn.text() === 'Previous')

      expect(firstButton.attributes('disabled')).toBeDefined()
      expect(prevButton.attributes('disabled')).toBeDefined()
    })

    it('should disable Next button on last page', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        { id: 'card-1', cardName: 'Card 1', cardNumber: '123', barcodeType: 'EAN13' }
      ]
      cardsStore.pagination = { total: 45, currentPage: 3, lastPage: 3, perPage: 20 }

      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('.pagination-button')
      const nextButton = buttons.find(btn => btn.text() === 'Next')
      const lastButton = buttons.find(btn => btn.text() === 'Last')

      expect(nextButton.attributes('disabled')).toBeDefined()
      expect(lastButton.attributes('disabled')).toBeDefined()
    })

    it('should navigate to next page when Next button is clicked', async () => {
      await router.push('/cards?page=1&limit=20')
      await router.isReady()

      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        { id: 'card-1', cardName: 'Card 1', cardNumber: '123', barcodeType: 'EAN13' }
      ]
      cardsStore.pagination = { total: 45, currentPage: 1, lastPage: 3, perPage: 20 }

      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('.pagination-button')
      const nextButton = buttons.find(btn => btn.text() === 'Next')

      await nextButton.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.query.page).toBe('2')
    })

    it('should navigate to previous page when Previous button is clicked', async () => {
      await router.push('/cards?page=2&limit=20')
      await router.isReady()

      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        { id: 'card-1', cardName: 'Card 1', cardNumber: '123', barcodeType: 'EAN13' }
      ]
      cardsStore.pagination = { total: 45, currentPage: 2, lastPage: 3, perPage: 20 }

      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('.pagination-button')
      const prevButton = buttons.find(btn => btn.text() === 'Previous')

      await prevButton.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.query.page).toBe('1')
    })

    it('should navigate to specific page when page number is clicked', async () => {
      await router.push('/cards?page=1&limit=20')
      await router.isReady()

      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        { id: 'card-1', cardName: 'Card 1', cardNumber: '123', barcodeType: 'EAN13' }
      ]
      cardsStore.pagination = { total: 45, currentPage: 1, lastPage: 3, perPage: 20 }

      await wrapper.vm.$nextTick()

      const pageButtons = wrapper.findAll('.page-number-button')
      const page3Button = pageButtons.find(btn => btn.text() === '3')

      if (page3Button) {
        await page3Button.trigger('click')
        await flushPromises()

        expect(router.currentRoute.value.query.page).toBe('3')
      }
    })

    it('should highlight current page number button', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        { id: 'card-1', cardName: 'Card 1', cardNumber: '123', barcodeType: 'EAN13' }
      ]
      cardsStore.pagination = { total: 45, currentPage: 2, lastPage: 3, perPage: 20 }

      await wrapper.vm.$nextTick()

      const pageButtons = wrapper.findAll('.page-number-button')
      const activePage = pageButtons.find(btn => btn.classes('active'))

      expect(activePage.text()).toBe('2')
    })
  })

  describe('US-2.3: Navigate to Card Creation', () => {
    beforeEach(() => {
      // Set up authenticated user for all tests
      localStorage.setItem('userId', 'user-123')
      localStorage.setItem('userEmail', 'test@example.com')
      localStorage.setItem('accessToken', 'test-token')
      localStorage.setItem('refreshToken', 'refresh-token')
    })

    it('should display "Add Card" button prominently in empty state', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = []
      cardsStore.pagination = { total: 0, currentPage: 1, lastPage: 1, perPage: 20 }

      await wrapper.vm.$nextTick()

      const addButton = wrapper.find('.add-card-button-large')
      expect(addButton.exists()).toBe(true)
      expect(addButton.text()).toContain('Add')
      expect(addButton.isVisible()).toBe(true)
    })

    it('should display "Add Card" button in cards list view', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        {
          id: 'card-1',
          cardName: 'Test Card',
          cardNumber: '1234567890',
          barcodeType: 'EAN13'
        }
      ]
      cardsStore.pagination = { total: 1, currentPage: 1, lastPage: 1, perPage: 20 }

      await wrapper.vm.$nextTick()

      const addButton = wrapper.find('.add-card-button')
      expect(addButton.exists()).toBe(true)
      expect(addButton.text()).toContain('Add Card')
    })

    it('should have clear icon and label on Add Card button', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        {
          id: 'card-1',
          cardName: 'Test Card',
          cardNumber: '1234567890',
          barcodeType: 'EAN13'
        }
      ]
      cardsStore.pagination = { total: 1, currentPage: 1, lastPage: 1, perPage: 20 }

      await wrapper.vm.$nextTick()

      const addButton = wrapper.find('.add-card-button')
      expect(addButton.text()).toBe('+ Add Card')
    })

    it('should navigate to card creation form when Add Card button is clicked from list view', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = [
        {
          id: 'card-1',
          cardName: 'Test Card',
          cardNumber: '1234567890',
          barcodeType: 'EAN13'
        }
      ]
      cardsStore.pagination = { total: 1, currentPage: 1, lastPage: 1, perPage: 20 }

      await wrapper.vm.$nextTick()

      const pushSpy = vi.spyOn(router, 'push')
      const addButton = wrapper.find('.add-card-button')

      await addButton.trigger('click')
      await flushPromises()

      expect(pushSpy).toHaveBeenCalledWith('/cards/new')
    })

    it('should navigate to card creation form when Add Card button is clicked from empty state', async () => {
      const wrapper = mount(CardsView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const cardsStore = useCardsStore()
      cardsStore.isLoading = false
      cardsStore.cards = []
      cardsStore.pagination = { total: 0, currentPage: 1, lastPage: 1, perPage: 20 }

      await wrapper.vm.$nextTick()

      const pushSpy = vi.spyOn(router, 'push')
      const addButton = wrapper.find('.add-card-button-large')

      await addButton.trigger('click')
      await flushPromises()

      expect(pushSpy).toHaveBeenCalledWith('/cards/new')
    })
  })
})
