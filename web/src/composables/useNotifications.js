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

// Nama kolam di database kadang sudah mengandung kata "Kolam"/"kolam" (mis. "Kolam A5"),
// kadang belum (mis. "A5" saja). Helper ini mencegah teks jadi "Kolam Kolam A5".
function namaKolamDisplay(nama) {
  if (!nama) return 'Kolam'
  const trimmed = String(nama).trim()
  return /^kolam\b/i.test(trimmed) ? trimmed : `Kolam ${trimmed}`
}

// Format total menit jadi teks durasi singkat: "45m", "2j 15m", "1h 3j"
function formatDurasi(totalMenit) {
  if (totalMenit < 60) return `${totalMenit}m`
  const jam = Math.floor(totalMenit / 60)
  const menit = totalMenit % 60
  if (jam < 24) return menit > 0 ? `${jam}j ${menit}m` : `${jam}j`
  const hari = Math.floor(jam / 24)
  const sisaJam = jam % 24
  return sisaJam > 0 ? `${hari}h ${sisaJam}j` : `${hari}h`
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

  // Dulu: kalau key sudah ada, notifikasi baru diabaikan (skip).
  // Sekarang: kalau key sudah ada, ISI-nya di-update (upsert). Ini penting untuk
  // notifikasi yang dikelompokkan (mis. "3 kolam telat sesi Siang") supaya jumlah
  // dan durasi keterlambatannya ikut ter-refresh tiap sinkronisasi, bukan macet
  // di data pertama kali notifikasi itu dibuat.
  function addNotification({ type = 'default', title, message, route = null, key = null }) {
    if (key) {
      const existing = notifications.value.find((n) => n.key === key)
      if (existing) {
        existing.title = title
        existing.message = message
        existing.route = route
        return
      }
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
          const namaKolam = namaKolamDisplay(j.nama_kolam)

          // Jadwal Sortir
          if (j.jenis === 'sortir') {
            if (diffDays < 0) {
              addNotification({
                key: `sortir-${j.id}-terlewat-${hariIniStr}`,
                type: 'sortir',
                title: 'Jadwal Sortir Terlewat',
                message: `${namaKolam} (${j.nama_ikan}) terlewat jadwal sortir (${formatTanggal(j.tanggal_jadwal)}).`,
                route: '/jadwal/sortir'
              })
            } else if (diffDays === 0) {
              addNotification({
                key: `sortir-${j.id}-hari-ini-${hariIniStr}`,
                type: 'sortir',
                title: 'Waktunya Sortir Ikan',
                message: `${namaKolam} (${j.nama_ikan}) terjadwal sortir hari ini.`,
                route: '/jadwal/sortir'
              })
            } else if (diffDays <= 3) {
              addNotification({
                key: `sortir-${j.id}-mendekati-${hariIniStr}`,
                type: 'sortir',
                title: 'Jadwal Sortir Mendekati',
                message: `${namaKolam} (${j.nama_ikan}) akan sortir dalam ${diffDays} hari (${formatTanggal(j.tanggal_jadwal)}).`,
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
                message: `${namaKolam} (${j.nama_ikan}) telah melewati estimasi panen (${formatTanggal(j.tanggal_jadwal)}).`,
                route: '/jadwal/panen'
              })
            } else if (diffDays === 0) {
              addNotification({
                key: `panen-${j.id}-hari-ini-${hariIniStr}`,
                type: 'panen',
                title: 'Waktunya Panen Ikan',
                message: `${namaKolam} (${j.nama_ikan}) siap dipanen hari ini!`,
                route: '/jadwal/panen'
              })
            } else if (diffDays <= 7) {
              addNotification({
                key: `panen-${j.id}-mendekati-${hariIniStr}`,
                type: 'panen',
                title: 'Jadwal Panen Mendekati',
                message: `${namaKolam} (${j.nama_ikan}) panen dalam ${diffDays} hari (${formatTanggal(j.tanggal_jadwal)}).`,
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
                message: `${namaKolam} (${j.nama_ikan}) terlambat diberi obat (jadwal ${formatTanggal(j.tanggal_jadwal)}).`,
                route: '/jadwal/pemberian-obat'
              })
            } else if (diffDays === 0) {
              addNotification({
                key: `obat-${j.id}-hari-ini-${hariIniStr}`,
                type: 'obat',
                title: 'Waktunya Pemberian Obat',
                message: `${namaKolam} (${j.nama_ikan}) perlu diberi obat hari ini.`,
                route: '/jadwal/pemberian-obat'
              })
            } else if (diffDays <= 2) {
              addNotification({
                key: `obat-${j.id}-mendekati-${hariIniStr}`,
                type: 'obat',
                title: 'Jadwal Obat Mendekati',
                message: `${namaKolam} (${j.nama_ikan}) jadwal pemberian obat ${diffDays === 1 ? 'besok' : `${diffDays} hari lagi`}.`,
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
                message: `${namaKolam} terlewat jadwal ganti air (${formatTanggal(j.tanggal_jadwal)}).`,
                route: '/jadwal/ganti-air'
              })
            } else if (diffDays === 0) {
              addNotification({
                key: `ganti-air-${j.id}-hari-ini-${hariIniStr}`,
                type: 'ganti_air',
                title: 'Waktunya Ganti Air',
                message: `${namaKolam} terjadwal ganti air hari ini.`,
                route: '/jadwal/ganti-air'
              })
            } else if (diffDays <= 2) {
              addNotification({
                key: `ganti-air-${j.id}-mendekati-${hariIniStr}`,
                type: 'ganti_air',
                title: 'Jadwal Ganti Air Mendekati',
                message: `${namaKolam} jadwal ganti air ${diffDays === 1 ? 'besok' : `${diffDays} hari lagi`}.`,
                route: '/jadwal/ganti-air'
              })
            }
          }
        }
      }

      // 2. Notifikasi Jadwal Pemberian Makan (Pagi, Siang, Sore) untuk Kolam Aktif
      //    Dikelompokkan per sesi (bukan per kolam) supaya tidak menumpuk,
      //    dan disertai durasi keterlambatan.
      const [resKolam, resPakan] = await Promise.all([
        fetch('/api/kolam'),
        fetch('/api/pakan')
      ])

      if (resKolam.ok && resPakan.ok) {
        const kolamJson = await resKolam.json()
        const pakanJson = await resPakan.json()
        const kolamAktif = (kolamJson.data || []).filter((k) => k.status === 'aktif')
        const riwayatPakan = pakanJson.data || []

        for (const sesi of DAFTAR_SESI_MAKAN) {
          const belumWaktu = []
          const terlambatInfo = [] // { kolam, menitTerlambat }

          for (const k of kolamAktif) {
            const riwayatHariIni = riwayatPakan.filter((r) => {
              const tgl = new Date(r.tanggal).toISOString().slice(0, 10)
              return r.kolam_id === k.id && tgl === hariIniStr
            })
            const sudahDicatat = riwayatHariIni.some((r) => r.sesi === sesi.key)
            if (sudahDicatat) continue

            if (nowHour >= sesi.jam_mulai && nowHour <= sesi.jam_selesai) {
              belumWaktu.push(k)
            } else if (nowHour > sesi.jam_selesai) {
              const batas = new Date()
              batas.setHours(sesi.jam_selesai, 0, 0, 0)
              const menitTerlambat = Math.max(0, Math.floor((Date.now() - batas.getTime()) / 60000))
              terlambatInfo.push({ kolam: k, menitTerlambat })
            }
          }

          // Sedang masuk waktu makan tapi belum dicatat
          if (belumWaktu.length > 0) {
            const daftarNama = belumWaktu.map((k) => namaKolamDisplay(k.nama_kolam)).join(', ')
            addNotification({
              key: `makan-${hariIniStr}-${sesi.key}-waktunya`,
              type: 'makan',
              title: `Waktunya Beri Makan (${sesi.label})`,
              message:
                belumWaktu.length === 1
                  ? `${daftarNama} belum diberi pakan sesi ${sesi.label} hari ini.`
                  : `${belumWaktu.length} kolam belum diberi pakan sesi ${sesi.label} hari ini (${daftarNama}).`,
              route: '/jadwal/pemberian-makan'
            })
          }

          // Sudah lewat batas waktu sesi dan belum dicatat
          if (terlambatInfo.length > 0) {
            const jamBatasLabel = `${String(sesi.jam_selesai).padStart(2, '0')}:00`
            const maxMenit = Math.max(...terlambatInfo.map((t) => t.menitTerlambat))
            const daftarNama = terlambatInfo.map((t) => namaKolamDisplay(t.kolam.nama_kolam)).join(', ')

            addNotification({
              key: `makan-${hariIniStr}-${sesi.key}-terlewat`,
              type: 'makan',
              title: `Pemberian Makan Terlambat (${sesi.label})`,
              message:
                terlambatInfo.length === 1
                  ? `${daftarNama} melewatkan sesi makan ${sesi.label}, sudah terlambat ${formatDurasi(terlambatInfo[0].menitTerlambat)} dari batas jam ${jamBatasLabel}.`
                  : `${terlambatInfo.length} kolam melewatkan sesi makan ${sesi.label} (${daftarNama}), terlambat hingga ${formatDurasi(maxMenit)} dari batas jam ${jamBatasLabel}.`,
              route: '/jadwal/pemberian-makan'
            })
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