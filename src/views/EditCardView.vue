<template>
  <div class="edit-card-container">
    <!-- Loading State -->
    <div v-if="isLoading && !card" class="loading-state">
      <div class="spinner"></div>
      <p>Loading card details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="error-state">
      <div class="error-icon">⚠️</div>
      <h2>Card Not Found</h2>
      <p>{{ loadError }}</p>
      <button @click="handleBackToCards" class="back-button">
        Back to Cards
      </button>
    </div>

    <!-- Edit Form -->
    <div v-else-if="card">
      <div class="edit-card-header">
        <h1>Edit Card</h1>
        <button @click="handleCancel" class="cancel-button">Cancel</button>
      </div>

      <div class="edit-card-content">
        <form @submit.prevent="handleSubmit" class="card-form">
          <!-- Card Number Field -->
          <div class="form-group">
            <label for="cardNumber">Card Number <span class="required">*</span></label>
            <input
              id="cardNumber"
              v-model="formData.cardNumber"
              type="text"
              placeholder="Enter card number"
              :class="{ 'error': errors.cardNumber }"
              @blur="validateCardNumber"
              @input="clearFieldError('cardNumber')"
            />
            <span v-if="errors.cardNumber" class="error-message">{{ errors.cardNumber }}</span>
          </div>

          <!-- Card Name Field -->
          <div class="form-group">
            <label for="cardName">Card Name</label>
            <input
              id="cardName"
              v-model="formData.cardName"
              type="text"
              placeholder="Enter card name (optional)"
              :class="{ 'error': errors.cardName }"
              @input="clearFieldError('cardName')"
            />
            <span v-if="errors.cardName" class="error-message">{{ errors.cardName }}</span>
            <span class="help-text">Optional - A friendly name for your card</span>
          </div>

          <!-- Barcode Type Field -->
          <div class="form-group">
            <label for="barcodeType">Barcode Type <span class="required">*</span></label>
            <select
              id="barcodeType"
              v-model="formData.barcodeType"
              :class="{ 'error': errors.barcodeType }"
              @blur="validateBarcodeType"
              @change="handleBarcodeTypeChange"
            >
              <option value="">Select barcode type</option>
              <option value="EAN8">EAN8 (7-8 digits)</option>
              <option value="EAN13">EAN13 (12-13 digits)</option>
              <option value="CODE128">CODE128 (ASCII characters)</option>
              <option value="QR">QR Code</option>
              <option value="AZTEC">AZTEC Code</option>
              <option value="PDF417">PDF417</option>
            </select>
            <span v-if="errors.barcodeType" class="error-message">{{ errors.barcodeType }}</span>
          </div>

          <!-- Store Selection Field -->
          <div class="form-group">
            <label>Store</label>
            <StorePicker
              v-model="formData.storeId"
              placeholder="Select a store (optional)"
            />
            <span v-if="errors.storeId" class="error-message">{{ errors.storeId }}</span>
            <span class="help-text">Optional - Select a store for this card</span>
          </div>

          <!-- Barcode Preview -->
          <div v-if="showPreview" class="barcode-preview-section">
            <h3>Barcode Preview</h3>
            <div class="barcode-preview">
              <div v-if="previewError" class="preview-error">
                {{ previewError }}
              </div>
              <div v-else-if="formData.barcodeType === 'QR'" class="qr-preview">
                <qrcode-vue
                  :value="formData.cardNumber"
                  :size="200"
                  level="M"
                />
              </div>
              <div v-else-if="['EAN8', 'EAN13', 'CODE128'].includes(formData.barcodeType)" class="linear-preview">
                <svg ref="barcodeCanvas"></svg>
              </div>
              <div v-else class="fallback-preview">
                <p class="fallback-text">{{ formData.cardNumber }}</p>
                <span class="fallback-info">{{ formData.barcodeType }} - Preview not available</span>
              </div>
            </div>
          </div>

          <!-- API Error Message -->
          <div v-if="apiError" class="api-error">
            {{ apiError }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="submit-button"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Updating Card...' : 'Update Card' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCardsStore } from '@/stores/cards'
import { useNotification } from '@/composables/useNotification'
import JsBarcode from 'jsbarcode'
import QrcodeVue from 'qrcode.vue'
import StorePicker from '@/components/StorePicker.vue'

const router = useRouter()
const route = useRoute()
const cardsStore = useCardsStore()
const { success, error: showError } = useNotification()

const card = ref(null)
const loadError = ref(null)
const isSubmitting = ref(false)

const formData = ref({
  cardNumber: '',
  cardName: '',
  barcodeType: '',
  storeId: null
})

const errors = ref({
  cardNumber: '',
  cardName: '',
  barcodeType: '',
  storeId: ''
})

const apiError = ref('')
const previewError = ref('')
const barcodeCanvas = ref(null)

const isLoading = computed(() => cardsStore.isLoading && !card.value)
const showPreview = computed(() => formData.value.cardNumber && formData.value.barcodeType)

// Validation functions (same as CreateCardView)
function validateCardNumber() {
  const cardNumber = formData.value.cardNumber.trim()
  const barcodeType = formData.value.barcodeType

  if (!cardNumber) {
    errors.value.cardNumber = 'Card number is required'
    return false
  }

  // Validate based on barcode type
  if (barcodeType === 'EAN8') {
    if (!/^\d{7,8}$/.test(cardNumber)) {
      errors.value.cardNumber = 'EAN8 must be 7-8 digits only'
      return false
    }
  } else if (barcodeType === 'EAN13') {
    if (!/^\d{12,13}$/.test(cardNumber)) {
      errors.value.cardNumber = 'EAN13 must be 12-13 digits only'
      return false
    }
  } else if (barcodeType === 'CODE128') {
    // Check for ASCII characters (printable ASCII range 32-126)
    if (!/^[\x20-\x7E]+$/.test(cardNumber)) {
      errors.value.cardNumber = 'CODE128 must contain only ASCII characters'
      return false
    }
  }

  // Generic length check
  if (cardNumber.length > 255) {
    errors.value.cardNumber = 'Card number must be less than 255 characters'
    return false
  }

  errors.value.cardNumber = ''
  return true
}

function validateBarcodeType() {
  if (!formData.value.barcodeType) {
    errors.value.barcodeType = 'Barcode type is required'
    return false
  }

  const validTypes = ['EAN8', 'EAN13', 'CODE128', 'QR', 'AZTEC', 'PDF417']
  if (!validTypes.includes(formData.value.barcodeType)) {
    errors.value.barcodeType = 'Invalid barcode type'
    return false
  }

  errors.value.barcodeType = ''
  return true
}

function validateForm() {
  const isCardNumberValid = validateCardNumber()
  const isBarcodeTypeValid = validateBarcodeType()

  // Card name validation (max 255 chars)
  if (formData.value.cardName && formData.value.cardName.length > 255) {
    errors.value.cardName = 'Card name must be less than 255 characters'
    return false
  }

  return isCardNumberValid && isBarcodeTypeValid
}

function clearFieldError(field) {
  errors.value[field] = ''
  apiError.value = ''

  // Re-validate card number when typing if barcode type is selected
  if (field === 'cardNumber' && formData.value.barcodeType) {
    // Clear error immediately, will re-validate on blur
    errors.value.cardNumber = ''
  }
}

function handleBarcodeTypeChange() {
  clearFieldError('barcodeType')
  // Re-validate card number with new barcode type
  if (formData.value.cardNumber) {
    validateCardNumber()
  }
}

function handleCancel() {
  router.push(`/cards/${route.params.id}`)
}

function handleBackToCards() {
  router.push('/cards')
}

async function handleSubmit() {
  // Clear previous errors
  apiError.value = ''

  // Validate form
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    // Prepare data for API
    const cardData = {
      cardNumber: formData.value.cardNumber.trim(),
      cardName: formData.value.cardName.trim() || null,
      barcodeType: formData.value.barcodeType,
      storeId: formData.value.storeId || null
    }

    await cardsStore.updateCard(route.params.id, cardData)

    success('Card updated successfully!')

    // Redirect to card detail view
    router.push(`/cards/${route.params.id}`)
  } catch (error) {
    console.error('Failed to update card:', error)

    // Handle specific error types
    if (error.response?.status === 422) {
      // Validation errors
      const validationErrors = error.response.data?.errors
      if (validationErrors) {
        // Map API errors to form fields
        Object.keys(validationErrors).forEach(field => {
          if (errors.value.hasOwnProperty(field)) {
            errors.value[field] = validationErrors[field][0]
          }
        })
      } else {
        apiError.value = error.response.data?.message || 'Validation failed. Please check your input.'
      }
    } else if (error.response?.status === 409) {
      // Duplicate card error
      apiError.value = 'A card with this number already exists for this store.'
    } else if (error.response?.status === 404) {
      // Card not found
      apiError.value = 'Card not found or you do not have permission to edit it.'
    } else {
      // Generic error
      apiError.value = error.response?.data?.message || 'Failed to update card. Please try again.'
      showError('Failed to update card')
    }
  } finally {
    isSubmitting.value = false
  }
}

