<script setup>
import { useRoute } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import NavIcon from './NavIcon.vue'

const route = useRoute()
const { isDark, toggle } = useTheme()
</script>

<template>
  <header class="h-16 flex items-center justify-between px-6 bg-white dark:bg-ink-900 border-b border-ink-100 dark:border-ink-700">
    <h1 class="text-[17px] font-semibold">{{ route.meta.title || 'Dashboard' }}</h1>
    <button
      type="button"
      class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700"
      @click="toggle"
      aria-label="Ganti tema"
    >
      <NavIcon :name="isDark ? 'sun' : 'moon'" :size="18" />
    </button>
  </header>
</template>