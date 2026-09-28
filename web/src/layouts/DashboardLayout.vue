<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import NavIcon from '../components/NavIcon.vue'
import Header from '../components/Header.vue'
import { logout } from '../utils/auth.js'
import { useBusinessSettings } from '../composables/useBusinessSettings.js'
import { useAppBranding } from '../composables/useAppBranding.js'

const route = useRoute()
const collapsed = ref(false)
const mobileOpen = ref(false)
const jadwalTerbuka = ref(route.path.startsWith('/jadwal'))
const laporanTerbuka = ref(route.path.startsWith('/laporan'))

const { settings: usaha } = useBusinessSettings()
const { branding, label } = useAppBranding()

// Nama usaha di bawah nama aplikasi (diatur di Pengaturan > Usaha)
const namaUsahaTampil = computed(() => {
  const nama = usaha.value?.namaUsaha?.trim()
  if (!nama || nama === 'Usaha Saya') return null
  return nama
})

// Logo dari Pengaturan > Usaha. Kalau kosong, pakai ikon bawaan.
const logoUsaha = computed(() => usaha.value?.logo || '')
const logoGagal = ref(false)
watch(logoUsaha, () => (logoGagal.value = false))

const showLogoutModal = ref(false)

// `key` harus sama dengan key di useAppBranding.js supaya namanya bisa diubah dari Pengaturan
const menu = [
  { to: '/', key: 'dashboard', icon: 'home' },
  { to: '/transaksi', key: 'transaksi', icon: 'wallet' },
  { to: '/kolam', key: 'kolam', icon: 'fish' },
  { to: '/jenis-ikan', key: 'jenis-ikan', icon: 'list' }
]

const jadwalSub = [
  { to: '/jadwal/pemberian-makan', key: 'pemberian-makan', icon: 'utensils' },
  { to: '/jadwal/pemberian-obat', key: 'pemberian-obat', icon: 'pill' },
  { to: '/jadwal/sortir', key: 'sortir', icon: 'scissors' },
  { to: '/jadwal/panen', key: 'panen', icon: 'fish' },
  { to: '/jadwal/ganti-air', key: 'ganti-air', icon: 'droplet' }
]

const menuLain = [
  { to: '/pengeluaran', key: 'pengeluaran', icon: 'file' },
  { to: '/stok-pakan', key: 'stok-pakan', icon: 'package' }
]

const laporanSub = [
  { to: '/laporan', key: 'laporan-ringkasan', icon: 'chart' },
  { to: '/laporan/penjualan', key: 'laporan-penjualan', icon: 'wallet' },
  { to: '/laporan/pengeluaran', key: 'laporan-pengeluaran', icon: 'file' },
  { to: '/laporan/panen', key: 'laporan-panen', icon: 'fish' }
]

// Tutup drawer mobile saat pindah halaman
watch(() => route.path, () => {
  mobileOpen.value = false
})

function isDesktop() {
  return window.innerWidth >= 1024
}

function toggleSidebar() {
  if (isDesktop()) {
    collapsed.value = !collapsed.value
    if (collapsed.value) {
      jadwalTerbuka.value = false
      laporanTerbuka.value = false
    }
  } else {
    mobileOpen.value = !mobileOpen.value
  }
}

function bukaJadwal() {
  if (collapsed.value && isDesktop()) {
    collapsed.value = false
    setTimeout(() => { jadwalTerbuka.value = true }, 150)
  } else {
    jadwalTerbuka.value = !jadwalTerbuka.value
  }
}

function bukaLaporan() {
  if (collapsed.value && isDesktop()) {
    collapsed.value = false
    setTimeout(() => { laporanTerbuka.value = true }, 150)
  } else {
    laporanTerbuka.value = !laporanTerbuka.value
  }
}

function bukaModalLogout() {
  showLogoutModal.value = true
}

function tutupModalLogout() {
  showLogoutModal.value = false
}

function konfirmasiLogout() {
  showLogoutModal.value = false
  logout()
}