// Generate barcode preview
function generateBarcodePreview() {
  if (!showPreview.value) {
    return
  }

  if (['EAN8', 'EAN13', 'CODE128'].includes(formData.value.barcodeType)) {
    nextTick(() => {
      try {
        if (barcodeCanvas.value) {
          previewError.value = ''

          const options = {
            format: formData.value.barcodeType,
            width: 2,
            height: 100,
            displayValue: true,
            fontSize: 14,
            margin: 10
          }

          JsBarcode(barcodeCanvas.value, formData.value.cardNumber, options)
        }
      } catch (error) {
        previewError.value = 'Invalid barcode data for preview'
      }
    })
  }
}

// Load card data
async function loadCard() {
  const cardId = route.params.id
  loadError.value = null

  try {
    await cardsStore.fetchCard(cardId)
    card.value = cardsStore.currentCard

    // Pre-fill form with existing data
    formData.value = {
      cardNumber: card.value.cardNumber || '',
      cardName: card.value.cardName || '',
      barcodeType: card.value.barcodeType || '',
      storeId: card.value.storeId || null
    }
  } catch (err) {
    console.error('Failed to load card:', err)
    loadError.value = err.response?.data?.message || 'Failed to load card details'
  }
}

// Watch for changes to update barcode preview
watch([() => formData.value.cardNumber, () => formData.value.barcodeType], () => {
  previewError.value = ''
  if (showPreview.value) {
    generateBarcodePreview()
  }
}, { immediate: true })

