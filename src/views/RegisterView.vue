<template>
  <div class="register-container">
    <div class="register-card">
      <h1>Create Account</h1>
      <p class="subtitle">Register for Stokard to manage your loyalty cards</p>

      <form @submit.prevent="handleSubmit" class="register-form">
        <!-- Name Field -->
        <div class="form-group">
          <label for="name">Name</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="Enter your name"
            :class="{ 'error': errors.name }"
            @blur="validateName"
            @input="clearFieldError('name')"
          />
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>

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
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="Enter your password"
            :class="{ 'error': errors.password }"
            @blur="validatePassword"
            @input="clearFieldError('password')"
          />
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
          <span class="help-text">
            Must be at least 8 characters with uppercase, lowercase, and number
          </span>
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
          {{ isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <p class="login-link">
        Already have an account?
        <router-link to="/login">Login here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const formData = ref({
  name: '',
  email: '',
  password: ''
})

const errors = ref({
  name: '',
  email: '',
  password: ''
})

const apiError = ref('')
const isLoading = computed(() => authStore.isLoading)

// Validation functions
function validateName() {
  if (!formData.value.name.trim()) {
    errors.value.name = 'Name is required'
    return false
  }
  errors.value.name = ''
  return true
}

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

function validatePassword() {
  const password = formData.value.password

  if (!password) {
    errors.value.password = 'Password is required'
    return false
  }

  if (password.length < 8) {
    errors.value.password = 'Password must be at least 8 characters'
    return false
  }

  // Check for uppercase, lowercase, and number
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    errors.value.password = 'Password must contain uppercase, lowercase, and number'
    return false
  }

  errors.value.password = ''
  return true
}

function clearFieldError(field) {
  errors.value[field] = ''
  apiError.value = ''
}

function validateForm() {
  const isNameValid = validateName()
  const isEmailValid = validateEmail()
  const isPasswordValid = validatePassword()

  return isNameValid && isEmailValid && isPasswordValid
}

async function handleSubmit() {
  // Clear previous API errors
  apiError.value = ''

  // Validate form
  if (!validateForm()) {
    return
  }

  try {
    await authStore.register(
      formData.value.name,
      formData.value.email,
      formData.value.password
    )

    // Registration successful, redirect to cards list
    router.push('/cards')
  } catch (error) {
    // Handle different error types
    if (error.response?.status === 409) {
      apiError.value = 'An account with this email already exists'
    } else if (error.response?.status === 422) {
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
      apiError.value = error.response?.data?.message || 'Registration failed. Please try again.'
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
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

.register-form {
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

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: -2px;
}

.help-text {
  color: #999;
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
  .register-card {
    padding: 30px 20px;
  }

  h1 {
    font-size: 24px;
  }
}
</style>
