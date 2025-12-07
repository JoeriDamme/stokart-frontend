<template>
  <div class="store-picker">
    <!-- Selected Store Display / Search Input -->
    <div
      class="store-picker-input"
      @click="toggleDropdown"
    >
      <div v-if="selectedStore && !isDropdownOpen" class="selected-store">
        <img
          v-if="selectedStore.logo"
          :src="selectedStore.logo"
          :alt="selectedStore.name"
          class="store-logo-small"
          @error="handleImageError"
        />
        <div v-else class="store-logo-placeholder">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <span class="store-name">{{ selectedStore.name }}</span>
        <span class="store-country">{{ selectedStore.country }}</span>
      </div>

      <input
        v-else
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="search-input"
        @click.stop="openDropdown"
        @input="handleSearch"
      />

      <!-- Clear Button -->
      <button
        v-if="selectedStore && !isDropdownOpen"
        @click.stop="clearSelection"
        class="clear-button"
        type="button"
        title="Clear selection"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <!-- Dropdown Arrow -->
      <div class="dropdown-arrow">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          :class="{ 'rotate-180': isDropdownOpen }"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>

    <!-- Dropdown List -->
    <Transition name="dropdown">
      <div v-if="isDropdownOpen" class="dropdown-list">
        <!-- Loading State -->
        <div v-if="storesStore.isLoading" class="loading-state">
          <div class="spinner"></div>
          <span>Loading stores...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="storesStore.error" class="error-state">
          <span>{{ storesStore.error }}</span>
        </div>

        <!-- Store List -->
        <div v-else-if="filteredStores.length > 0" class="stores-list">
          <div
            v-for="store in filteredStores"
            :key="store.id"
            class="store-item"
            :class="{ 'selected': store.id === modelValue }"
            @click="selectStore(store)"
          >
            <img
              v-if="store.logo"
              :src="store.logo"
              :alt="store.name"
              class="store-logo"
              @error="handleImageError"
            />
            <div v-else class="store-logo-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div class="store-info">
              <span class="store-name">{{ store.name }}</span>
              <div class="store-meta">
                <span class="store-country-badge">{{ store.country }}</span>
                <span class="store-category">{{ formatCategory(store.category) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <span>No stores found</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useStoresStore } from '@/stores/stores'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  placeholder: {
    type: String,
    default: 'Select a store'
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const storesStore = useStoresStore()
const searchQuery = ref('')
const isDropdownOpen = ref(false)
const searchInput = ref(null)

// Load stores on mount
onMounted(async () => {
  if (!storesStore.hasStores) {
    await storesStore.fetchStores()
  }
})

// Selected store computed property
const selectedStore = computed(() => {
  if (!props.modelValue) return null
  return storesStore.stores.find(store => store.id === props.modelValue)
})

// Filtered stores based on search query
const filteredStores = computed(() => {
  if (!searchQuery.value) {
    return storesStore.stores
  }

  const query = searchQuery.value.toLowerCase()
  return storesStore.stores.filter(store =>
    store.name.toLowerCase().includes(query) ||
    store.country.toLowerCase().includes(query) ||
    store.category.toLowerCase().includes(query)
  )
})

// Format category for display
function formatCategory(category) {
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Handle search input with debouncing
let searchTimeout
function handleSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // Search is handled by computed property
  }, 300)
}

// Toggle dropdown
function toggleDropdown() {
  if (isDropdownOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

// Open dropdown
function openDropdown() {
  isDropdownOpen.value = true
  searchQuery.value = ''
}

// Close dropdown
function closeDropdown() {
  isDropdownOpen.value = false
  searchQuery.value = ''
}

// Select a store
function selectStore(store) {
  emit('update:modelValue', store.id)
  closeDropdown()
}

// Clear selection
function clearSelection() {
  emit('update:modelValue', null)
}

// Handle image load errors
function handleImageError(event) {
  const storeName = event.target.alt || 'Unknown store'
  const logoUrl = event.target.src
  console.warn('Failed to load store logo:', storeName, logoUrl)
  event.target.style.display = 'none'
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  const picker = event.target.closest('.store-picker')
  if (!picker && isDropdownOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  clearTimeout(searchTimeout)
})
</script>

<style scoped>
.store-picker {
  position: relative;
  width: 100%;
}

.store-picker-input {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.store-picker-input:hover {
  border-color: #9ca3af;
}

.store-picker-input:focus-within {
  border-color: #3b82f6;
  outline: 2px solid rgba(59, 130, 246, 0.1);
}

.selected-store {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.store-logo-small,
.store-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
}

.store-logo {
  width: 32px;
  height: 32px;
}

.store-logo-placeholder {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 4px;
  color: #9ca3af;
}

.store-item .store-logo-placeholder {
  width: 32px;
  height: 32px;
}

.store-name {
  font-weight: 500;
  color: #1f2937;
  flex: 1;
}

.store-country {
  font-size: 12px;
  color: #6b7280;
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #1f2937;
}

.search-input::placeholder {
  color: #9ca3af;
}

.clear-button {
  padding: 4px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.clear-button:hover {
  color: #ef4444;
}

.dropdown-arrow {
  color: #9ca3af;
  display: flex;
  align-items: center;
  transition: transform 0.2s;
}

.dropdown-arrow svg {
  transition: transform 0.2s;
}

.dropdown-arrow svg.rotate-180 {
  transform: rotate(180deg);
}

.dropdown-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
}

.loading-state,
.error-state,
.empty-state {
  padding: 20px;
  text-align: center;
  color: #6b7280;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  color: #ef4444;
}

.stores-list {
  padding: 4px;
}

.store-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.store-item:hover {
  background: #f9fafb;
}

.store-item.selected {
  background: #eff6ff;
}

.store-info {
  flex: 1;
  min-width: 0;
}

.store-info .store-name {
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
}

.store-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.store-country-badge {
  font-size: 11px;
  font-weight: 600;
  color: #3b82f6;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.store-category {
  font-size: 11px;
  color: #6b7280;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Scrollbar styling */
.dropdown-list::-webkit-scrollbar {
  width: 6px;
}

.dropdown-list::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 8px;
}

.dropdown-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 8px;
}

.dropdown-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
