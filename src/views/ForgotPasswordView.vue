<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <h1>Reset Password</h1>
      <p class="subtitle">Enter your email to receive reset instructions</p>

      <!-- Success State -->
      <div v-if="submitted" class="success-message">
        <p>
          If an account exists with this email, you'll receive password reset instructions shortly. Please check your inbox and spam folder.
        </p>
        <p class="resend-prompt">
          Didn't receive an email?
          <button type="button" class="resend-button" @click="resetForm">
            Try again
          </button>
        </p>
      </div>

      <!-- Form State -->
      <form v-else @submit.prevent="handleSubmit" class="forgot-password-form">
        <!-- Email Field -->
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="Enter your email"
            :class="{ 'error': errors.email }"
            @blur="validateEmail"
            @input="clearFieldError('email')"
            :disabled="isLoading"
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
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
          {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>

      <p class="login-link">
        Remember your password?
        <router-link to="/login">Login here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { authAPI } from '@/api/auth'

const formData = ref({
  email: ''
})

const errors = ref({
  email: ''
})

const apiError = ref('')
const isLoading = ref(false)
const submitted = ref(false)

function validateEmail() {
  if (!formData.value.email.trim()) {
    errors.value.email = 'Email is required'
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.value.email)) {
    errors.value.email = 'Please enter a valid email address'
    return false
  }

  errors.value.email = ''
  return true
}

function clearFieldError(field) {
  errors.value[field] = ''
  apiError.value = ''
}

function validateForm() {
  return validateEmail()
}

function resetForm() {
  formData.value.email = ''
  errors.value.email = ''
  apiError.value = ''
  submitted.value = false
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
    await authAPI.requestPasswordReset(formData.value.email)
    submitted.value = true
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
        apiError.value = 'Validation failed. Please check your inputs.'
      }
    } else {
      apiError.value = error.response?.data?.message || 'Unable to process request. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.forgot-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.forgot-password-card {
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

.forgot-password-form {
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
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.success-message p:last-child {
  margin-bottom: 0;
}

.resend-prompt {
  font-size: 13px;
  margin-top: 12px;
}

.resend-button {
  background: none;
  border: none;
  color: #155724;
  text-decoration: underline;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  padding: 0;
  margin-left: 4px;
}

.resend-button:hover {
  text-decoration: none;
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

.login-link {
  margin-top: 20px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .forgot-password-card {
    padding: 30px 20px;
  }

  h1 {
    font-size: 24px;
  }
}
</style>
