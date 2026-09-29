<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppBranding } from '../composables/useAppBranding.js'
import { useBusinessSettings } from '../composables/useBusinessSettings.js'
import NavIcon from '../components/NavIcon.vue'

const router = useRouter()

// Nama & logo dari Pengaturan (sama seperti Login)
const { branding } = useAppBranding()
const { settings: usaha } = useBusinessSettings()
const logoUsaha = computed(() => usaha.value?.logo || '')
const logoGagal = ref(false)
watch(logoUsaha, () => (logoGagal.value = false))

const poin = [
  'Pantau stok kolam secara real-time',
  'Jadwal pakan, obat, dan panen otomatis',
  'Laporan keuangan budidaya tiap bulan'
]

function keLogin() {
  router.push('/login')
}

function keRegister() {
  router.push('/register')
}
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-cream dark:bg-ink-900">
    <!-- ===== Panel kiri ===== -->
    <aside class="relative hidden lg:flex flex-col justify-between overflow-hidden bg-brand-700 text-white p-12">
      <div class="flex items-center gap-3 relative z-10">
        <div class="w-11 h-11 rounded-xl bg-gold-500 flex items-center justify-center text-brand-900 overflow-hidden shrink-0">
          <img
            v-if="logoUsaha && !logoGagal"
            :src="logoUsaha"
            alt="Logo"
            class="w-full h-full object-cover"
            @error="logoGagal = true"
          />
          <NavIcon v-else name="kolam" :size="22" />
        </div>
        <span class="font-semibold text-[16px] truncate max-w-[18rem]">
          {{ branding.namaAplikasi }}
        </span>
      </div>

      <!-- Riak air -->
      <svg
        class="absolute -right-32 -bottom-32 w-[640px] h-[640px] pointer-events-none"
        viewBox="0 0 600 600"
        fill="none"
        aria-hidden="true"
      >
        <circle class="riak" style="animation-delay: 0s" cx="300" cy="300" r="280" stroke="#D9A448" stroke-width="1.5" />
        <circle class="riak" style="animation-delay: 1.5s" cx="300" cy="300" r="280" stroke="#D9A448" stroke-width="1.5" />
        <circle class="riak" style="animation-delay: 3s" cx="300" cy="300" r="280" stroke="#D9A448" stroke-width="1.5" />
        <circle cx="300" cy="300" r="210" stroke="#2C7A74" stroke-opacity="0.5" stroke-width="1.5" />
        <circle cx="300" cy="300" r="140" stroke="#2C7A74" stroke-opacity="0.6" stroke-width="1.5" />
        <circle cx="300" cy="300" r="70" stroke="#2C7A74" stroke-opacity="0.8" stroke-width="1.5" />
        <circle cx="300" cy="300" r="10" fill="#D9A448" />
      </svg>

      <div class="relative z-10 max-w-md">
        <h2 class="text-[34px] leading-[1.15] font-bold tracking-tight">
          Mulai kelola kolam dengan lebih mudah.
        </h2>
        <p class="mt-4 text-brand-100 text-[15px] leading-relaxed">
          Satu aplikasi untuk memantau budidaya ikan, udang, dan kepiting dari mana saja.
        </p>
        <ul class="mt-8 space-y-3 text-[14px] text-white/90">
          <li v-for="t in poin" :key="t" class="flex items-start gap-3">
            <svg
              class="mt-0.5 shrink-0 text-gold-400"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {{ t }}
          </li>
        </ul>
      </div>
    </aside>

    <!-- ===== Panel kanan ===== -->
    <main class="flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-[380px]">
        <!-- Logo mobile -->
        <div class="lg:hidden flex items-center gap-3 mb-10">
          <div class="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center text-white overflow-hidden shrink-0">
            <img
              v-if="logoUsaha && !logoGagal"
              :src="logoUsaha"
              alt="Logo"
              class="w-full h-full object-cover"
              @error="logoGagal = true"
            />
            <NavIcon v-else name="kolam" :size="22" />
          </div>
          <span class="font-semibold text-ink-900 dark:text-white truncate">
            {{ branding.namaAplikasi }}
          </span>
        </div>

        <h1 class="text-ink-900 dark:text-white text-[28px] font-bold tracking-tight">
          Selamat datang
        </h1>
        <p class="text-ink-500 dark:text-ink-300 text-[14px] mt-1.5">
          Pilih cara untuk mulai menggunakan aplikasi.
        </p>

        <div class="mt-8 space-y-4">
          <!-- Buat Akun -->
          <button
            type="button"
            @click="keRegister"
            class="w-full rounded-card bg-brand-500 text-white py-3.5 text-[14.5px] font-semibold hover:bg-brand-600 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 transition-all flex items-center justify-center gap-2.5 shadow-sm shadow-brand-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Buat Akun Baru
          </button>

          <!-- Divider -->
          <div class="flex items-center gap-3">
            <div class="flex-1 h-px bg-ink-100 dark:bg-ink-600" />
            <span class="text-[12px] text-ink-400 font-medium">atau</span>
            <div class="flex-1 h-px bg-ink-100 dark:bg-ink-600" />
          </div>

          <!-- Masuk -->
          <button
            type="button"
            @click="keLogin"
            class="w-full rounded-card border border-ink-100 dark:border-ink-500 bg-white dark:bg-ink-700 text-ink-800 dark:text-white py-3.5 text-[14.5px] font-semibold hover:border-brand-400 hover:text-brand-600 dark:hover:border-brand-400 dark:hover:text-brand-400 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 transition-all flex items-center justify-center gap-2.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Sudah punya akun? Masuk
          </button>
        </div>

        <p class="text-ink-400 dark:text-ink-400 text-[12.5px] mt-10 text-center">
          © {{ new Date().getFullYear() }} {{ branding.namaAplikasi }}
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.riak {
  transform-box: fill-box;
  transform-origin: center;
  animation: riak 6s ease-out infinite;
  opacity: 0;
}

@keyframes riak {
  0% { transform: scale(0.15); opacity: 0.55; }
  100% { transform: scale(1); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .riak {
    animation: none;
    opacity: 0;
  }
}
</style>