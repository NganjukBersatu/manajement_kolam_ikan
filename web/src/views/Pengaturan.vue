<script setup>
import { ref, onMounted } from 'vue'
import { useTheme } from '../composables/useTheme.js'

const { isDark, toggle } = useTheme()
const akun = ref({ nama: '', email: '' })
const saving = ref(false)

async function muat() {
  const res = await fetch('/api/pengaturan/akun')
  const json = await res.json()
  akun.value = { nama: json.data.nama, email: json.data.email || '' }
}

async function simpan() {
  saving.value = true
  await fetch('/api/pengaturan/akun', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(akun.value)
  })
  saving.value = false
}

onMounted(muat)
</script>

<template>
  <div class="space-y-6 max-w-lg">
    <section class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
      <h2 class="text-[15px] font-semibold dark:text-white mb-4">Pengaturan Akun</h2>
      <form class="space-y-3" @submit.prevent="simpan">
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama</label>
          <input v-model="akun.nama" type="text" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
        </div>
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Email</label>
          <input v-model="akun.email" type="email" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
        </div>
        <button type="submit" :disabled="saving" class="rounded-lg bg-brand-500 text-white px-4 py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-60">
          {{ saving ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </form>
    </section>

    <section class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
      <h2 class="text-[15px] font-semibold dark:text-white mb-4">Tampilan</h2>
      <div class="flex items-center justify-between">
        <p class="text-[13.5px] dark:text-ink-100">Mode {{ isDark ? 'Gelap' : 'Terang' }}</p>
        <button
          type="button"
          class="w-12 h-6 rounded-full flex items-center px-0.5 transition-colors"
          :class="isDark ? 'bg-brand-500 justify-end' : 'bg-ink-100 dark:bg-ink-500 justify-start'"
          @click="toggle"
        >
          <span class="w-5 h-5 rounded-full bg-white shadow" />
        </button>
      </div>
    </section>
  </div>
</template>