function handleResize() {
  if (isDesktop()) mobileOpen.value = false
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Overlay mobile -->
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="mobileOpen = false"
    />

    <!-- SIDEBAR -->
    <aside
      :class="[
        'bg-brand-700 text-white h-screen flex flex-col shrink-0 transition-all duration-300 z-50',
        'hidden lg:flex',
        collapsed ? 'lg:w-[72px]' : 'lg:w-64',
        mobileOpen ? '!flex fixed inset-y-0 left-0 w-64 shadow-2xl' : ''
      ]"
    >
      <!-- Logo + Nama aplikasi + Nama usaha -->
      <div class="min-h-16 flex items-center gap-2.5 px-4 border-b border-white/10 overflow-hidden py-3">
        <div class="w-9 h-9 rounded-lg bg-gold-500 flex items-center justify-center text-brand-900 shrink-0 overflow-hidden">
          <img
            v-if="logoUsaha && !logoGagal"
            :src="logoUsaha"
            :alt="`Logo ${namaUsahaTampil || branding.namaAplikasi}`"
            class="w-full h-full object-cover"
            @error="logoGagal = true"
          />
          <NavIcon v-else name="kolam" :size="18" />
        </div>

        <div v-show="!collapsed || mobileOpen" class="min-w-0 flex-1">
          <p
            class="font-semibold text-[13.5px] leading-tight whitespace-nowrap truncate"
            :title="branding.namaAplikasi"
          >
            {{ branding.namaAplikasi }}
          </p>
          <p
            v-if="namaUsahaTampil"
            class="text-[11.5px] text-white/70 leading-tight mt-0.5 truncate"
            :title="namaUsahaTampil"
          >
            {{ namaUsahaTampil }}
          </p>
        </div>

        <button
          type="button"
          @click="toggleSidebar"
          class="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition shrink-0"
          title="Tutup menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <!-- Navigasi -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1 text-[13.5px]">
        <button
          v-if="collapsed && !mobileOpen"
          type="button"
          @click="toggleSidebar"
          class="w-full flex items-center justify-center px-3 py-2.5 rounded-lg hover:bg-white/10 transition text-white/80 hover:text-white mb-1"
          title="Buka menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="rotate-180">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <router-link
          v-for="m in menu"
          :key="m.to"
          :to="m.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition"
          :class="collapsed && !mobileOpen ? 'justify-center' : ''"
          exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
          :title="collapsed && !mobileOpen ? label(m.key) : ''"
        >
          <NavIcon :name="m.icon" :size="16" class="shrink-0" />
          <span v-show="!collapsed || mobileOpen" class="whitespace-nowrap">{{ label(m.key) }}</span>
        </router-link>

        <!-- Jadwal -->
        <div>
          <button
            type="button"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition"
            :class="collapsed && !mobileOpen ? 'justify-center' : 'justify-between'"
            @click="bukaJadwal"
            :title="collapsed && !mobileOpen ? label('jadwal') : ''"
          >
            <span class="flex items-center gap-3">
              <NavIcon name="calendar" :size="16" class="shrink-0" />
              <span v-show="!collapsed || mobileOpen">{{ label('jadwal') }}</span>
            </span>
            <span v-show="!collapsed || mobileOpen" :class="{ 'rotate-180': jadwalTerbuka }" class="transition-transform">▾</span>
          </button>

          <div v-show="jadwalTerbuka && (!collapsed || mobileOpen)" class="pl-4 space-y-1 mt-1">
            <router-link
              v-for="s in jadwalSub"
              :key="s.to"
              :to="s.to"
              class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-[13px]"
              exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
            >
              <NavIcon :name="s.icon" :size="14" />
              {{ label(s.key) }}
            </router-link>
          </div>
        </div>

        <router-link
          v-for="m in menuLain"
          :key="m.to"
          :to="m.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition"
          :class="collapsed && !mobileOpen ? 'justify-center' : ''"
          exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
          :title="collapsed && !mobileOpen ? label(m.key) : ''"
        >
          <NavIcon :name="m.icon" :size="16" class="shrink-0" />
          <span v-show="!collapsed || mobileOpen" class="whitespace-nowrap">{{ label(m.key) }}</span>
        </router-link>

        <!-- Laporan -->
        <div>
          <button
            type="button"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition"
            :class="collapsed && !mobileOpen ? 'justify-center' : 'justify-between'"
            @click="bukaLaporan"
            :title="collapsed && !mobileOpen ? label('laporan') : ''"
          >
            <span class="flex items-center gap-3">
              <NavIcon name="chart" :size="16" class="shrink-0" />
              <span v-show="!collapsed || mobileOpen">{{ label('laporan') }}</span>
            </span>
            <span v-show="!collapsed || mobileOpen" :class="{ 'rotate-180': laporanTerbuka }" class="transition-transform">▾</span>
          </button>

          <div v-show="laporanTerbuka && (!collapsed || mobileOpen)" class="pl-4 space-y-1 mt-1">
            <router-link
              v-for="s in laporanSub"
              :key="s.to"
              :to="s.to"
              class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-[13px]"
              exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
            >
              <NavIcon :name="s.icon" :size="14" />
              {{ label(s.key) }}
            </router-link>
          </div>
        </div>

        <router-link
          to="/pengaturan"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition"
          :class="collapsed && !mobileOpen ? 'justify-center' : ''"
          exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
          :title="collapsed && !mobileOpen ? label('pengaturan') : ''"
        >
          <NavIcon name="gear" :size="16" class="shrink-0" />
          <span v-show="!collapsed || mobileOpen" class="whitespace-nowrap">{{ label('pengaturan') }}</span>
        </router-link>
      </nav>

      <!-- Keluar -->
      <div class="px-2 py-3 border-t border-white/10">
        <button
          type="button"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-[13.5px] text-left transition"
          :class="collapsed && !mobileOpen ? 'justify-center' : ''"
          @click="bukaModalLogout"
          :title="collapsed && !mobileOpen ? 'Keluar' : ''"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span v-show="!collapsed || mobileOpen">Keluar</span>
        </button>
      </div>
    </aside>

    <!-- Konten kanan -->
    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <Header :on-open-sidebar="() => (mobileOpen = true)" />
      <main class="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-ink-50 dark:bg-ink-900">
        <router-view />
      </main>
    </div>

    <!-- Modal Logout -->
    <Teleport to="body">
      <div v-if="showLogoutModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px]" @click="tutupModalLogout"></div>
        <div class="relative bg-white dark:bg-ink-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div class="pt-6 pb-2 flex justify-center">
            <div class="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
          </div>
          <div class="px-6 pb-2 text-center">
            <h3 class="text-[16px] font-semibold text-ink-900 dark:text-white">Keluar dari Dashboard?</h3>
            <p class="text-[13.5px] text-ink-500 dark:text-ink-300 mt-1.5 leading-relaxed">
              Kamu akan keluar dari akun ini. Data yang belum disimpan mungkin hilang.
            </p>
          </div>
          <div class="px-6 pb-6 pt-4 flex gap-3">
            <button type="button" @click="tutupModalLogout" class="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 dark:border-ink-600 text-[13.5px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700 transition">
              Batal
            </button>
            <button type="button" @click="konfirmasiLogout" class="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13.5px] font-medium transition">
              Ya, Keluar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>