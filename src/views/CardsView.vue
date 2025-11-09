<template>
  <div class="cards-container">
    <div class="cards-header">
      <h1>My Loyalty Cards</h1>
      <button @click="handleLogout" class="logout-button">Logout</button>
    </div>

    <div class="cards-content">
      <p class="welcome-message">
        Welcome, {{ authStore.userEmail }}!
      </p>

      <!-- Loading State -->
      <div v-if="cardsStore.isLoading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading your cards...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!cardsStore.hasCards" class="empty-state">
        <div class="empty-icon">📇</div>
        <h2>No cards yet</h2>
        <p>Start adding your loyalty cards to keep them all in one place</p>
        <button @click="handleAddCard" class="add-card-button-large">
          Add Your First Card
        </button>
      </div>

      <!-- Cards Grid -->
      <div v-else class="cards-list-container">
        <div class="cards-list-header">
          <p class="cards-count">
            {{ cardsStore.totalCards }} card{{ cardsStore.totalCards !== 1 ? 's' : '' }}
          </p>
          <button @click="handleAddCard" class="add-card-button">
            + Add Card
          </button>
        </div>

        <div class="cards-grid">
          <div
            v-for="card in cardsStore.cards"
            :key="card.id"
            class="card-item"
          >
            <div class="card-content">
              <h3 class="card-name">{{ card.cardName || 'Unnamed Card' }}</h3>
              <p class="card-number">{{ card.cardNumber }}</p>
              <p class="card-barcode-type">{{ card.barcodeType }}</p>
            </div>
            <div class="card-actions">
              <button
                @click="handleViewCard(card.id)"
                class="action-button view-button"
                title="View card"
              >
                👁️ View
              </button>
              <button
                @click="handleEditCard(card.id)"
                class="action-button edit-button"
                title="Edit card"
              >
                ✏️ Edit
              </button>
              <button
                @click="handleDeleteCard(card.id, card.cardName)"
                class="action-button delete-button"
                title="Delete card"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-container">
          <div class="pagination-info">
            <span>Page {{ cardsStore.pagination.currentPage }} of {{ cardsStore.pagination.lastPage }}</span>
            <select v-model.number="limit" @change="handleLimitChange" class="page-size-selector">
              <option :value="20">20 per page</option>
              <option :value="50">50 per page</option>
              <option :value="100">100 per page</option>
            </select>
          </div>

          <div class="pagination-controls">
            <button
              @click="goToPage(1)"
              :disabled="cardsStore.pagination.currentPage === 1"
              class="pagination-button"
            >
              First
            </button>
            <button
              @click="goToPage(cardsStore.pagination.currentPage - 1)"
              :disabled="cardsStore.pagination.currentPage === 1"
              class="pagination-button"
            >
              Previous
            </button>

            <!-- Page number buttons -->
            <div class="page-numbers">
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="goToPage(page)"
                :class="['page-number-button', { active: page === cardsStore.pagination.currentPage }]"
              >
                {{ page }}
              </button>
            </div>

            <button
              @click="goToPage(cardsStore.pagination.currentPage + 1)"
              :disabled="cardsStore.pagination.currentPage === cardsStore.pagination.lastPage"
              class="pagination-button"
            >
              Next
            </button>
            <button
              @click="goToPage(cardsStore.pagination.lastPage)"
              :disabled="cardsStore.pagination.currentPage === cardsStore.pagination.lastPage"
              class="pagination-button"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCardsStore } from '@/stores/cards'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const cardsStore = useCardsStore()

// Pagination state
const limit = ref(20)

// Computed property for visible page numbers
const visiblePages = computed(() => {
  const currentPage = cardsStore.pagination.currentPage
  const lastPage = cardsStore.pagination.lastPage
  const pages = []

  if (lastPage <= 7) {
    // Show all pages if there are 7 or fewer
    for (let i = 1; i <= lastPage; i++) {
      pages.push(i)
    }
  } else {
    // Show first page, last page, and pages around current page
    if (currentPage <= 3) {
      // Near the beginning
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(lastPage)
    } else if (currentPage >= lastPage - 2) {
      // Near the end
      pages.push(1)
      pages.push('...')
      for (let i = lastPage - 4; i <= lastPage; i++) {
        pages.push(i)
      }
    } else {
      // In the middle
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(lastPage)
    }
  }

  return pages.filter(page => page !== '...')
})

onMounted(async () => {
  // Get page and limit from URL query parameters
  const pageFromUrl = parseInt(route.query.page) || 1
  const limitFromUrl = parseInt(route.query.limit) || 20

  // Validate limit
  if ([20, 50, 100].includes(limitFromUrl)) {
    limit.value = limitFromUrl
  }

  try {
    await cardsStore.fetchCards(pageFromUrl, limit.value)
  } catch (error) {
    console.error('Failed to fetch cards:', error)
  }
})

