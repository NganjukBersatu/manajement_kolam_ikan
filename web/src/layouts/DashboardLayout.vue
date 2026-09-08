<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import NavIcon from '../components/NavIcon.vue'
import Header from '../components/Header.vue'
import { logout } from '../utils/auth.js'

const route = useRoute()
const collapsed = ref(false)
const jadwalTerbuka = ref(route.path.startsWith('/jadwal'))
const laporanTerbuka = ref(route.path.startsWith('/laporan'))

const menu = [
  { to: '/', label: 'Dashboard', icon: 'home' },
  { to: '/transaksi', label: 'Transaksi', icon: 'wallet' },
  { to: '/kolam', label: 'Daftar Kolam', icon: 'fish' },
]

const jadwalSub = [
  { to: '/jadwal/pemberian-makan', label: 'Pemberian Makan', icon: 'utensils' },
  { to: '/jadwal/pemberian-obat', label: 'Pemberian Obat', icon: 'pill' } ,
  { to: '/jadwal/sortir', label: 'Sortir', icon: 'scissors' },
  { to: '/jadwal/panen', label: 'Panen', icon: 'fish' }
]

const laporanSub = [
  { to: '/laporan', label: 'Ringkasan', icon: 'chart' },
  { to: '/laporan/penjualan', label: 'Penjualan', icon: 'wallet' },
  { to: '/laporan/pengeluaran', label: 'Pengeluaran', icon: 'file' }
]

function toggleSidebar() {
  collapsed.value = !collapsed.value
  if (collapsed.value) {
    jadwalTerbuka.value = false
    laporanTerbuka.value = false
  }
}

function bukaJadwal() {
  if (collapsed.value) {
    collapsed.value = false
    setTimeout(() => { jadwalTerbuka.value = true }, 150)
  } else {
    jadwalTerbuka.value = !jadwalTerbuka.value
  }
}

function bukaLaporan() {
  if (collapsed.value) {
    collapsed.value = false
    setTimeout(() => { laporanTerbuka.value = true }, 150)
  } else {
    laporanTerbuka.value = !laporanTerbuka.value
  }
}

function konfirmasiLogout() {
  if (confirm('Yakin ingin keluar dari dashboard?')) {
    logout()
  }
}
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- SIDEBAR -->
    <aside
      :class="[
        'bg-brand-700 text-white h-screen flex flex-col shrink-0 transition-all duration-300 relative',
        collapsed ? 'w-[72px]' : 'w-64'
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center gap-2 px-4 border-b border-white/10 overflow-hidden">
        <div class="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center font-bold text-brand-900 shrink-0">
          K
        </div>
        <span v-show="!collapsed" class="font-semibold whitespace-nowrap">Kolam Ikan</span>

        <!-- Tombol tutup (hanya muncul saat sidebar terbuka) -->
        <button
          v-if="!collapsed"
          type="button"
          @click="toggleSidebar"
          class="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition"
          title="Tutup menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <!-- Navigasi -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1 text-[13.5px]">

        <!-- Tombol buka sidebar (hanya muncul saat tertutup, di atas Dashboard) -->
        <button
          v-if="collapsed"
          type="button"
          @click="toggleSidebar"
          class="w-full flex items-center justify-center px-3 py-2.5 rounded-lg hover:bg-white/10 transition text-white/80 hover:text-white mb-1"
          title="Buka menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="rotate-180">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <!-- Menu utama -->
        <router-link
          v-for="m in menu"
          :key="m.to"
          :to="m.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition"
          :class="collapsed ? 'justify-center' : ''"
          exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
          :title="collapsed ? m.label : ''"
        >
          <NavIcon :name="m.icon" :size="16" class="shrink-0" />
          <span v-show="!collapsed" class="whitespace-nowrap">{{ m.label }}</span>
        </router-link>

        <!-- Jadwal -->
        <div>
          <button
            type="button"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition"
            :class="collapsed ? 'justify-center' : 'justify-between'"
            @click="bukaJadwal"
            :title="collapsed ? 'Jadwal' : ''"
          >
            <span class="flex items-center gap-3">
              <NavIcon name="calendar" :size="16" class="shrink-0" />
              <span v-show="!collapsed">Jadwal</span>
            </span>
            <span v-show="!collapsed" :class="{ 'rotate-180': jadwalTerbuka }" class="transition-transform">▾</span>
          </button>

          <div v-show="jadwalTerbuka && !collapsed" class="pl-4 space-y-1 mt-1">
            <router-link
              v-for="s in jadwalSub"
              :key="s.to"
              :to="s.to"
              class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-[13px]"
              exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
            >
              <NavIcon :name="s.icon" :size="14" />
              {{ s.label }}
            </router-link>
          </div>
        </div>

        <!-- Pengeluaran -->
        <router-link
          to="/pengeluaran"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition"
          :class="collapsed ? 'justify-center' : ''"
          exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
          :title="collapsed ? 'Pengeluaran' : ''"
        >
          <NavIcon name="file" :size="16" class="shrink-0" />
          <span v-show="!collapsed" class="whitespace-nowrap">Pengeluaran</span>
        </router-link>

        <!-- Stok Pakan -->
        <router-link
          to="/stok-pakan"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition"
          :class="collapsed ? 'justify-center' : ''"
          exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
          :title="collapsed ? 'Stok Pakan' : ''"
        >
          <NavIcon name="package" :size="16" class="shrink-0" />
          <span v-show="!collapsed" class="whitespace-nowrap">Stok Pakan</span>
        </router-link>

        <!-- Laporan -->
        <div>
          <button
            type="button"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition"
            :class="collapsed ? 'justify-center' : 'justify-between'"
            @click="bukaLaporan"
            :title="collapsed ? 'Laporan' : ''"
          >
            <span class="flex items-center gap-3">
              <NavIcon name="chart" :size="16" class="shrink-0" />
              <span v-show="!collapsed">Laporan</span>
            </span>
            <span v-show="!collapsed" :class="{ 'rotate-180': laporanTerbuka }" class="transition-transform">▾</span>
          </button>

          <div v-show="laporanTerbuka && !collapsed" class="pl-4 space-y-1 mt-1">
            <router-link
              v-for="s in laporanSub"
              :key="s.to"
              :to="s.to"
              class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-[13px]"
              exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
            >
              <NavIcon :name="s.icon" :size="14" />
              {{ s.label }}
            </router-link>
          </div>
        </div>

        <!-- Pengaturan -->
        <router-link
          to="/pengaturan"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition"
          :class="collapsed ? 'justify-center' : ''"
          exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
          :title="collapsed ? 'Pengaturan' : ''"
        >
          <NavIcon name="gear" :size="16" class="shrink-0" />
          <span v-show="!collapsed" class="whitespace-nowrap">Pengaturan</span>
        </router-link>
      </nav>

      <!-- Tombol Keluar -->
      <div class="px-2 py-3 border-t border-white/10">
        <button
          type="button"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-[13.5px] text-left transition"
          :class="collapsed ? 'justify-center' : ''"
          @click="konfirmasiLogout"
          :title="collapsed ? 'Keluar' : ''"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span v-show="!collapsed">Keluar</span>
        </button>
      </div>
    </aside>

    <!-- Konten kanan -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <Header />
      <main class="flex-1 overflow-y-auto p-6 bg-ink-50 dark:bg-ink-900">
        <router-view />
      </main>
    </div>
  </div>
</template>