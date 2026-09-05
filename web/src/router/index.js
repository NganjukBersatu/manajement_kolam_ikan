import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'

const routes = [
  {
    path: '/',
    component: DashboardLayout,
    children: [
      { path: '', name: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: 'Dashboard' } },
      { path: 'transaksi', name: 'transaksi', component: () => import('../views/Transaksi.vue'), meta: { title: 'Transaksi Penjualan' } },
      { path: 'jadwal/sortir', name: 'jadwal-sortir', component: () => import('../views/JadwalSortir.vue'), meta: { title: 'Jadwal Sortir' } },
      { path: 'jadwal/panen', name: 'jadwal-panen', component: () => import('../views/JadwalPanen.vue'), meta: { title: 'Jadwal Panen' } },
      { path: 'kolam', name: 'kolam', component: () => import('../views/Kolam.vue'), meta: { title: 'Daftar Kolam' } },
      { path: 'pengeluaran', name: 'pengeluaran', component: () => import('../views/Pengeluaran.vue'), meta: { title: 'Pengeluaran' } },
      
      // Laporan
      { path: 'laporan', name: 'laporan', component: () => import('../views/Laporan.vue'), meta: { title: 'Laporan Ringkasan' } },
      { path: 'laporan/pengeluaran', name: 'laporan-pengeluaran', component: () => import('../views/LaporanPengeluaran.vue'), meta: { title: 'Laporan Pengeluaran' } },
      
      { path: 'pengaturan', name: 'pengaturan', component: () => import('../views/Pengaturan.vue'), meta: { title: 'Pengaturan' } }
    ]
  }
]

export default createRouter({ history: createWebHistory(), routes })