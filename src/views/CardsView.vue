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
      <p style="color: #666; margin-top: 20px;">
        Cards list view - To be implemented in US-2.1
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push('/login')
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
  text-align: center;
}

.welcome-message {
  font-size: 18px;
  color: #333;
  font-weight: 500;
}
</style>
