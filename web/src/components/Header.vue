<script setup>
import { useRoute } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import NavIcon from './NavIcon.vue'

const route = useRoute()
const { isDark, toggle } = useTheme()
</script>

<template>
  <header class="h-16 flex items-center justify-between px-6 bg-white dark:bg-ink-900 border-b border-ink-100 dark:border-ink-700 shrink-0">
    <div>
      <h1 class="text-[17px] font-semibold text-ink-900 dark:text-white">{{ route.meta.title || 'Dashboard' }}</h1>
      <p v-if="route.meta.subtitle" class="text-xs text-ink-400 dark:text-ink-300 mt-0.5">{{ route.meta.subtitle }}</p>
    </div>
    <button
      type="button"
      class="w-9 h-9 flex items-center justify-center rounded-lg text-ink-600 dark:text-white hover:bg-ink-100 dark:hover:bg-ink-700 shrink-0"
      @click="toggle"
      aria-label="Ganti tema"
    >
      <NavIcon :name="isDark ? 'sun' : 'moon'" :size="18" />
    </button>
  </header>
</template>