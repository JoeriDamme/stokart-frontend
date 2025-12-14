import apiClient from './axios'

export const authAPI = {
  /**
   * Register a new user
   * @param {Object} data - Registration data
   * @param {string} data.name - User's name
   * @param {string} data.email - User's email
   * @param {string} data.plainPassword - User's password
   * @returns {Promise} API response
   */
  register(data) {
    return apiClient.post('/api/v1/auth/register', data)
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.plainPassword - User's password
   * @returns {Promise} API response
   */
  login(credentials) {
    return apiClient.post('/api/v1/auth/login', credentials)
  },

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise} API response
   */
  refresh(refreshToken) {
    return apiClient.post('/api/v1/auth/refresh', { refreshToken })
  },

  /**
   * Request password reset
   * @param {string} email - User's email address
   * @returns {Promise} API response
   */
  requestPasswordReset(email) {
    return apiClient.post('/api/v1/auth/password-reset/request', { email })
  },

  /**
   * Confirm password reset with token
   * @param {Object} data - Reset data
   * @param {string} data.token - Reset token (UUID)
   * @param {string} data.newPassword - New password
   * @returns {Promise} API response
   */
  confirmPasswordReset(data) {
    return apiClient.post('/api/v1/auth/password-reset/confirm', data)
  }
}
