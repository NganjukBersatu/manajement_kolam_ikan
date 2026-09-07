<script setup>
import { useRoute } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import NavIcon from './NavIcon.vue'

const route = useRoute()
const { isDark, toggle } = useTheme()
</script>

<template>
  <header class="h-16 flex items-center justify-between px-6 bg-white dark:bg-ink-900 border-b border-ink-100 dark:border-ink-700 shrink-0">
    <!-- Judul halaman -->
    <div>
      <h1 class="text-[17px] font-semibold text-ink-900 dark:text-white">
        {{ route.meta.title || 'Dashboard' }}
      </h1>
      <p v-if="route.meta.subtitle" class="text-xs text-ink-400 dark:text-ink-300 mt-0.5">
        {{ route.meta.subtitle }}
      </p>
    </div>

    <!-- Kanan: Mode + Profil -->
    <div class="flex items-center gap-3">
      <!-- Tombol Mode Gelap/Terang -->
      <button
        type="button"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-ink-600 dark:text-white hover:bg-ink-100 dark:hover:bg-ink-700 shrink-0 transition"
        @click="toggle"
        aria-label="Ganti tema"
      >
        <NavIcon :name="isDark ? 'sun' : 'moon'" :size="18" />
      </button>

      <!-- Profil -->
      <div class="flex items-center gap-2.5 pl-3 border-l border-ink-100 dark:border-ink-700">
        <div class="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
          A
        </div>
        <div class="hidden sm:block leading-tight">
          <p class="text-[13.5px] font-medium text-ink-900 dark:text-white">Admin</p>
          <p class="text-[11.5px] text-ink-400 dark:text-ink-300">Administrator</p>
        </div>
      </div>
    </div>
  </header>
</template>