# Store Selection & Display Implementation Plan

## Overview
This plan outlines the implementation of store selection when creating/editing cards and displaying store information when viewing cards.

## Current State

### What's Already Implemented
- ✅ `storeId` field exists in card forms (CreateCardView, EditCardView)
- ✅ Cards accept optional `storeId` UUID field in API requests
- ✅ API returns nested `store` object when fetching cards
- ✅ Store endpoints are available: `GET /stores` and `GET /stores/{id}`
- ✅ Manual UUID input field exists but is not user-friendly

### What's Missing
- ❌ Store API service file
- ❌ Store Pinia store for state management
- ❌ Store picker/selector component
- ❌ Store display in card list and detail views
- ❌ Search and filtering UI for stores

---

## Implementation Plan

### Phase 1: API & State Management

#### 1.1 Create Store API Service
**File**: `/src/api/stores.js`

```javascript
import apiClient from './axios'

export const storesApi = {
  /**
   * Fetch all stores with optional filters
   * @param {Object} filters - { search, country, category }
   */
  async getStores(filters = {}) {
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.country) params.append('country', filters.country)
    if (filters.category) params.append('category', filters.category)

    const response = await apiClient.get(`/stores?${params}`)
    return response.data.data // Returns array of stores
  },

  /**
   * Fetch a specific store by ID
   * @param {string} id - Store UUID
   */
  async getStoreById(id) {
    const response = await apiClient.get(`/stores/${id}`)
    return response.data.data
  }
}
```

#### 1.2 Create Store Pinia Store
**File**: `/src/stores/stores.js`

```javascript
import { defineStore } from 'pinia'
import { storesApi } from '@/api/stores'

export const useStoresStore = defineStore('stores', {
  state: () => ({
    stores: [],           // All stores
    selectedStore: null,  // Currently selected store
    filters: {
      search: '',
      country: '',
      category: ''
    },
    isLoading: false,
    error: null
  }),

  getters: {
    // Filtered stores based on current filters
    filteredStores: (state) => {
      let result = state.stores

      if (state.filters.search) {
        result = result.filter(store =>
          store.name.toLowerCase().includes(state.filters.search.toLowerCase())
        )
      }

      if (state.filters.country) {
        result = result.filter(store => store.country === state.filters.country)
      }

      if (state.filters.category) {
        result = result.filter(store => store.category === state.filters.category)
      }

      return result
    },

    // Check if stores are loaded
    hasStores: (state) => state.stores.length > 0
  },

  actions: {
    async fetchStores(filters = {}) {
      this.isLoading = true
      this.error = null

      try {
        this.stores = await storesApi.getStores(filters)
      } catch (err) {
        this.error = err.response?.data?.error?.message || 'Failed to fetch stores'
        console.error('Error fetching stores:', err)
      } finally {
        this.isLoading = false
      }
    },

    async fetchStoreById(id) {
      this.isLoading = true
      this.error = null

      try {
        this.selectedStore = await storesApi.getStoreById(id)
        return this.selectedStore
      } catch (err) {
        this.error = err.response?.data?.error?.message || 'Failed to fetch store'
        console.error('Error fetching store:', err)
        return null
      } finally {
        this.isLoading = false
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    },

    clearFilters() {
      this.filters = { search: '', country: '', category: '' }
    },

    selectStore(store) {
      this.selectedStore = store
    },

    clearSelectedStore() {
      this.selectedStore = null
    }
  }
})
```

---

### Phase 2: UI Components

#### 2.1 Create Store Picker Component
**File**: `/src/components/StorePicker.vue`

This component will be a searchable dropdown that:
- Loads stores on mount
- Provides search/filter functionality
- Allows selection of a store
- Displays store logo and name
- Emits selected store ID to parent

**Features**:
- Searchable dropdown (autocomplete-style)
- Display store logo + name + country
- Optional: Filter by country/category
- Clear selection button
- Loading state while fetching stores
- Empty state when no stores match

**Props**:
- `modelValue` (String) - Current storeId (for v-model)
- `placeholder` (String) - Placeholder text
- `required` (Boolean) - Whether store selection is required

**Emits**:
- `update:modelValue` - When store is selected/cleared

#### 2.2 Create Store Display Component
**File**: `/src/components/StoreDisplay.vue`

This component displays store information in read-only format:
- Store logo (if available)
- Store name
- Country flag or code
- Category badge
- Link to website (if available)