onMounted(() => {
  cardsStore.clearCurrentCard()
  cardsStore.clearError()
  loadCard()
})
</script>

<style scoped>
.edit-card-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-state h2 {
  color: #e74c3c;
  margin-bottom: 10px;
}

.error-state p {
  color: #7f8c8d;
  margin-bottom: 30px;
}

.back-button {
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.back-button:hover {
  background: #2980b9;
}

.edit-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.cancel-button {
  padding: 10px 20px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.cancel-button:hover {
  background: #7f8c8d;
}

.edit-card-content {
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-form {
  max-width: 600px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.required {
  color: #e74c3c;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
}

.form-group input.error,
.form-group select.error {
  border-color: #e74c3c;
}

.error-message {
  display: block;
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
}

.help-text {
  display: block;
  color: #7f8c8d;
  font-size: 12px;
  margin-top: 5px;
}

.barcode-preview-section {
  margin: 30px 0;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 2px dashed #ddd;
}

.barcode-preview-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.barcode-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 150px;
  background: white;
  border-radius: 6px;
  padding: 20px;
}

.preview-error {
  color: #e74c3c;
  font-size: 14px;
  text-align: center;
}

.qr-preview,
.linear-preview {
  display: flex;
  justify-content: center;
  align-items: center;
}

.fallback-preview {
  text-align: center;
}

.fallback-text {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  font-family: monospace;
  letter-spacing: 2px;
}

.fallback-info {
  display: block;
  color: #7f8c8d;
  font-size: 12px;
}

.api-error {
  padding: 15px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  color: #c33;
  margin-bottom: 20px;
  font-size: 14px;
}

.submit-button {
  width: 100%;
  padding: 14px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-button:hover:not(:disabled) {
  background: #2980b9;
}

.submit-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .edit-card-container {
    padding: 10px;
  }

  .edit-card-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  h1 {
    font-size: 20px;
  }

  .edit-card-content {
    padding: 20px;
  }

  .cancel-button {
    width: 100%;
  }

  .card-form {
    max-width: 100%;
  }
}
</style>
