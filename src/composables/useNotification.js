import { ref } from 'vue'

const notifications = ref([])
let notificationId = 0

export function useNotification() {
  function showNotification(message, type = 'success', duration = 3000) {
    const id = notificationId++
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'info'
      visible: true
    }

    notifications.value.push(notification)

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  function removeNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  function success(message, duration = 3000) {
    return showNotification(message, 'success', duration)
  }

  function error(message, duration = 5000) {
    return showNotification(message, 'error', duration)
  }

  function info(message, duration = 3000) {
    return showNotification(message, 'info', duration)
  }

  return {
    notifications,
    showNotification,
    removeNotification,
    success,
    error,
    info
  }
}