**Props**:
- `store` (Object) - Store object to display
- `size` (String) - 'small', 'medium', 'large' for different contexts

---

### Phase 3: Integration with Card Forms

#### 3.1 Update CreateCardView.vue

**Changes Required**:
1. Import `StorePicker` component
2. Replace the manual storeId input field (lines 62-75) with `<StorePicker v-model="formData.storeId" />`
3. Remove manual UUID validation for storeId (line 215)
4. Add store picker validation (optional - based on requirements)

**Before** (lines 62-75):
```vue
<div>
  <label for="storeId" class="block text-sm font-medium text-gray-700 mb-1">
    Store ID (Optional)
  </label>
  <input
    v-model="formData.storeId"
    type="text"
    id="storeId"
    placeholder="Enter store UUID (optional)"
    class="w-full px-3 py-2 border border-gray-300 rounded-lg"
  />
  <p v-if="formErrors.storeId" class="mt-1 text-sm text-red-600">
    {{ formErrors.storeId }}
  </p>
</div>
```

**After**:
```vue
<div>
  <label class="block text-sm font-medium text-gray-700 mb-1">
    Store (Optional)
  </label>
  <StorePicker
    v-model="formData.storeId"
    placeholder="Select a store (optional)"
  />
  <p v-if="formErrors.storeId" class="mt-1 text-sm text-red-600">
    {{ formErrors.storeId }}
  </p>
</div>
```

#### 3.2 Update EditCardView.vue

**Changes Required**:
1. Import `StorePicker` component
2. Replace the manual storeId input field (lines 79-93) with `<StorePicker v-model="formData.storeId" />`
3. Remove manual UUID validation for storeId

Similar changes as CreateCardView.

---

### Phase 4: Display Store in Card Views

#### 4.1 Update CardsView.vue (Card List)

**Changes Required**:
1. Import `StoreDisplay` component
2. Modify card item rendering to show store information
3. Add store logo/name to each card in the grid

**Implementation** (around lines 30-50 in template):
```vue
<div
  v-for="card in cardsStore.cards"
  :key="card.id"
  class="bg-white rounded-lg shadow p-4"
>
  <!-- Store Display at top of card -->
  <StoreDisplay
    v-if="card.store"
    :store="card.store"
    size="small"
    class="mb-3"
  />

  <!-- Existing card information -->
  <h3 class="text-lg font-semibold">
    {{ card.cardName || 'Unnamed Card' }}
  </h3>
  <p class="text-gray-600 text-sm">{{ card.cardNumber }}</p>
  <p class="text-gray-500 text-xs">{{ card.barcodeType }}</p>

  <!-- Action buttons -->
  <div class="mt-4 flex gap-2">
    <button @click="viewCard(card.id)">View</button>
    <button @click="editCard(card.id)">Edit</button>
    <button @click="confirmDelete(card.id)">Delete</button>
  </div>
</div>
```

#### 4.2 Update CardDetailView.vue

**Changes Required**:
1. Import `StoreDisplay` component
2. Add store information section below card details (after line 68)
3. Display full store information with logo, website link, etc.

**Implementation** (insert after line 68):
```vue
<!-- Store Information Section -->
<div v-if="card.store" class="mt-6">
  <h3 class="text-lg font-semibold mb-3">Store Information</h3>
  <StoreDisplay :store="card.store" size="large" />
</div>
```

---

## File Structure Summary

```
src/
├── api/
│   ├── axios.js              (existing)
│   ├── cards.js              (existing)
│   └── stores.js             ⭐ NEW
├── stores/
│   ├── auth.js               (existing)
│   ├── cards.js              (existing)
│   └── stores.js             ⭐ NEW
├── components/
│   ├── ConfirmDialog.vue     (existing)
│   ├── StorePicker.vue       ⭐ NEW
│   └── StoreDisplay.vue      ⭐ NEW
└── views/
    ├── CardsView.vue         🔧 MODIFY
    ├── CardDetailView.vue    🔧 MODIFY
    ├── CreateCardView.vue    🔧 MODIFY
    └── EditCardView.vue      🔧 MODIFY
```

---

## Implementation Order

### Step 1: Foundation (API & State)
1. Create `/src/api/stores.js`
2. Create `/src/stores/stores.js`
3. Test store fetching manually in browser console

### Step 2: Components
4. Create `StorePicker.vue` component
5. Create `StoreDisplay.vue` component
6. Test components in isolation

