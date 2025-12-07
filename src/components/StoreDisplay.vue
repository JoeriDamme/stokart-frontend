<template>
  <div class="store-display" :class="`size-${size}`">
    <!-- Store Logo -->
    <div class="store-logo-container">
      <img
        v-if="store.logo"
        :src="store.logo"
        :alt="store.name"
        class="store-logo"
        @error="handleImageError"
      />
      <div v-else class="store-logo-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    </div>

    <!-- Store Information -->
    <div class="store-info">
      <h4 class="store-name">{{ store.name }}</h4>

      <div class="store-meta">
        <!-- Country Badge -->
        <span class="store-country">{{ store.country }}</span>

        <!-- Category (only for medium and large) -->
        <span v-if="size !== 'small'" class="store-category">
          {{ formatCategory(store.category) }}
        </span>
      </div>

      <!-- Website Link (only for large) -->
      <a
        v-if="size === 'large' && store.website"
        :href="store.website"
        target="_blank"
        rel="noopener noreferrer"
        class="store-website"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
        Visit website
      </a>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  store: {
    type: Object,
    required: true,
    validator: (value) => {
      return value && value.id && value.name && value.country && value.category
    }
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => {
      return ['small', 'medium', 'large'].includes(value)
    }
  }
})

// Format category for display
function formatCategory(category) {
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Handle image load errors
function handleImageError(event) {
  console.warn('Failed to load store logo:', props.store.name, props.store.logo)
  event.target.style.display = 'none'
}
</script>

<style scoped>
.store-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Size variants */
.store-display.size-small {
  gap: 8px;
}

.store-display.size-large {
  gap: 16px;
  align-items: flex-start;
}

/* Logo Container */
.store-logo-container {
  flex-shrink: 0;
}

.store-logo {
  display: block;
  object-fit: contain;
  border-radius: 6px;
}

/* Logo sizes based on display size */
.size-small .store-logo {
  width: 24px;
  height: 24px;
}

.size-medium .store-logo {
  width: 32px;
  height: 32px;
}

.size-large .store-logo {
  width: 48px;
  height: 48px;
}

/* Logo placeholder */
.store-logo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 6px;
  color: #9ca3af;
}

.size-small .store-logo-placeholder {
  width: 24px;
  height: 24px;
}

.size-small .store-logo-placeholder svg {
  width: 14px;
  height: 14px;
}

.size-medium .store-logo-placeholder {
  width: 32px;
  height: 32px;
}

.size-medium .store-logo-placeholder svg {
  width: 18px;
  height: 18px;
}

.size-large .store-logo-placeholder {
  width: 48px;
  height: 48px;
}

.size-large .store-logo-placeholder svg {
  width: 24px;
  height: 24px;
}

/* Store Info */
.store-info {
  flex: 1;
  min-width: 0;
}

.store-name {
  margin: 0;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.size-small .store-name {
  font-size: 14px;
  line-height: 1.4;
}

.size-medium .store-name {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 4px;
}

.size-large .store-name {
  font-size: 18px;
  line-height: 1.5;
  margin-bottom: 6px;
}

/* Store Meta */
.store-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.size-small .store-meta {
  gap: 6px;
}

.store-country {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: #3b82f6;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1.2;
}

.size-large .store-country {
  font-size: 12px;
  padding: 3px 8px;
}

.store-category {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1.2;
}

.size-large .store-category {
  font-size: 12px;
  padding: 3px 8px;
}

/* Website Link */
.store-website {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 14px;
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s;
}

.store-website:hover {
  color: #2563eb;
  text-decoration: underline;
}

.store-website svg {
  flex-shrink: 0;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .size-large .store-logo {
    width: 40px;
    height: 40px;
  }

  .size-large .store-name {
    font-size: 16px;
  }
}
</style>
