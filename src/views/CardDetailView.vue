<template>
  <div class="card-detail-container">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading card details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h2>Card Not Found</h2>
      <p>{{ error }}</p>
      <button @click="handleBackToCards" class="back-button">
        Back to Cards
      </button>
    </div>

    <!-- Card Details -->
    <div v-else-if="card" class="card-detail">
      <!-- Header -->
      <div class="card-header">
        <div class="header-content">
          <button @click="handleBackToCards" class="back-button-small">
            ← Back
          </button>
          <h1>{{ displayCardName }}</h1>
        </div>
        <div class="action-buttons">
          <button @click="handleEdit" class="edit-button">
            Edit
          </button>
          <button @click="handleDelete" class="delete-button">
            Delete
          </button>
        </div>
      </div>

      <!-- Card Information -->
      <div class="card-content">
        <div class="card-info-section">
          <h2>Card Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Card Number:</span>
              <div class="info-value-with-action">
                <span class="info-value">{{ card.cardNumber }}</span>
                <button
                  @click="copyCardNumber"
                  class="copy-button"
                  title="Copy card number"
                  aria-label="Copy card number to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy
                </button>
              </div>
            </div>
            <div class="info-item">
              <span class="info-label">Barcode Type:</span>
              <span class="info-value">{{ card.barcodeType }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Created:</span>
              <span class="info-value">{{ formatDate(card.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Last Updated:</span>
              <span class="info-value">{{ formatDate(card.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Store Information -->
        <div v-if="card.store" class="store-info-section">
          <h2>Store Information</h2>
          <StoreDisplay :store="card.store" size="large" />
        </div>

        <!-- Barcode Display -->
        <div class="barcode-section">
          <div class="barcode-header">
            <h2>Barcode</h2>
            <button
              @click="downloadBarcode"
              class="download-button"
              title="Download barcode"
              aria-label="Download barcode as image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </button>
          </div>
          <div class="barcode-display">
            <div v-if="barcodeError" class="barcode-error">
              {{ barcodeError }}
            </div>
            <div v-else-if="card.barcodeType === 'QR'" class="qr-display">
              <qrcode-vue
                ref="qrcodeRef"
                :value="card.cardNumber"
                :size="300"
                level="M"
              />
            </div>
            <div v-else-if="['EAN8', 'EAN13', 'CODE128'].includes(card.barcodeType)" class="linear-display">
              <svg ref="barcodeCanvas"></svg>
            </div>
            <div v-else class="fallback-display">
              <p class="fallback-text">{{ card.cardNumber }}</p>
              <span class="fallback-info">{{ card.barcodeType }} - Preview not available</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :is-open="showDeleteDialog"
      :is-loading="isDeleting"
      title="Delete Card"
      :message="deleteDialogMessage"
      confirm-text="Delete"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCardsStore } from '@/stores/cards'
import StoreDisplay from '@/components/StoreDisplay.vue'
import { useNotification } from '@/composables/useNotification'
import JsBarcode from 'jsbarcode'
import QrcodeVue from 'qrcode.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const route = useRoute()
const cardsStore = useCardsStore()
const { success, error: showError } = useNotification()

const barcodeCanvas = ref(null)
const qrcodeRef = ref(null)
const barcodeError = ref('')
const showDeleteDialog = ref(false)
const isDeleting = ref(false)

const isLoading = computed(() => cardsStore.isLoading)
const card = computed(() => cardsStore.currentCard)
const error = computed(() => cardsStore.error)

const displayCardName = computed(() => {
  return card.value?.cardName || 'Unnamed Card'
})

// Format Unix timestamp to readable date
function formatDate(timestamp) {
  if (!timestamp) return 'N/A'

  const date = new Date(timestamp * 1000)

  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }

  return date.toLocaleDateString('en-US', options)
}

// Copy card number to clipboard
async function copyCardNumber() {
  if (!card.value?.cardNumber) return

  try {
    // Check if clipboard API is available
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(card.value.cardNumber)
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea')
      textArea.value = card.value.cardNumber
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }

    success('Card number copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy card number:', err)
    showError('Failed to copy card number')
  }
}

// Download barcode as image
async function downloadBarcode() {
  if (!card.value) return

  try {
    const filename = generateFilename()

    if (card.value.barcodeType === 'QR') {
      await downloadQRCode(filename)
    } else if (['EAN8', 'EAN13', 'CODE128'].includes(card.value.barcodeType)) {
      await downloadLinearBarcode(filename)
    } else {
      await downloadFallbackBarcode(filename)
    }

    success('Barcode downloaded successfully!')
  } catch (err) {
    console.error('Failed to download barcode:', err)
    showError('Failed to download barcode')
  }
}

// Generate meaningful filename
function generateFilename() {
  const cardName = card.value.cardName || 'unnamed-card'
  const sanitizedName = cardName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `${sanitizedName}-barcode.png`
}

// Download QR code
async function downloadQRCode(filename) {
  // Get the canvas element from the QR code component
  const qrCanvas = qrcodeRef.value?.$el?.querySelector('canvas')

  if (!qrCanvas) {
    throw new Error('QR code canvas not found')
  }

  // Convert canvas to blob and download
  qrCanvas.toBlob((blob) => {
    if (!blob) {
      throw new Error('Failed to create blob from canvas')
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

// Download linear barcode (EAN8, EAN13, CODE128)
async function downloadLinearBarcode(filename) {
  if (!barcodeCanvas.value) {
    throw new Error('Barcode SVG not found')
  }

  // Get SVG element
  const svgElement = barcodeCanvas.value
  const svgData = new XMLSerializer().serializeToString(svgElement)

  // Get SVG dimensions
  const bbox = svgElement.getBBox()
  const width = bbox.width + 30 // Add padding
  const height = bbox.height + 30

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Set white background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, width, height)

  // Create image from SVG
  const img = new Image()
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 15, 15) // Add padding offset

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'))
          return
        }

        const downloadUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        link.click()
        URL.revokeObjectURL(downloadUrl)
        URL.revokeObjectURL(url)
        resolve()
      }, 'image/png')
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG image'))
    }

    img.src = url
  })
}

