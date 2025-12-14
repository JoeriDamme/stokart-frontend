<template>
  <div class="reset-password-container">
    <div class="reset-password-card">
      <h1>Create New Password</h1>
      <p class="subtitle">Enter your new password below</p>

      <!-- Success State -->
      <div v-if="resetSuccessful" class="success-message">
        <p>Your password has been reset successfully!</p>
        <p class="redirect-message">Redirecting to login...</p>
      </div>

      <!-- Token Error State -->
      <div v-else-if="tokenError" class="token-error-state">
        <p class="error-icon">⚠️</p>
        <p class="error-text">{{ tokenError }}</p>
        <router-link to="/forgot-password" class="link-button">
          Request New Reset Link
        </router-link>
      </div>

      <!-- Form State -->
      <form v-else @submit.prevent="handleSubmit" class="reset-password-form">
        <!-- New Password Field -->
        <div class="form-group">
          <label for="newPassword">New Password</label>
          <input
            id="newPassword"
            v-model="formData.newPassword"
            type="password"
            placeholder="Enter your new password"
            :class="{ 'error': errors.newPassword }"
            @blur="validatePassword"
            @input="clearFieldError('newPassword')"
            :disabled="isLoading"
          />
          <span v-if="errors.newPassword" class="error-message">{{ errors.newPassword }}</span>
          <p v-if="!errors.newPassword" class="password-hint">
            Password must be at least 8 characters with uppercase, lowercase, and number
          </p>
        </div>

        <!-- Confirm Password Field -->
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            :class="{ 'error': errors.confirmPassword }"
            @blur="validateConfirmPassword"
            @input="clearFieldError('confirmPassword')"
            :disabled="isLoading"
          />
          <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
        </div>

        <!-- API Error Message -->
        <div v-if="apiError" class="api-error">
          {{ apiError }}
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="submit-button"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authAPI } from '@/api/auth'

const router = useRouter()
const route = useRoute()

const token = ref(route.query.token || '')
const tokenError = ref('')

const formData = ref({
  newPassword: '',
  confirmPassword: ''
})

const errors = ref({
  newPassword: '',
  confirmPassword: ''
})

const apiError = ref('')
const isLoading = ref(false)
const resetSuccessful = ref(false)

// Validate token format (UUID v4)
function validateTokenFormat() {
  if (!token.value) {
    return false
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(token.value)
}

function validatePassword() {
  const password = formData.value.newPassword

  if (!password) {
    errors.value.newPassword = 'Password is required'
    return false
  }

  if (password.length < 8) {
    errors.value.newPassword = 'Password must be at least 8 characters'
    return false
  }

  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  if (!hasUppercase) {
    errors.value.newPassword = 'Password must contain at least one uppercase letter'
    return false
  }

  if (!hasLowercase) {
    errors.value.newPassword = 'Password must contain at least one lowercase letter'
    return false
  }

  if (!hasNumber) {
    errors.value.newPassword = 'Password must contain at least one number'
    return false
  }

  errors.value.newPassword = ''
  return true
}

function validateConfirmPassword() {
  const confirmPassword = formData.value.confirmPassword
  const newPassword = formData.value.newPassword

  if (!confirmPassword) {
    errors.value.confirmPassword = 'Please confirm your password'
    return false
  }

  if (confirmPassword !== newPassword) {
    errors.value.confirmPassword = 'Passwords do not match'
    return false
  }

  errors.value.confirmPassword = ''
  return true
}

function clearFieldError(field) {
  errors.value[field] = ''
  apiError.value = ''
}

function validateForm() {
  const isPasswordValid = validatePassword()
  const isConfirmValid = validateConfirmPassword()

  return isPasswordValid && isConfirmValid
}

async function handleSubmit() {
  // Clear previous API errors
  apiError.value = ''

  // Validate form
  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    await authAPI.confirmPasswordReset({
      token: token.value,
      newPassword: formData.value.newPassword
    })

    resetSuccessful.value = true

    // Auto-redirect after 3 seconds
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (error) {
    if (error.response?.status === 422) {
      const validationErrors = error.response?.data?.errors
      if (validationErrors) {
        // Map API validation errors to form fields
        Object.keys(validationErrors).forEach(field => {
          if (errors.value.hasOwnProperty(field)) {
            errors.value[field] = validationErrors[field][0]
          }
        })
      } else {
        // Generic token validation error
        apiError.value = 'This reset link has expired or is invalid. Please request a new password reset.'
      }
    } else {
      apiError.value = error.response?.data?.message || 'Unable to reset password. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

// Validate token on mount
onMounted(() => {
  if (!validateTokenFormat()) {
    tokenError.value = 'Invalid or missing reset token. Please request a new password reset.'
  }
})
</script>

<style scoped>
.reset-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.reset-password-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
}

h1 {
  margin: 0 0 10px;
  font-size: 28px;
  color: #333;
  text-align: center;
}

.subtitle {
  margin: 0 0 30px;
  color: #666;
  text-align: center;
  font-size: 14px;
}

.reset-password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

input {
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s, box-shadow 0.3s;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

input.error {
  border-color: #e74c3c;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: -2px;
}

.password-hint {
  color: #999;
  font-size: 12px;
  margin-top: 2px;
  margin-bottom: 0;
}

.api-error {
  padding: 12px;
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  color: #c33;
  font-size: 14px;
  text-align: center;
}

.success-message {
  padding: 20px;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
  color: #155724;
  text-align: center;
  margin-bottom: 20px;
}

.success-message p {
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.success-message p:last-child {
  margin-bottom: 0;
}

.redirect-message {
  font-size: 13px;
  color: #155724;
}

.token-error-state {
  text-align: center;
  padding: 20px 0;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.error-text {
  color: #e74c3c;
  margin-bottom: 20px;
  line-height: 1.5;
}

.link-button {
  display: inline-block;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.link-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.link-button:active {
  transform: translateY(0);
}

.submit-button {
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .reset-password-card {
    padding: 30px 20px;
  }

  h1 {
    font-size: 24px;
  }
}
</style>
