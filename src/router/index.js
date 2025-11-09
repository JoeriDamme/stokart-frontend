import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import RegisterView from '@/views/RegisterView.vue'
import LoginView from '@/views/LoginView.vue'
import CardsView from '@/views/CardsView.vue'
import CreateCardView from '@/views/CreateCardView.vue'
import CardDetailView from '@/views/CardDetailView.vue'
import EditCardView from '@/views/EditCardView.vue'

const routes = [
  {
    path: '/',
    redirect: '/cards'
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { requiresGuest: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresGuest: true }
  },
  {
    path: '/cards',
    name: 'cards',
    component: CardsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/cards/new',
    name: 'create-card',
    component: CreateCardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/cards/:id/edit',
    name: 'edit-card',
    component: EditCardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/cards/:id',
    name: 'card-detail',
    component: CardDetailView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Store the intended destination
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
  }
  // Check if route requires guest (not authenticated)
  else if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'cards' })
  }
  else {
    next()
  }
})

export default router
