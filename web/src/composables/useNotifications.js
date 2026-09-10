import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'notifications_data'

function loadNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Gagal memuat notifikasi:', e)
  }
  return []
}

const notifications = ref(loadNotifications())

watch(
  notifications,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch (e) {
      console.error('Gagal menyimpan notifikasi:', e)
    }
  },
  { deep: true }
)

const iconByType = {
  panen: 'fish',
  sortir: 'scissors',
  makan: 'utensils',
  obat: 'pill',
  ganti_air: 'droplet',
  stok: 'alert-circle',
  jadwal: 'clock',
  default: 'bell'
}

function formatTanggal(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const DAFTAR_SESI_MAKAN = [
  { key: 'pagi', label: 'Pagi', jam_mulai: 6, jam_selesai: 10 },
  { key: 'siang', label: 'Siang', jam_mulai: 11, jam_selesai: 15 },
  { key: 'sore', label: 'Sore', jam_mulai: 16, jam_selesai: 19 }
]

export function useNotifications() {
  const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

  function markAsRead(id) {
    const item = notifications.value.find((n) => n.id === id)
    if (item) item.read = true
  }

  function markAllAsRead() {
    notifications.value.forEach((n) => (n.read = true))
  }

  function clearAll() {
    notifications.value = []
  }

  function addNotification({ type = 'default', title, message, route = null, key = null }) {
    if (key && notifications.value.some((n) => n.key === key)) {
      return // Jangan duplikasi notifikasi dengan key yang sama
    }
    notifications.value.unshift({
      id: Date.now() + Math.random(),
      key,
      type,
      title,
      message,
      route,
      time: 'Baru saja',
      read: false,
      createdAt: new Date().toISOString()
    })
  }

  function iconFor(type) {
    return iconByType[type] || iconByType.default
  }

  // Sinkronisasi menyeluruh semua jadwal & kondisi darurat (sortir, panen, obat, ganti air, makan, dan stok)
  async function syncAll() {
    const hariIniStr = new Date().toISOString().slice(0, 10)
    const hariIniDate = new Date(hariIniStr)
    const nowHour = new Date().getHours()

    try {
      // 1. Ambil data jadwal status belum selesai
      const resJadwal = await fetch('/api/jadwal?status=belum')
      if (resJadwal.ok) {
        const jsonJadwal = await resJadwal.json()
        const daftarJadwal = jsonJadwal.data || []

        for (const j of daftarJadwal) {
          const tglJadwalStr = new Date(j.tanggal_jadwal).toISOString().slice(0, 10)
          const tglJadwalDate = new Date(tglJadwalStr)
          const diffDays = Math.round((tglJadwalDate - hariIniDate) / (1000 * 60 * 60 * 24))

          // Jadwal Sortir
          if (j.jenis === 'sortir') {
            if (diffDays < 0) {
              addNotification({
                key: `sortir-${j.id}-terlewat-${hariIniStr}`,
                type: 'sortir',
                title: 'Jadwal Sortir Terlewat',
                message: `Kolam ${j.nama_kolam} (${j.nama_ikan}) terlewat jadwal sortir (${formatTanggal(j.tanggal_jadwal)}).`,
                route: '/jadwal/sortir'
              })
            } else if (diffDays === 0) {
              addNotification({
                key: `sortir-${j.id}-hari-ini-${hariIniStr}`,
                type: 'sortir',
                title: 'Waktunya Sortir Ikan',
                message: `Kolam ${j.nama_kolam} (${j.nama_ikan}) terjadwal sortir hari ini.`,
                route: '/jadwal/sortir'
              })
            } else if (diffDays <= 3) {
              addNotification({
                key: `sortir-${j.id}-mendekati-${hariIniStr}`,
                type: 'sortir',
                title: 'Jadwal Sortir Mendekati',
                message: `Kolam ${j.nama_kolam} (${j.nama_ikan}) akan sortir dalam ${diffDays} hari (${formatTanggal(j.tanggal_jadwal)}).`,
                route: '/jadwal/sortir'
              })
            }
          }

          // Jadwal Panen
          if (j.jenis === 'panen') {
            if (diffDays < 0) {
              addNotification({
                key: `panen-${j.id}-terlewat-${hariIniStr}`,
                type: 'panen',
                title: 'Jadwal Panen Terlewat',
                message: `Kolam ${j.nama_kolam} (${j.nama_ikan}) telah melewati estimasi panen (${formatTanggal(j.tanggal_jadwal)}).`,
                route: '/jadwal/panen'
              })
            } else if (diffDays === 0) {
              addNotification({
                key: `panen-${j.id}-hari-ini-${hariIniStr}`,
                type: 'panen',
                title: 'Waktunya Panen Ikan',
                message: `Kolam ${j.nama_kolam} (${j.nama_ikan}) siap dipanen hari ini!`,
                route: '/jadwal/panen'
              })
            } else if (diffDays <= 7) {
              addNotification({
                key: `panen-${j.id}-mendekati-${hariIniStr}`,
                type: 'panen',
                title: 'Jadwal Panen Mendekati',
                message: `Kolam ${j.nama_kolam} (${j.nama_ikan}) panen dalam ${diffDays} hari (${formatTanggal(j.tanggal_jadwal)}).`,
                route: '/jadwal/panen'
              })
            }
          }

          // Jadwal Obat
          if (j.jenis === 'obat') {
            if (diffDays < 0) {
              addNotification({
                key: `obat-${j.id}-terlewat-${hariIniStr}`,
                type: 'obat',
                title: 'Pemberian Obat Terlambat',
                message: `Kolam ${j.nama_kolam} (${j.nama_ikan}) terlambat diberi obat (jadwal ${formatTanggal(j.tanggal_jadwal)}).`,
                route: '/jadwal/pemberian-obat'
              })
            } else if (diffDays === 0) {
              addNotification({
                key: `obat-${j.id}-hari-ini-${hariIniStr}`,
                type: 'obat',
                title: 'Waktunya Pemberian Obat',
                message: `Kolam ${j.nama_kolam} (${j.nama_ikan}) perlu diberi obat hari ini.`,
                route: '/jadwal/pemberian-obat'
              })
            } else if (diffDays <= 2) {
              addNotification({
                key: `obat-${j.id}-mendekati-${hariIniStr}`,
                type: 'obat',
                title: 'Jadwal Obat Mendekati',
                message: `Kolam ${j.nama_kolam} (${j.nama_ikan}) jadwal pemberian obat ${diffDays === 1 ? 'besok' : `${diffDays} hari lagi`}.`,
                route: '/jadwal/pemberian-obat'
              })
            }
          }

          // Jadwal Ganti Air
          if (j.jenis === 'ganti_air') {
            if (diffDays < 0) {
              addNotification({
                key: `ganti-air-${j.id}-terlewat-${hariIniStr}`,
                type: 'ganti_air',
                title: 'Jadwal Ganti Air Terlambat',
                message: `Kolam ${j.nama_kolam} terlewat jadwal ganti air (${formatTanggal(j.tanggal_jadwal)}).`,
                route: '/jadwal/ganti-air'
              })
            } else if (diffDays === 0) {
              addNotification({
                key: `ganti-air-${j.id}-hari-ini-${hariIniStr}`,
                type: 'ganti_air',
                title: 'Waktunya Ganti Air',
                message: `Kolam ${j.nama_kolam} terjadwal ganti air hari ini.`,
                route: '/jadwal/ganti-air'
              })
            } else if (diffDays <= 2) {
              addNotification({
                key: `ganti-air-${j.id}-mendekati-${hariIniStr}`,
                type: 'ganti_air',
                title: 'Jadwal Ganti Air Mendekati',
                message: `Kolam ${j.nama_kolam} jadwal ganti air ${diffDays === 1 ? 'besok' : `${diffDays} hari lagi`}.`,
                route: '/jadwal/ganti-air'
              })
            }
          }
        }
      }

      // 2. Notifikasi Jadwal Pemberian Makan (Pagi, Siang, Sore) untuk Kolam Aktif
      const [resKolam, resPakan] = await Promise.all([
        fetch('/api/kolam'),
        fetch('/api/pakan')
      ])

      if (resKolam.ok && resPakan.ok) {
        const kolamJson = await resKolam.json()
        const pakanJson = await resPakan.json()
        const kolamAktif = (kolamJson.data || []).filter((k) => k.status === 'aktif')
        const riwayatPakan = pakanJson.data || []

        for (const k of kolamAktif) {
          const riwayatHariIni = riwayatPakan.filter((r) => {
            const tgl = new Date(r.tanggal).toISOString().slice(0, 10)
            return r.kolam_id === k.id && tgl === hariIniStr
          })

          for (const sesi of DAFTAR_SESI_MAKAN) {
            const sudahDicatat = riwayatHariIni.some((r) => r.sesi === sesi.key)
            if (sudahDicatat) continue

            // Sedang masuk waktu makan (misal pagi 06:00 - 10:00)
            if (nowHour >= sesi.jam_mulai && nowHour <= sesi.jam_selesai) {
              addNotification({
                key: `makan-${k.id}-${hariIniStr}-${sesi.key}-waktunya`,
                type: 'makan',
                title: `Waktunya Beri Makan (${sesi.label})`,
                message: `Kolam ${k.nama_kolam} belum diberi pakan sesi ${sesi.label} hari ini.`,
                route: '/jadwal/pemberian-makan'
              })
            } else if (nowHour > sesi.jam_selesai) {
              // Terlewat waktu makan
              addNotification({
                key: `makan-${k.id}-${hariIniStr}-${sesi.key}-terlewat`,
                type: 'makan',
                title: `Pemberian Makan Terlewat (${sesi.label})`,
                message: `Kolam ${k.nama_kolam} melewatkan sesi makan ${sesi.label} hari ini.`,
                route: '/jadwal/pemberian-makan'
              })
            }
          }
        }
      }

      // 3. Notifikasi Stok Pakan Menipis
      const resStok = await fetch('/api/stok-pakan')
      if (resStok.ok) {
        const stokJson = await resStok.json()
        const daftarStok = stokJson.data || []
        for (const s of daftarStok) {
          const sisa = Number(s.stok) || 0
          const min = Number(s.stok_minimum) || 0
          if (sisa <= min) {
            addNotification({
              key: `stok-menipis-${s.id}-${hariIniStr}`,
              type: 'stok',
              title: 'Stok Pakan Menipis',
              message: `Pakan "${s.nama}" tersisa ${sisa} ${s.satuan} (batas minimum ${min} ${s.satuan}). Segera lakukan pengadaan.`,
              route: '/stok-pakan'
            })
          }
        }
      }
    } catch (e) {
      console.error('Gagal sinkronisasi notifikasi:', e)
    }
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
    iconFor,
    syncAll
  }
}