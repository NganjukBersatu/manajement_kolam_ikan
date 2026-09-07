import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { isLoggedIn } from '../utils/auth.js'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { public: true, title: 'Login' }
  },
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

const router = createRouter({ history: createWebHistory(), routes })

// Route guard: cek token sebelum masuk ke halaman mana pun
router.beforeEach((to, from, next) => {
  const loggedIn = isLoggedIn()

  // Halaman publik (cuma /login): kalau sudah login, jangan biarkan buka /login lagi
  if (to.meta.public) {
    if (loggedIn && to.name === 'login') return next('/')
    return next()
  }

  // Halaman lain semuanya butuh login
  if (!loggedIn) {
    return next({ name: 'login' })
  }

  next()
})

export default router