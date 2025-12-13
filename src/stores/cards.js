import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cardsAPI } from '@/api/cards'

export const useCardsStore = defineStore('cards', () => {
  // State
  const cards = ref([])
  const currentCard = ref(null)
  const pagination = ref({
    currentPage: 1,
    perPage: 20,
    total: 0,
    lastPage: 1
  })
  const isLoading = ref(false)
  const error = ref(null)

  // Getters
  const hasCards = computed(() => cards.value.length > 0)
  const totalCards = computed(() => pagination.value.total)

  // Actions
  async function fetchCards(page = 1, limit = 20) {
    isLoading.value = true
    error.value = null

    try {
      const response = await cardsAPI.getCards({ page, limit })

      cards.value = response.data.data.cards
      pagination.value = response.data.data.pagination

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch cards'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCard(id) {
    isLoading.value = true
    error.value = null

    try {
      const response = await cardsAPI.getCard(id)
      currentCard.value = response.data.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch card'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createCard(cardData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await cardsAPI.createCard(cardData)
      const newCard = response.data.data

      // Add new card to the beginning of the list
      cards.value.unshift(newCard)
      pagination.value.total++

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create card'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateCard(id, cardData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await cardsAPI.updateCard(id, cardData)
      const updatedCard = response.data.data

      // Update card in the list
      const index = cards.value.findIndex(card => card.id === id)
      if (index !== -1) {
        cards.value[index] = updatedCard
      }

      // Update current card if it's the one being edited
      if (currentCard.value?.id === id) {
        currentCard.value = updatedCard
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update card'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteCard(id) {
    isLoading.value = true
    error.value = null

    try {
      await cardsAPI.deleteCard(id)

      // Remove card from the list
      const index = cards.value.findIndex(card => card.id === id)
      if (index !== -1) {
        cards.value.splice(index, 1)
        pagination.value.total--
      }

      // Clear current card if it's the one being deleted
      if (currentCard.value?.id === id) {
        currentCard.value = null
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete card'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function clearCurrentCard() {
    currentCard.value = null
  }

  return {
    // State
    cards,
    currentCard,
    pagination,
    isLoading,
    error,
    // Getters
    hasCards,
    totalCards,
    // Actions
    fetchCards,
    fetchCard,
    createCard,
    updateCard,
    deleteCard,
    clearError,
    clearCurrentCard
  }
})
