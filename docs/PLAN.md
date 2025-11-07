# Stokard Clone Frontend - Vue 3 Implementation Plan

## 📦 Tech Stack

- **Framework:** Vue 3 (Composition API)
- **Build Tool:** Vite
- **UI Framework:** Vuetify 3 (Material Design)
- **State Management:** Pinia
- **HTTP Client:** Axios
- **Routing:** Vue Router 4
- **Form Validation:** VeeValidate + Yup
- **Barcode Display:** jsbarcode, vue-qrcode-component

## 🎯 Project Goals

Build a simple web application that consumes the stokard Clone API to:
- Authenticate users (login/register)
- Display user's loyalty cards
- Create/edit/delete cards
- Show barcode for each card
- Support pagination

## 📁 Project Structure

```
stokard-frontend/
├── public/                    # Static assets
├── src/
│   ├── api/                   # API client & endpoints
│   │   ├── client.js         # Axios instance with JWT interceptors
│   │   ├── auth.js           # Auth endpoints (login, register, refresh)
│   │   └── cards.js          # Card endpoints (CRUD, list)
│   ├── assets/               # Images, icons
│   ├── components/
│   │   ├── cards/
│   │   │   ├── CardList.vue          # Cards grid/list display
│   │   │   ├── CardItem.vue          # Single card in list
│   │   │   ├── CardForm.vue          # Create/Edit form
│   │   │   ├── CardBarcode.vue       # Barcode display component
│   │   │   └── CardDeleteDialog.vue  # Delete confirmation
│   │   ├── layout/
│   │   │   ├── AppBar.vue            # Top navigation bar
│   │   │   ├── NavDrawer.vue         # Side navigation (optional)
│   │   │   └── AppFooter.vue         # Footer
│   │   └── auth/
│   │       ├── LoginForm.vue
│   │       └── RegisterForm.vue
│   ├── composables/          # Reusable Vue composables
│   │   ├── useAuth.js       # Auth logic (login, logout, token refresh)
│   │   ├── useCards.js      # Cards CRUD logic
│   │   └── useApi.js        # Generic API helpers
│   ├── layouts/
│   │   ├── DefaultLayout.vue # Layout with AppBar
│   │   └── AuthLayout.vue    # Layout for login/register
│   ├── plugins/
│   │   ├── vuetify.js       # Vuetify configuration
│   │   └── router.js        # Router configuration
│   ├── router/
│   │   └── index.js         # Route definitions
│   ├── stores/              # Pinia stores
│   │   ├── auth.js         # Auth state (user, token, isAuthenticated)
│   │   └── cards.js        # Cards state (list, current card, pagination)
│   ├── views/              # Page components
│   │   ├── auth/
│   │   │   ├── LoginView.vue
│   │   │   └── RegisterView.vue
│   │   ├── cards/
│   │   │   ├── CardsListView.vue     # List all cards (paginated)
│   │   │   ├── CardDetailView.vue    # View single card with barcode
│   │   │   ├── CardCreateView.vue    # Create new card
│   │   │   └── CardEditView.vue      # Edit existing card
│   │   ├── HomeView.vue              # Landing/dashboard
│   │   └── NotFoundView.vue          # 404 page
│   ├── App.vue
│   └── main.js
├── .env.development         # API_BASE_URL=http://localhost:8000
├── .env.production         # Production API URL
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🚀 Setup Instructions

### 1. Create Project

```bash
# Navigate to parent directory (same level as symfony backend)
cd /Users/joeridamme/Developer/personal/php

# Create new Vue 3 project with Vite
npm create vite@latest stokard-frontend -- --template vue

# Navigate into project
cd stokard-frontend
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install vue-router@4 pinia axios vuetify@3 @mdi/font

# Barcode libraries
npm install jsbarcode vue-qrcode-component

# Form validation
npm install vee-validate yup

