<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function keLogin() {
  router.push('/login')
}

function keRegister() {
  router.push('/register')
}
</script>

<template>
  <div class="min-h-screen bg-cream flex flex-col">
    <!-- Background decor -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl" />
      <div class="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-brand-400/10 blur-3xl" />
    </div>

    <div class="relative flex-1 flex flex-col items-center justify-center px-5 py-12">
      <!-- Logo & Branding -->
      <div class="flex flex-col items-center text-center mb-10">
        <div class="w-20 h-20 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/25 mb-5">
          <span class="text-white font-bold text-3xl tracking-tight">K</span>
        </div>

        <h1 class="text-ink-900 text-2xl sm:text-[28px] font-bold tracking-tight">
          Manajement Kolam
        </h1>
        <p class="text-ink-500 text-[14.5px] mt-2 max-w-[280px] leading-relaxed">
          Kelola budidaya ikan, udang, dan kepiting lebih mudah dari satu tempat.
        </p>
      </div>

      <!-- Card pilihan -->
      <div class="w-full max-w-[400px] bg-white rounded-2xl shadow-card border border-ink-100 p-6 sm:p-7">
        <h2 class="text-ink-900 text-[16px] font-semibold text-center mb-1">
          Selamat datang
        </h2>
        <p class="text-ink-500 text-[13px] text-center mb-6">
          Pilih cara untuk mulai menggunakan aplikasi
        </p>

        <!-- Tombol Buat Akun -->
        <button
          type="button"
          @click="keRegister"
          class="w-full flex items-center justify-center gap-2.5 rounded-xl bg-brand-500 text-white py-3.5 text-[14.5px] font-semibold hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm shadow-brand-500/20"
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
        <div class="flex items-center gap-3 my-5">
          <div class="flex-1 h-px bg-ink-100" />
          <span class="text-[12px] text-ink-400 font-medium">atau</span>
          <div class="flex-1 h-px bg-ink-100" />
        </div>

        <!-- Tombol Login -->
        <button
          type="button"
          @click="keLogin"
          class="w-full flex items-center justify-center gap-2.5 rounded-xl border-2 border-ink-100 text-ink-800 py-3.5 text-[14.5px] font-semibold hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/50 active:scale-[0.98] transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Sudah punya akun? Masuk
        </button>
      </div>

      <!-- Fitur singkat -->
      <div class="mt-10 grid grid-cols-3 gap-4 max-w-[400px] w-full">
        <div class="flex flex-col items-center text-center">
          <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <p class="text-[11.5px] text-ink-500 leading-snug">Pantau<br />stok kolam</p>
        </div>
        <div class="flex flex-col items-center text-center">
          <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p class="text-[11.5px] text-ink-500 leading-snug">Jadwal<br />otomatis</p>
        </div>
        <div class="flex flex-col items-center text-center">
          <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
          </div>
          <p class="text-[11.5px] text-ink-500 leading-snug">Laporan<br />keuangan</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <p class="relative text-center text-ink-400 text-[12px] pb-6">
      © {{ new Date().getFullYear() }} Manajement Kolam
    </p>
  </div>
</template>