<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="isOpen" class="dialog-overlay" @click.self="handleCancel">
        <div class="dialog-container">
          <div class="dialog-header">
            <h3>{{ title }}</h3>
          </div>
          <div class="dialog-body">
            <p>{{ message }}</p>
          </div>
          <div class="dialog-footer">
            <button
              @click="handleCancel"
              class="cancel-button"
              :disabled="isLoading"
            >
              Cancel
            </button>
            <button
              @click="handleConfirm"
              class="confirm-button"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Deleting...' : confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  if (!props.isLoading) {
    emit('cancel')
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  overflow: hidden;
}

.dialog-header {
  padding: 20px;
  border-bottom: 1px solid #ecf0f1;
}

.dialog-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.dialog-body {
  padding: 20px;
}

.dialog-body p {
  margin: 0;
  color: #555;
  font-size: 16px;
  line-height: 1.5;
}

.dialog-footer {
  padding: 20px;
  border-top: 1px solid #ecf0f1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-button,
.confirm-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.cancel-button {
  background: #95a5a6;
  color: white;
}

.cancel-button:hover:not(:disabled) {
  background: #7f8c8d;
}

.confirm-button {
  background: #e74c3c;
  color: white;
}

.confirm-button:hover:not(:disabled) {
  background: #c0392b;
}

.cancel-button:disabled,
.confirm-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Transition animations */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-active .dialog-container,
.dialog-leave-active .dialog-container {
  transition: transform 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-container,
.dialog-leave-to .dialog-container {
  transform: scale(0.9);
}

/* Responsive */
@media (max-width: 768px) {
  .dialog-container {
    width: 95%;
  }

  .dialog-footer {
    flex-direction: column-reverse;
  }

  .cancel-button,
  .confirm-button {
    width: 100%;
  }
}
</style>
