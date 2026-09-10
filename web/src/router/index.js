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
      { path: '', name: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: 'Dashboard', subtitle: 'Ringkasan aktivitas budidaya, status kolam, dan performa keuangan' } },
      { path: 'transaksi', name: 'transaksi', component: () => import('../views/Transaksi.vue'), meta: { title: 'Transaksi Penjualan', subtitle: 'Catat dan pantau transaksi penjualan ikan langsung dari kolam' } },
      { path: 'jadwal/sortir', name: 'jadwal-sortir', component: () => import('../views/JadwalSortir.vue'), meta: { title: 'Jadwal Sortir', subtitle: 'Pantau dan catat kegiatan sortir ukuran dan kematian ikan' } },
      { path: 'jadwal/panen', name: 'jadwal-panen', component: () => import('../views/JadwalPanen.vue'), meta: { title: 'Jadwal Panen', subtitle: 'Jadwal panen ikan dan pencatatan hasil panen per kolam' } },
      { path: 'jadwal/ganti-air', name: 'jadwal-ganti-air', component: () => import('../views/JadwalGantiAir.vue'), meta: { title: 'Jadwal Ganti Air', subtitle: 'Jadwal pengurasan dan sirkulasi air untuk menjaga kualitas kolam' } },
      { path: 'jadwal/pemberian-makan', name: 'jadwal-pemberian-makan', component: () => import('../views/JadwalPemberianMakan.vue'), meta: { title: 'Jadwal Pemberian Makan', subtitle: 'Pencatatan pemberian pakan harian sesi pagi, siang, dan sore' } },
      { path: 'jadwal/pemberian-obat', name: 'jadwal-pemberian-obat', component: () => import('../views/JadwalPemberianObat.vue'), meta: { title: 'Jadwal Pemberian Obat', subtitle: 'Jadwal dan riwayat pemberian vitamin serta obat pencegahan hama' } },
      { path: 'kolam', name: 'kolam', component: () => import('../views/Kolam.vue'), meta: { title: 'Daftar Kolam', subtitle: 'Kelola daftar kolam budidaya dan aktivitas tebar bibit ikan' } },
      { path: 'jenis-ikan', name: 'jenis-ikan', component: () => import('../views/JenisIkan.vue'), meta: { title: 'Jenis Ikan & Harga Jual', subtitle: 'Kelola jenis ikan ternak dan tentukan harga jual perkilo acuan transaksi' } },
      { path: 'pengeluaran', name: 'pengeluaran', component: () => import('../views/Pengeluaran.vue'), meta: { title: 'Pengeluaran', subtitle: 'Catat biaya operasional budidaya seperti listrik, obat, dan perlengkapan' } },

      // Stok Pakan
      { path: 'stok-pakan', name: 'stok-pakan', component: () => import('../views/StokPakan.vue'), meta: { title: 'Stok Pakan', subtitle: 'Daftar jenis pakan, sisa stok, dan riwayat aktivitas pemakaian pakan' } },
      // Laporan
      { path: 'laporan', name: 'laporan', component: () => import('../views/Laporan.vue'), meta: { title: 'Laporan Ringkasan', subtitle: 'Analisis performa budidaya, keuntungan, dan ringkasan keuangan' } },
      { path: 'laporan/penjualan', name: 'laporan-penjualan', component: () => import('../views/LaporanPenjualan.vue'), meta: { title: 'Laporan Penjualan', subtitle: 'Riwayat penjualan tercatat otomatis dari seluruh transaksi' } },
      { path: 'laporan/pengeluaran', name: 'laporan-pengeluaran', component: () => import('../views/LaporanPengeluaran.vue'), meta: { title: 'Laporan Pengeluaran', subtitle: 'Detail dan total pengeluaran operasional per bulan' } },

      { path: 'pengaturan', name: 'pengaturan', component: () => import('../views/Pengaturan.vue'), meta: { title: 'Pengaturan Usaha & Akun', subtitle: 'Sesuaikan identitas usaha budidaya, ganti kata sandi, dan preferensi' } },
      { path: 'profile', name: 'profile', component: () => import('../views/Profile.vue'), meta: { title: 'Profil Saya', subtitle: 'Informasi dan foto profil akun pengelola kolam' } }
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