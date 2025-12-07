import { defineStore } from 'pinia'
import { storesApi } from '@/api/stores'

export const useStoresStore = defineStore('stores', {
  state: () => ({
    stores: [],           // All stores
    selectedStore: null,  // Currently selected store
    filters: {
      search: '',
      country: '',
      category: ''
    },
    isLoading: false,
    error: null
  }),

  getters: {
    // Filtered stores based on current filters
    filteredStores: (state) => {
      let result = state.stores

      if (state.filters.search) {
        result = result.filter(store =>
          store.name.toLowerCase().includes(state.filters.search.toLowerCase())
        )
      }

      if (state.filters.country) {
        result = result.filter(store => store.country === state.filters.country)
      }

      if (state.filters.category) {
        result = result.filter(store => store.category === state.filters.category)
      }

      return result
    },

    // Check if stores are loaded
    hasStores: (state) => state.stores.length > 0
  },

  actions: {
    async fetchStores(filters = {}) {
      this.isLoading = true
      this.error = null

      try {
        this.stores = await storesApi.getStores(filters)
      } catch (err) {
        this.error = err.response?.data?.error?.message || 'Failed to fetch stores'
        console.error('Error fetching stores:', err)
      } finally {
        this.isLoading = false
      }
    },

    async fetchStoreById(id) {
      this.isLoading = true
      this.error = null

      try {
        this.selectedStore = await storesApi.getStoreById(id)
        return this.selectedStore
      } catch (err) {
        this.error = err.response?.data?.error?.message || 'Failed to fetch store'
        console.error('Error fetching store:', err)
        return null
      } finally {
        this.isLoading = false
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    },

    clearFilters() {
      this.filters = { search: '', country: '', category: '' }
    },

    selectStore(store) {
      this.selectedStore = store
    },

    clearSelectedStore() {
      this.selectedStore = null
    }
  }
})
