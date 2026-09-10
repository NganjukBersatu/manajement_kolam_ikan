import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'notifications_data'

const defaultNotifications = []

function loadNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Gagal memuat notifikasi:', e)
  }
  return [...defaultNotifications]
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
  panen: 'package',
  stok: 'alert-circle',
  jadwal: 'clock',
  obat: 'clock',
  default: 'bell'
}

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

  function addNotification({ type = 'default', title, message }) {
    notifications.value.unshift({
      id: Date.now() + Math.random(),
      type,
      title,
      message,
      time: 'Baru saja',
      read: false
    })
  }

  function iconFor(type) {
    return iconByType[type] || iconByType.default
  }

  // Cek jadwal pemberian obat yang belum dicatat dan sudah waktunya (hari ini atau terlewat),
  // lalu tambahkan notifikasi kalau belum pernah dinotifikasi sebelumnya (dicek dari jadwalId).
  async function syncJadwalObat() {
    try {
      const res = await fetch('/api/jadwal?jenis=obat')
      const json = await res.json()
      const jadwalBelum = (json.data || []).filter((j) => j.status === 'belum')
      const hariIni = new Date().toISOString().slice(0, 10)

      const sudahDinotif = new Set(
        notifications.value.filter((n) => n.type === 'obat' && n.jadwalId).map((n) => n.jadwalId)
      )

      for (const j of jadwalBelum) {
        if (j.tanggal_jadwal > hariIni) continue // belum waktunya
        if (sudahDinotif.has(j.id)) continue // sudah pernah dinotifikasi

        const terlambat = j.tanggal_jadwal < hariIni
        notifications.value.unshift({
          id: Date.now() + Math.random(),
          jadwalId: j.id,
          type: 'obat',
          title: terlambat ? 'Pemberian obat terlambat' : 'Waktunya beri obat',
          message: `${j.nama_kolam} (${j.nama_ikan}) perlu diberi obat${terlambat ? ' — sudah lewat jadwal' : ' hari ini'}.`,
          time: 'Baru saja',
          read: false
        })
      }
    } catch (e) {
      console.error('Gagal sinkronisasi notifikasi obat:', e)
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
    syncJadwalObat
  }
}