// Watch for route changes (e.g., browser back/forward buttons)
watch(() => route.query, async (newQuery) => {
  const page = parseInt(newQuery.page) || 1
  const newLimit = parseInt(newQuery.limit) || 20

  if ([20, 50, 100].includes(newLimit) && newLimit !== limit.value) {
    limit.value = newLimit
  }

  try {
    await cardsStore.fetchCards(page, limit.value)
  } catch (error) {
    console.error('Failed to fetch cards:', error)
  }
}, { deep: true })

async function goToPage(page) {
  if (typeof page !== 'number' || page < 1 || page > cardsStore.pagination.lastPage) {
    return
  }

  // Update URL query parameters
  await router.push({
    query: {
      page,
      limit: limit.value
    }
  })
}

async function handleLimitChange() {
  // Reset to page 1 when changing limit
  await router.push({
    query: {
      page: 1,
      limit: limit.value
    }
  })
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function handleAddCard() {
  router.push('/cards/new')
}

function handleViewCard(cardId) {
  router.push(`/cards/${cardId}`)
}

function handleEditCard(cardId) {
  // TODO: Navigate to card edit page (US-5.1)
  console.log('Edit card:', cardId)
}

async function handleDeleteCard(cardId, cardName) {
  // TODO: Show confirmation dialog and delete card (US-6.1)
  const confirmed = confirm(`Are you sure you want to delete ${cardName || 'this card'}?`)

  if (confirmed) {
    try {
      await cardsStore.deleteCard(cardId)
      console.log('Card deleted successfully')

      // Refresh current page after deletion
      const currentPage = cardsStore.pagination.currentPage
      await cardsStore.fetchCards(currentPage, limit.value)
    } catch (error) {
      console.error('Failed to delete card:', error)
      alert('Failed to delete card. Please try again.')
    }
  }
}
</script>

<style scoped>
.cards-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.cards-header {
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

.logout-button {
  padding: 10px 20px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.logout-button:hover {
  background: #c0392b;
}

.cards-content {
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.welcome-message {
  font-size: 18px;
  color: #333;
  font-weight: 500;
  margin-bottom: 30px;
  text-align: center;
}

/* Loading State */
.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-state h2 {
  color: #333;
  font-size: 24px;
  margin-bottom: 10px;
}

.empty-state p {
  color: #666;
  font-size: 16px;
  margin-bottom: 30px;
}

.add-card-button-large {
  padding: 15px 30px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.add-card-button-large:hover {
  background: #2980b9;
}

/* Cards List */
.cards-list-container {
  padding: 0;
}

.cards-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.cards-count {
  color: #666;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
}

.add-card-button {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.add-card-button:hover {
  background: #2980b9;
}

/* Cards Grid */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.card-item {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.3s, transform 0.3s;
}

.card-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-content {
  margin-bottom: 15px;
}

.card-name {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.card-number {
  margin: 5px 0;
  color: #555;
  font-size: 14px;
  font-family: monospace;
  letter-spacing: 1px;
}

.card-barcode-type {
  margin: 5px 0 0 0;
  color: #888;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

/* Card Actions */
.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-button {
  flex: 1;
  min-width: 80px;
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.view-button {
  background: #3498db;
  color: white;
}

.view-button:hover {
  background: #2980b9;
}

.edit-button {
  background: #f39c12;
  color: white;
}

.edit-button:hover {
  background: #e67e22;
}

.delete-button {
  background: #e74c3c;
  color: white;
}

.delete-button:hover {
  background: #c0392b;
}

/* Pagination */
.pagination-container {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
}

.pagination-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
}

.page-size-selector {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: border-color 0.3s;
}

.page-size-selector:hover {
  border-color: #3498db;
}

.page-size-selector:focus {
  outline: none;
  border-color: #3498db;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-button {
  padding: 8px 16px;
  background: white;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-button:hover:not(:disabled) {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.page-number-button {
  min-width: 40px;
  padding: 8px 12px;
  background: white;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.page-number-button:hover {
  background: #f0f0f0;
  border-color: #3498db;
}

.page-number-button.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

/* Responsive Design */
@media (max-width: 768px) {
  .cards-container {
    padding: 10px;
  }

  .cards-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  h1 {
    font-size: 20px;
  }

  .cards-content {
    padding: 20px;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .cards-list-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .add-card-button {
    width: 100%;
  }

  .pagination-info {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .pagination-controls {
    gap: 5px;
  }

  .pagination-button {
    padding: 6px 10px;
    font-size: 12px;
  }

  .page-number-button {
    min-width: 35px;
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>
