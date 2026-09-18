<script setup>
import { useDialog } from '../composables/useDialog'

const { dialogState, handleConfirm, handleCancel } = useDialog()
</script>

<template>
  <Teleport to="body">
    <div v-if="dialogState.isOpen" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
        @click="dialogState.type === 'confirm' || dialogState.type === 'delete' ? handleCancel() : handleConfirm()"
      ></div>

      <!-- Modal Box -->
      <div class="relative bg-white dark:bg-ink-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-ink-100 dark:border-ink-700">
        <!-- Icon -->
        <div class="pt-6 pb-2 flex justify-center">
          <!-- Success Icon (Green Checkmark) -->
          <div
            v-if="dialogState.type === 'success'"
            class="w-14 h-14 rounded-full bg-ok-50 dark:bg-ok-900/20 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ok-500">
              <path d="M20 6 9 17l-5-5"></path>
            </svg>
          </div>

          <!-- Error Icon (Red X) -->
          <div
            v-else-if="dialogState.type === 'error'"
            class="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-red-500">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>

          <!-- Delete Icon (Red Trash) -->
          <div
            v-else-if="dialogState.type === 'delete'"
            class="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-red-500">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </div>

          <!-- Warning / Confirm Icon (Amber Alert) -->
          <div
            v-else
            class="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-500">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 pb-2 text-center">
          <h3 class="text-[16px] font-semibold text-ink-900 dark:text-white">
            {{ dialogState.title }}
          </h3>
          <p class="text-[13.5px] text-ink-500 dark:text-ink-300 mt-1.5 whitespace-pre-line leading-relaxed">
            {{ dialogState.message }}
          </p>
        </div>

        <!-- Buttons -->
        <div class="px-6 pb-6 pt-4">
          <!-- Confirm / Delete Dual Buttons -->
          <div v-if="dialogState.type === 'confirm' || dialogState.type === 'delete'" class="flex gap-3">
            <button
              type="button"
              class="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 dark:border-ink-600 text-[13.5px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700 transition"
              @click="handleCancel"
            >
              {{ dialogState.cancelText }}
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2.5 rounded-xl text-white text-[13.5px] font-medium transition"
              :class="dialogState.type === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-500 hover:bg-brand-600'"
              @click="handleConfirm"
            >
              {{ dialogState.confirmText }}
            </button>
          </div>

          <!-- Single Action Button (Success / Error / Info) -->
          <div v-else>
            <button
              type="button"
              class="w-full px-4 py-2.5 rounded-xl text-white text-[13.5px] font-medium transition"
              :class="{
                'bg-ok-500 hover:bg-ok-600': dialogState.type === 'success',
                'bg-red-500 hover:bg-red-600': dialogState.type === 'error',
                'bg-amber-500 hover:bg-amber-600': dialogState.type === 'warning',
                'bg-brand-500 hover:bg-brand-600': dialogState.type === 'info'
              }"
              @click="handleConfirm"
            >
              {{ dialogState.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
