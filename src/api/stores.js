import apiClient from './axios'

export const storesApi = {
  /**
   * Fetch all stores with optional filters
   * @param {Object} filters - { search, country, category }
   * @returns {Promise<Array>} Array of store objects
   */
  async getStores(filters = {}) {
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.country) params.append('country', filters.country)
    if (filters.category) params.append('category', filters.category)

    const response = await apiClient.get(`/api/v1/stores?${params}`)
    return response.data.data.data // Returns array of stores (extra nesting level)
  },

  /**
   * Fetch a specific store by ID
   * @param {string} id - Store UUID
   * @returns {Promise<Object>} Store object
   */
  async getStoreById(id) {
    const response = await apiClient.get(`/api/v1/stores/${id}`)
    return response.data.data.data // Returns store object (extra nesting level)
  }
}