# Dev dependencies
npm install -D sass
```

### 3. Configure Environment

Create `.env.development`:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Create `.env.production`:
```env
VITE_API_BASE_URL=https://your-production-api.com/api/v1
```

## 🔑 Core Features

### 1. Authentication Flow

**Login Page**
- Email and password input
- Client-side validation
- JWT token storage in localStorage
- Redirect to cards list on success
- Display error messages from API

**Register Page**
- Name, email, password fields
- Password complexity requirements (8+ chars, uppercase, lowercase, number)
- Client-side validation matching API requirements
- Auto-login after registration
- Display error messages from API

**Token Management**
- Store JWT access token in localStorage
- Store refresh token in localStorage
- Automatic token refresh via Axios interceptor
- Auto-logout on token expiration
- Clear tokens on logout

**Protected Routes**
- Navigation guard checks authentication
- Redirect to login if not authenticated
- Redirect to cards if authenticated user tries to access login/register

### 2. Cards Management

**Cards List View**
- Display all user's cards in a grid/list
- Pagination controls (page, limit)
- Empty state when no cards
- Quick actions per card (view, edit, delete)
- Search/filter (optional)
- Loading state during API calls

**Card Detail View**
- Display full card information
- Show barcode (based on type: EAN8, EAN13, CODE128, QR, etc.)
- Copy card number to clipboard
- Download barcode as image (optional)
- Edit and delete buttons

**Create Card Form**
- Fields: cardNumber, cardName (optional), barcodeType, storeId (optional)
- Dropdown for barcode type selection (EAN8, EAN13, CODE128, QR, AZTEC, PDF417)
- Client-side validation matching API requirements
- Real-time barcode preview
- Submit to POST /api/v1/cards

**Edit Card Form**
- Pre-filled form with existing card data
- Same validation as create form
- Submit to PUT /api/v1/cards/{id}
- Barcode regeneration when cardNumber or type changes

**Delete Card**
- Confirmation dialog before deletion
- Submit to DELETE /api/v1/cards/{id}
- Remove from list on success
- Show success notification

### 3. Barcode Display

**Supported Types**
- EAN8, EAN13, CODE128: Use jsbarcode library
- QR: Use vue-qrcode-component
- AZTEC, PDF417: Fallback display (show text, future enhancement)

**Features**
- Responsive sizing
- High DPI/resolution for printing
- Copy barcode data to clipboard
- Download as image (PNG/SVG)

### 4. UI/UX Features

**Responsive Design**
- Mobile-first approach
- Works on phones, tablets, desktops
- Vuetify's responsive grid system

**Loading States**
- Skeleton loaders during data fetch
- Loading spinners for actions
- Disable buttons during submission

**Error Handling**
- Display API errors in snackbar/alerts
- Form validation errors inline
- 404 page for invalid routes
- Network error handling

**Notifications**
- Success snackbar on actions (created, updated, deleted)
- Error alerts for failed actions
- Auto-dismiss after 3-5 seconds

## 🛠️ Implementation Details

### API Client Setup

**src/api/client.js**
```javascript
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const apiClient = axios.create({
baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
headers: {
'Content-Type': 'application/json'
}
})

// Request interceptor - add JWT token
apiClient.interceptors.request.use(
config => {
const authStore = useAuthStore()
if (authStore.token) {
config.headers.Authorization = `Bearer ${authStore.token}`
}
return config
},
error => Promise.reject(error)
)

// Response interceptor - handle errors and token refresh
apiClient.interceptors.response.use(
response => response,
async error => {
const originalRequest = error.config

// Handle 401 Unauthorized - token expired
if (error.response?.status === 401 && !originalRequest._retry) {
originalRequest._retry = true

try {
const authStore = useAuthStore()
await authStore.refreshAccessToken()

// Retry original request with new token
originalRequest.headers.Authorization = `Bearer ${authStore.token}`
return apiClient(originalRequest)
} catch (refreshError) {
// Refresh failed, logout user
const authStore = useAuthStore()
authStore.logout()
router.push('/login')
return Promise.reject(refreshError)
}
}

return Promise.reject(error)
}
)

export default apiClient
```

### Router Configuration

**src/router/index.js**
```javascript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Import views
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import CardsListView from '@/views/cards/CardsListView.vue'
import CardDetailView from '@/views/cards/CardDetailView.vue'
import CardCreateView from '@/views/cards/CardCreateView.vue'
import CardEditView from '@/views/cards/CardEditView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

const routes = [
{
path: '/',
name: 'home',
component: HomeView
},
{
path: '/login',
name: 'login',
component: LoginView,
meta: { requiresGuest: true }
},
{
path: '/register',
name: 'register',
component: RegisterView,
meta: { requiresGuest: true }
},
{
path: '/cards',
name: 'cards',
component: CardsListView,
meta: { requiresAuth: true }
},
{
path: '/cards/create',
name: 'card-create',
component: CardCreateView,
meta: { requiresAuth: true }
},
{
path: '/cards/:id',
name: 'card-detail',
component: CardDetailView,
meta: { requiresAuth: true }
},
{
path: '/cards/:id/edit',
name: 'card-edit',
component: CardEditView,
meta: { requiresAuth: true }
},
{
path: '/:pathMatch(.*)*',
name: 'not-found',
component: NotFoundView
}
]

const router = createRouter({
history: createWebHistory(),
routes
})

// Navigation guard - check authentication
router.beforeEach((to, from, next) => {
const authStore = useAuthStore()

if (to.meta.requiresAuth && !authStore.isAuthenticated) {
// Redirect to login if route requires auth and user is not authenticated
next({ name: 'login', query: { redirect: to.fullPath } })
} else if (to.meta.requiresGuest && authStore.isAuthenticated) {
// Redirect to cards if route is for guests only and user is authenticated
next({ name: 'cards' })
} else {
next()
}
})

