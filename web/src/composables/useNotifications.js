import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'notifications_data'

const defaultNotifications = [
  {
    id: 1,
    type: 'panen',
    title: 'Kolam siap dipanen',
    message: 'Kolam 2 sudah memasuki masa panen optimal.',
    time: '2 jam lalu',
    read: false
  },
  {
    id: 2,
    type: 'stok',
    title: 'Stok pakan menipis',
    message: 'Stok pakan tersisa kurang dari 10%.',
    time: '5 jam lalu',
    read: false
  },
  {
    id: 3,
    type: 'jadwal',
    title: 'Jadwal sortir besok',
    message: 'Sortir kolam 4 dijadwalkan besok pagi.',
    time: '1 hari lalu',
    read: true
  }
]

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

// Ikon per jenis notifikasi, dipetakan ke nama di NavIcon.vue
const iconByType = {
  panen: 'package',
  stok: 'alert-circle',
  jadwal: 'clock',
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
      id: Date.now(),
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

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
    iconFor
  }
}