// Download fallback barcode (AZTEC, PDF417)
async function downloadFallbackBarcode(filename) {
  // Create a canvas with the barcode text
  const canvas = document.createElement('canvas')
  canvas.width = 600
  canvas.height = 300
  const ctx = canvas.getContext('2d')

  // Set white background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw barcode type
  ctx.fillStyle = '#7f8c8d'
  ctx.font = '20px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`${card.value.barcodeType} - Preview not available`, canvas.width / 2, 100)

  // Draw barcode data
  ctx.fillStyle = '#333'
  ctx.font = 'bold 36px monospace'
  ctx.fillText(card.value.cardNumber, canvas.width / 2, 180)

  // Convert to blob and download
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from canvas'))
        return
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
}

// Generate barcode for linear barcode types
function generateBarcode() {
  if (!card.value) return

  if (['EAN8', 'EAN13', 'CODE128'].includes(card.value.barcodeType)) {
    nextTick(() => {
      try {
        if (barcodeCanvas.value) {
          barcodeError.value = ''

          const options = {
            format: card.value.barcodeType,
            width: 3,
            height: 150,
            displayValue: true,
            fontSize: 20,
            margin: 15
          }

          JsBarcode(barcodeCanvas.value, card.value.cardNumber, options)
        }
      } catch (err) {
        barcodeError.value = 'Failed to generate barcode'
      }
    })
  }
}

// Navigation handlers
function handleBackToCards() {
  router.push('/cards')
}

function handleEdit() {
  router.push(`/cards/${card.value.id}/edit`)
}

function handleDelete() {
  showDeleteDialog.value = true
}

function handleCancelDelete() {
  showDeleteDialog.value = false
}