export default router
```

### Pinia Store - Auth

**src/stores/auth.js**
```javascript
import { defineStore } from 'pinia'
import { login as apiLogin, register as apiRegister, refreshToken as apiRefreshToken } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
state: () => ({
user: JSON.parse(localStorage.getItem('user') || 'null'),
token: localStorage.getItem('token'),
refreshToken: localStorage.getItem('refreshToken')
}),

getters: {
isAuthenticated: (state) => !!state.token,
userName: (state) => state.user?.name || '',
userEmail: (state) => state.user?.email || ''
},

actions: {
async login(credentials) {
try {
const { data } = await apiLogin(credentials)
this.setAuth(data)
return data
} catch (error) {
throw error
}
},

async register(userData) {
try {
const { data } = await apiRegister(userData)
this.setAuth(data)
return data
} catch (error) {
throw error
}
},

async refreshAccessToken() {
try {
const { data } = await apiRefreshToken(this.refreshToken)
this.token = data.accessToken
this.refreshToken = data.refreshToken
localStorage.setItem('token', data.accessToken)
localStorage.setItem('refreshToken', data.refreshToken)
return data
} catch (error) {
this.logout()
throw error
}
},

setAuth(data) {
this.user = data.user
this.token = data.accessToken
this.refreshToken = data.refreshToken

localStorage.setItem('user', JSON.stringify(data.user))
localStorage.setItem('token', data.accessToken)
localStorage.setItem('refreshToken', data.refreshToken)
},

logout() {
this.user = null
this.token = null
this.refreshToken = null

localStorage.removeItem('user')
localStorage.removeItem('token')
localStorage.removeItem('refreshToken')
}
}
})
```

### Pinia Store - Cards

**src/stores/cards.js**
```javascript
import { defineStore } from 'pinia'
import { listCards, getCard, createCard, updateCard, deleteCard } from '@/api/cards'

export const useCardsStore = defineStore('cards', {
state: () => ({
cards: [],
currentCard: null,
pagination: {
currentPage: 1,
perPage: 20,
total: 0,
lastPage: 1
},
loading: false,
error: null
}),

getters: {
hasCards: (state) => state.cards.length > 0,
cardById: (state) => (id) => state.cards.find(card => card.id === id)
},

actions: {
async fetchCards(page = 1, limit = 20) {
this.loading = true
this.error = null

try {
const { data } = await listCards(page, limit)
this.cards = data.data
this.pagination = data.pagination
return data
} catch (error) {
this.error = error.message
throw error
} finally {
this.loading = false
}
},

async fetchCard(id) {
this.loading = true
this.error = null

try {
const { data } = await getCard(id)
this.currentCard = data
return data
} catch (error) {
this.error = error.message
throw error
} finally {
this.loading = false
}
},

async createCard(cardData) {
this.loading = true
this.error = null

try {
const { data } = await createCard(cardData)
this.cards.unshift(data) // Add to beginning of list
return data
} catch (error) {
this.error = error.message
throw error
} finally {
this.loading = false
}
},

async updateCard(id, cardData) {
this.loading = true
this.error = null

try {
const { data } = await updateCard(id, cardData)
const index = this.cards.findIndex(c => c.id === id)
if (index !== -1) {
this.cards[index] = data
}
return data
} catch (error) {
this.error = error.message
throw error
} finally {
this.loading = false
}
},

async deleteCard(id) {
this.loading = true
this.error = null

try {
await deleteCard(id)
this.cards = this.cards.filter(c => c.id !== id)
return true
} catch (error) {
this.error = error.message
throw error
} finally {
this.loading = false
}
}
}
})
```

## 🎨 Vuetify Theme Configuration

**src/plugins/vuetify.js**
```javascript
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

export default createVuetify({
components,
directives,
icons: {
defaultSet: 'mdi',
aliases,
sets: {
mdi
}
},
theme: {
defaultTheme: 'light',
themes: {
light: {
dark: false,
colors: {
primary: '#2196F3',    // Blue - matches API specs
secondary: '#424242',  // Dark grey
accent: '#FF5722',     // Deep orange
error: '#FF5252',      // Red
info: '#2196F3',       // Blue
success: '#4CAF50',    // Green
warning: '#FB8C00',    // Orange
background: '#F5F5F5', // Light grey background
surface: '#FFFFFF'     // White surface
}
},
dark: {
dark: true,
colors: {
primary: '#2196F3',
secondary: '#424242',
accent: '#FF5722',
error: '#FF5252',
info: '#2196F3',
success: '#4CAF50',
warning: '#FB8C00'
}
}
}
}
})
```

## 🔄 Development Workflow

### Terminal 1: Backend (Symfony)
```bash
cd /Users/joeridamme/Developer/personal/php/stokart
symfony server:start

