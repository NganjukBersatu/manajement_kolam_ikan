<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import NavIcon from '../components/NavIcon.vue'

const route = useRoute()
const jadwalTerbuka = ref(route.path.startsWith('/jadwal'))
const laporanTerbuka = ref(route.path.startsWith('/laporan'))

const menu = [
  { to: '/', label: 'Dashboard', icon: 'home' },
  { to: '/transaksi', label: 'Transaksi', icon: 'wallet' },
  { to: '/kolam', label: 'Daftar Kolam', icon: 'fish' },
]

const jadwalSub = [
  { to: '/jadwal/sortir', label: 'Sortir', icon: 'scissors' },
  { to: '/jadwal/panen', label: 'Panen', icon: 'fish' },
  { to: '/jadwal/pemberian-makan', label: 'Pemberian Makan', icon: 'utensils' },
  { to: '/jadwal/pemberian-obat', label: 'Pemberian Obat', icon: 'pill' }
]

const laporanSub = [
  { to: '/laporan', label: 'Ringkasan', icon: 'chart' },
  { to: '/laporan/pengeluaran', label: 'Pengeluaran', icon: 'file' }
]

const menuBawah = [
  { to: '/pengeluaran', label: 'Pengeluaran', icon: 'file' },
  { to: '/pengaturan', label: 'Pengaturan', icon: 'gear' }
]
</script>

<template>
  <aside class="w-64 bg-brand-700 text-white h-screen flex flex-col shrink-0">
    <div class="h-16 flex items-center gap-2 px-4 border-b border-white/10">
      <div class="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center font-bold text-brand-900">K</div>
      <span class="font-semibold">Kolam Ikan</span>
    </div>

    <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-1 text-[13.5px]">
      <router-link
        v-for="m in menu"
        :key="m.to"
        :to="m.to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10"
        exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
      >
        <NavIcon :name="m.icon" :size="16" /> {{ m.label }}
      </router-link>

      <button
        type="button"
        class="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10"
        @click="jadwalTerbuka = !jadwalTerbuka"
      >
        <span class="flex items-center gap-3">
          <NavIcon name="calendar" :size="16" /> Jadwal
        </span>
        <span :class="{ 'rotate-180': jadwalTerbuka }" class="transition-transform">▾</span>
      </button>
      <div v-show="jadwalTerbuka" class="pl-4 space-y-1">
        <router-link
          v-for="s in jadwalSub"
          :key="s.to"
          :to="s.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-[13px]"
          exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
        >
          <NavIcon :name="s.icon" :size="14" /> {{ s.label }}
        </router-link>
      </div>

      <button
        type="button"
        class="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10"
        @click="laporanTerbuka = !laporanTerbuka"
      >
        <span class="flex items-center gap-3">
          <NavIcon name="chart" :size="16" /> Laporan
        </span>
        <span :class="{ 'rotate-180': laporanTerbuka }" class="transition-transform">▾</span>
      </button>
      <div v-show="laporanTerbuka" class="pl-4 space-y-1">
        <router-link
          v-for="s in laporanSub"
          :key="s.to"
          :to="s.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-[13px]"
          exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
        >
          <NavIcon :name="s.icon" :size="14" /> {{ s.label }}
        </router-link>
      </div>

      <router-link
        v-for="m in menuBawah"
        :key="m.to"
        :to="m.to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10"
        exact-active-class="bg-white text-brand-700 font-semibold hover:bg-white"
      >
        <NavIcon :name="m.icon" :size="16" /> {{ m.label }}
      </router-link>
    </nav>
  </aside>
</template>