async function handleConfirmDelete() {
  if (!card.value) return

  isDeleting.value = true

  try {
    await cardsStore.deleteCard(card.value.id)

    success('Card deleted successfully!')

    // Redirect to cards list
    router.push('/cards')
  } catch (error) {
    console.error('Failed to delete card:', error)

    if (error.response?.status === 404) {
      showError('Card not found or already deleted')
      // Still redirect to cards list since card doesn't exist
      router.push('/cards')
    } else {
      showError('Failed to delete card. Please try again.')
    }

    showDeleteDialog.value = false
  } finally {
    isDeleting.value = false
  }
}

const deleteDialogMessage = computed(() => {
  const cardName = card.value?.cardName || 'this card'
  return `Are you sure you want to delete "${cardName}"? This action cannot be undone.`
})

// Fetch card on mount
async function loadCard() {
  const cardId = route.params.id

  try {
    await cardsStore.fetchCard(cardId)
    generateBarcode()
  } catch (err) {
    console.error('Failed to load card:', err)
    // Error is already set in the store
  }
}

// Watch for card changes to regenerate barcode
watch(card, () => {
  if (card.value) {
    generateBarcode()
  }
})

onMounted(() => {
  // Clear previous card data
  cardsStore.clearCurrentCard()
  cardsStore.clearError()

  loadCard()
})
</script>

<style scoped>
.card-detail-container {
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

/* Card Detail */
.card-detail {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.back-button-small {
  padding: 8px 16px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.back-button-small:hover {
  background: #7f8c8d;
}

.card-header h1 {
  margin: 0;
  color: #333;
  font-size: 28px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.edit-button,
.delete-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.edit-button {
  background: #3498db;
  color: white;
}

.edit-button:hover {
  background: #2980b9;
}

.delete-button {
  background: #e74c3c;
  color: white;
}

.delete-button:hover {
  background: #c0392b;
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

/* Card Content */
.card-content {
  display: grid;
  gap: 20px;
}

.card-info-section,
.store-info-section,
.barcode-section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-info-section h2,
.store-info-section h2,
.barcode-section h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 10px;
}

.barcode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.barcode-header h2 {
  margin: 0;
  border: none;
  padding: 0;
}

.download-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.download-button:hover {
  background: #229954;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
}

.download-button:active {
  transform: translateY(0);
}

.download-button svg {
  flex-shrink: 0;
}

.info-grid {
  display: grid;
  gap: 15px;
}

.info-item {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #ecf0f1;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

.info-value {
  color: #333;
  font-size: 14px;
  word-break: break-all;
}

.info-value-with-action {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.copy-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.copy-button:hover {
  background: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

.copy-button:active {
  transform: translateY(0);
}

.copy-button svg {
  flex-shrink: 0;
}

/* Barcode Display */
.barcode-display {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 250px;
  background: #fafafa;
  border-radius: 8px;
  padding: 30px;
  border: 2px solid #ecf0f1;
}

.barcode-error {
  color: #e74c3c;
  font-size: 16px;
  text-align: center;
}

.qr-display,
.linear-display {
  display: flex;
  justify-content: center;
  align-items: center;
}

.fallback-display {
  text-align: center;
}

.fallback-text {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  font-family: monospace;
  letter-spacing: 3px;
}

.fallback-info {
  display: block;
  color: #7f8c8d;
  font-size: 14px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .card-detail-container {
    padding: 10px;
  }

  .card-header {
    padding: 15px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .back-button-small {
    align-self: flex-start;
  }

  .card-header h1 {
    font-size: 22px;
  }

  .action-buttons {
    width: 100%;
  }

  .edit-button,
  .delete-button {
    flex: 1;
  }

  .card-info-section,
  .barcode-section {
    padding: 20px;
  }

  .info-item {
    grid-template-columns: 1fr;
    gap: 5px;
  }

  .info-label {
    font-size: 12px;
  }

  .info-value {
    font-size: 13px;
  }

  .barcode-display {
    padding: 15px;
    min-height: 200px;
  }

  .fallback-text {
    font-size: 24px;
  }

  .barcode-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .download-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