# API available at http://localhost:8000
# API Docs at http://localhost:8000/api/doc
```

### Terminal 2: Frontend (Vue)
```bash
cd /Users/joeridamme/Developer/personal/php/stokard-frontend
npm run dev

# Frontend available at http://localhost:5173
```

### CORS Configuration

Add to Symfony's `config/packages/nelmio_cors.yaml`:
```yaml
nelmio_cors:
defaults:
origin_regex: true
allow_origin: ['http://localhost:5173', 'http://127.0.0.1:5173']
allow_methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
allow_headers: ['Content-Type', 'Authorization']
expose_headers: ['Link']
max_age: 3600
paths:
'^/api/': ~
```

## 📝 Implementation Checklist

### Phase 1: Setup & Configuration
- [ ] Create Vue 3 project with Vite
- [ ] Install all dependencies
- [ ] Configure Vuetify
- [ ] Setup Vue Router
- [ ] Create Pinia stores
- [ ] Setup Axios client with interceptors
- [ ] Configure environment variables

### Phase 2: Authentication
- [ ] Create LoginView with form
- [ ] Create RegisterView with form
- [ ] Implement login API call
- [ ] Implement register API call
- [ ] Add token storage and management
- [ ] Add navigation guards
- [ ] Test authentication flow

### Phase 3: Layout & Navigation
- [ ] Create AppBar component
- [ ] Create DefaultLayout
- [ ] Create AuthLayout
- [ ] Add navigation menu
- [ ] Add logout button
- [ ] Test responsive design

### Phase 4: Cards List
- [ ] Create CardsListView
- [ ] Create CardItem component
- [ ] Fetch cards from API
- [ ] Display cards in grid
- [ ] Add pagination controls
- [ ] Add empty state
- [ ] Add loading state

### Phase 5: Card Detail & Barcode
- [ ] Create CardDetailView
- [ ] Create CardBarcode component
- [ ] Implement barcode display (jsbarcode)
- [ ] Implement QR code display
- [ ] Add copy to clipboard
- [ ] Add download barcode feature

### Phase 6: Card CRUD
- [ ] Create CardCreateView
- [ ] Create CardEditView
- [ ] Create CardForm component
- [ ] Add form validation (VeeValidate)
- [ ] Implement create API call
- [ ] Implement update API call
- [ ] Create DeleteDialog component
- [ ] Implement delete API call

### Phase 7: Testing & Polish
- [ ] Test all user flows
- [ ] Add error handling
- [ ] Add success notifications
- [ ] Fix responsive issues
- [ ] Add loading states
- [ ] Improve UX/UI
- [ ] Test on mobile devices

### Phase 8: Deployment Preparation
- [ ] Create production build
- [ ] Test production build locally
- [ ] Prepare deployment instructions
- [ ] Update README with setup instructions

## 🚀 Deployment Options

### Option 1: Netlify (Recommended for frontend)
1. Build: `npm run build`
2. Deploy `dist/` folder to Netlify
3. Configure environment variables in Netlify dashboard
4. Free SSL certificate included

### Option 2: Vercel
1. Connect GitHub repository
2. Vercel auto-detects Vite project
3. Configure environment variables
4. Auto-deploy on push

### Option 3: Static Hosting (Traditional)
1. Build: `npm run build`
2. Upload `dist/` folder to web server
3. Configure web server for SPA routing
4. Serve over HTTPS

## 📚 Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vuetify 3 Documentation](https://vuetifyjs.com/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Axios Documentation](https://axios-http.com/)
- [VeeValidate Documentation](https://vee-validate.logaretm.com/)

## 🎯 Success Criteria

The frontend is considered complete when:
- ✅ Users can register and login
- ✅ JWT tokens are managed automatically
- ✅ Users can view their cards list with pagination
- ✅ Users can create new cards with all barcode types
- ✅ Users can edit existing cards
- ✅ Users can delete cards with confirmation
- ✅ Barcodes are displayed correctly for each type
- ✅ Application is responsive on mobile and desktop
- ✅ Error handling works properly
- ✅ Loading states are shown during API calls

## ⏱️ Estimated Timeline

- **Setup & Configuration:** 2-3 hours
- **Authentication:** 3-4 hours
- **Layout & Navigation:** 2-3 hours
- **Cards List:** 3-4 hours
- **Card Detail & Barcode:** 4-5 hours
- **Card CRUD:** 5-6 hours
- **Testing & Polish:** 3-4 hours

**Total:** ~25-30 hours for complete MVP

---

**Last Updated:** November 3, 2025
**Status:** Planning Phase
**Next Step:** Create Vue 3 project structure
