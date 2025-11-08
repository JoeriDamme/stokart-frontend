import apiClient from './axios'

export const cardsAPI = {
  /**
   * Get paginated list of cards
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20, max: 100)
   * @returns {Promise} API response with cards and pagination
   */
  getCards(params = {}) {
    const { page = 1, limit = 20 } = params
    return apiClient.get('/api/v1/cards', {
      params: { page, limit }
    })
  },

  /**
   * Get a specific card by ID
   * @param {string} id - Card ID
   * @returns {Promise} API response with card details
   */
  getCard(id) {
    return apiClient.get(`/api/v1/cards/${id}`)
  },

  /**
   * Create a new card
   * @param {Object} data - Card data
   * @param {string} data.cardNumber - Card number (required)
   * @param {string} data.cardName - Card name (optional)
   * @param {string} data.barcodeType - Barcode type (required): EAN8, EAN13, CODE128, QR, AZTEC, PDF417
   * @param {string} data.storeId - Store ID (optional)
   * @returns {Promise} API response with created card
   */
  createCard(data) {
    return apiClient.post('/api/v1/cards', data)
  },

  /**
   * Update an existing card
   * @param {string} id - Card ID
   * @param {Object} data - Card data to update
   * @returns {Promise} API response with updated card
   */
  updateCard(id, data) {
    return apiClient.put(`/api/v1/cards/${id}`, data)
  },

  /**
   * Delete a card
   * @param {string} id - Card ID
   * @returns {Promise} API response (204 No Content)
   */
  deleteCard(id) {
    return apiClient.delete(`/api/v1/cards/${id}`)
  }
}