### Step 3: Integration
7. Update `CreateCardView.vue` to use StorePicker
8. Update `EditCardView.vue` to use StorePicker
9. Test card creation/editing with store selection

### Step 4: Display
10. Update `CardsView.vue` to display stores in card list
11. Update `CardDetailView.vue` to show full store information
12. Test complete flow: create card with store → view in list → view details

---

## API Data Reference

### Store Object Structure
```javascript
{
  id: "550e8400-e29b-41d4-a716-446655440001",
  name: "Albert Heijn",
  logo: "https://example.com/logo.png",  // nullable
  country: "NL",
  website: "https://www.ah.nl",          // nullable
  category: "grocery"
}
```

### Card Response with Store
```javascript
{
  id: "card-uuid",
  cardNumber: "1234567890",
  cardName: "My Card",
  barcodeType: "EAN13",
  storeId: "store-uuid",
  store: {
    id: "store-uuid",
    name: "Albert Heijn",
    logo: "...",
    country: "NL",
    website: "...",
    category: "grocery"
  },
  createdAt: 1735732800,
  updatedAt: 1735732800
}
```

### Store API Endpoints
- `GET /api/v1/stores?search=albert&country=NL&category=grocery`
- `GET /api/v1/stores/{id}`

### Store Categories
- grocery, pharmacy, department_store, diy, electronics, fashion, sports, home, books, beauty

### Supported Countries
- NL, BE, DE, FR, UK, AT, LU, CH

---

## UI/UX Considerations

### Store Picker Component
- **Search**: Debounced search input (300ms delay)
- **Display**: Show store logo + name + country flag
- **Sorting**: Sort stores alphabetically by name
- **Empty State**: "No stores found" message
- **Clear Button**: Allow users to deselect store
- **Keyboard Navigation**: Arrow keys to navigate, Enter to select

### Store Display Component
- **Small Size**: Logo (24x24) + Name only (for card list)
- **Medium Size**: Logo (32x32) + Name + Country (for forms)
- **Large Size**: Logo (48x48) + Name + Country + Category + Website link (for detail view)

### Card List Enhancement
- Show store logo prominently on each card
- Consider color-coding by category
- Group cards by store (optional future enhancement)

---

## Testing Checklist

### API & State
- [ ] Stores API service fetches all stores correctly
- [ ] Stores API service filters by search term
- [ ] Stores API service filters by country
- [ ] Stores API service filters by category
- [ ] Pinia store loads stores on mount
- [ ] Pinia store manages selected store correctly

### Components
- [ ] StorePicker displays all stores
- [ ] StorePicker search filters correctly
- [ ] StorePicker selection emits correct store ID
- [ ] StorePicker clears selection properly
- [ ] StoreDisplay shows store information in all sizes
- [ ] StoreDisplay handles null logo/website gracefully

### Integration
- [ ] CreateCardView: Can select store when creating card
- [ ] CreateCardView: Can create card without store
- [ ] CreateCardView: Selected store ID is sent to API
- [ ] EditCardView: Pre-populates store if card has one
- [ ] EditCardView: Can change store
- [ ] EditCardView: Can remove store
- [ ] CardsView: Displays store for each card
- [ ] CardsView: Shows placeholder when card has no store
- [ ] CardDetailView: Shows full store information
- [ ] CardDetailView: Shows message when card has no store

### End-to-End
- [ ] Create card with store → View in list → Store displays correctly
- [ ] Create card without store → Add store via edit → Store displays correctly
- [ ] Edit card to remove store → Store removed from display
- [ ] Search stores while creating card → Correct results shown
- [ ] Select store → Card saves with correct storeId

---

## Future Enhancements (Optional)

1. **Store Management**
   - Allow users to request new stores be added
   - Favorite stores for quick access
   - Recent stores list

2. **Advanced Filtering**
   - Multiple country selection
   - Multiple category selection
   - Sort by popularity

3. **UI Improvements**
   - Country flags instead of codes
   - Category icons
   - Store card grid view
   - Store preview on hover

4. **Offline Support**
   - Cache stores in localStorage
   - Sync on reconnection

5. **Analytics**
   - Track most popular stores
   - Store usage statistics

---

## Notes

- Store data is public and requires no authentication
- Store selection is optional for cards
- Stores are read-only reference data (no create/update/delete)
- Store logos may be null - handle gracefully with fallback icons
- Consider lazy loading stores (only load when StorePicker is opened)
- Keep store picker simple initially, add advanced features later
