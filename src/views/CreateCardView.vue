<template>
  <div class="create-card-container">
    <div class="create-card-header">
      <h1>Add New Card</h1>
      <button @click="handleCancel" class="cancel-button">Back to Cards</button>
    </div>

    <div class="create-card-content">
      <p class="placeholder-message">
        Card creation form will be implemented in US-3.1
      </p>
      <p class="info-text">
        This page will contain a form to create new loyalty cards with fields for:
      </p>
      <ul class="feature-list">
        <li>Card Number (required)</li>
        <li>Card Name (optional)</li>
        <li>Barcode Type (required): EAN8, EAN13, CODE128, QR, AZTEC, PDF417</li>
        <li>Store ID (optional)</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function handleCancel() {
  router.push('/cards')
}
</script>

<style scoped>
.create-card-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.create-card-header {
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

.create-card-content {
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.placeholder-message {
  font-size: 18px;
  color: #e67e22;
  font-weight: 600;
  margin-bottom: 20px;
  padding: 15px;
  background: #fef5e7;
  border-left: 4px solid #e67e22;
  border-radius: 4px;
}

.info-text {
  font-size: 16px;
  color: #555;
  margin-bottom: 15px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  padding: 10px 15px;
  margin-bottom: 10px;
  background: #f9f9f9;
  border-left: 3px solid #3498db;
  border-radius: 4px;
  color: #333;
  font-size: 14px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .create-card-container {
    padding: 10px;
  }

  .create-card-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  h1 {
    font-size: 20px;
  }

  .create-card-content {
    padding: 20px;
  }

  .cancel-button {
    width: 100%;
  }
}
</style>
