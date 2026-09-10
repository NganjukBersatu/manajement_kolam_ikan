<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { useProfile } from '../composables/useProfile.js'
import { useNotifications } from '../composables/useNotifications.js'
import NavIcon from './NavIcon.vue'

const route = useRoute()
const router = useRouter()
const { isDark, toggle } = useTheme()
const { profile, initials, handleFileSelect } = useProfile()
const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, iconFor, syncAll } = useNotifications()

const menuOpen = ref(false)
const menuRef = ref(null)
const notifOpen = ref(false)
const notifRef = ref(null)
const fileInput = ref(null)
const uploadError = ref('')
const uploading = ref(false)
let notifInterval = null

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  notifOpen.value = false
  uploadError.value = ''
}

function toggleNotif() {
  notifOpen.value = !notifOpen.value
  menuOpen.value = false
  if (notifOpen.value) {
    syncAll()
  }
}

function closeMenus(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    menuOpen.value = false
  }
  if (notifRef.value && !notifRef.value.contains(e.target)) {
    notifOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeMenus)
  syncAll()
  notifInterval = setInterval(syncAll, 30000)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenus)
  if (notifInterval) clearInterval(notifInterval)
})

function triggerFileInput() {
  fileInput.value?.click()
}

async function onFileChange(e) {
  const file = e.target.files?.[0]
  uploadError.value = ''
  if (!file) return

  uploading.value = true
  try {
    await handleFileSelect(file)
  } catch (err) {
    uploadError.value = err.message
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

function goToProfile() {
  menuOpen.value = false
  router.push('/profile')
}

function onNotifClick(item) {
  markAsRead(item.id)
  if (item.route) {
    notifOpen.value = false
    router.push(item.route)
  }
}
</script>

<template>
  <header class="h-16 flex items-center justify-between px-6 bg-white dark:bg-ink-900 border-b border-ink-100 dark:border-ink-700 shrink-0">
    <!-- Judul halaman -->
    <div>
      <h1 class="text-[17px] font-semibold text-ink-900 dark:text-white">
        {{ route.meta.title || 'Dashboard' }}
      </h1>
      <p v-if="route.meta.subtitle" class="text-xs text-ink-400 dark:text-ink-300 mt-0.5">
        {{ route.meta.subtitle }}
      </p>
    </div>

    <!-- Kanan: Notifikasi + Mode + Profil -->
    <div class="flex items-center gap-3">
      <!-- Notifikasi -->
      <div class="relative" ref="notifRef">
        <button
          type="button"
          class="relative w-9 h-9 flex items-center justify-center rounded-lg text-ink-600 dark:text-white hover:bg-ink-100 dark:hover:bg-ink-700 shrink-0 transition"
          @click="toggleNotif"
          aria-haspopup="true"
          :aria-expanded="notifOpen"
          aria-label="Notifikasi"
        >
          <NavIcon name="bell" :size="18" />
          <span
            v-if="unreadCount > 0"
            class="absolute top-1 right-1 min-w-[16px] h-[16px] px-[3px] rounded-full bg-danger-500 text-white text-[10px] font-semibold flex items-center justify-center leading-none"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </button>

        <!-- Dropdown notifikasi -->
        <div
          v-if="notifOpen"
          class="absolute right-0 top-[calc(100%+8px)] w-80 bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700 rounded-card shadow-card py-2 z-50"
        >
          <div class="flex items-center justify-between px-4 py-2 border-b border-ink-100 dark:border-ink-700">
            <p class="text-[13.5px] font-medium text-ink-900 dark:text-white">Notifikasi</p>
            <div class="flex items-center gap-2">
              <button
                v-if="unreadCount > 0"
                type="button"
                class="text-[12px] text-brand-500 hover:text-brand-600 font-medium"
                @click="markAllAsRead"
              >
                Tandai dibaca
              </button>
              <button
                v-if="notifications.length > 0"
                type="button"
                class="text-[12px] text-ink-400 hover:text-danger-500 font-medium"
                @click="clearAll"
              >
                Bersihkan
              </button>
            </div>
          </div>

          <div class="max-h-80 overflow-y-auto">
            <button
              v-for="item in notifications"
              :key="item.id"
              type="button"
              class="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-ink-100 dark:hover:bg-ink-700 transition border-b border-ink-100 dark:border-ink-700 last:border-b-0"
              @click="onNotifClick(item)"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                :class="item.read ? 'bg-ink-100 dark:bg-ink-600 text-ink-400' : 'bg-brand-500/10 text-brand-500'"
              >
                <NavIcon :name="iconFor(item.type)" :size="15" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-medium text-ink-900 dark:text-white truncate">{{ item.title }}</p>
                <p class="text-[12px] text-ink-400 dark:text-ink-300 line-clamp-2">{{ item.message }}</p>
                <p class="text-[11px] text-ink-300 dark:text-ink-400 mt-1">{{ item.time }}</p>
              </div>
              <span v-if="!item.read" class="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
            </button>

            <div v-if="notifications.length === 0" class="px-4 py-8 text-center">
              <p class="text-[13px] text-ink-400">Tidak ada notifikasi.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Mode Gelap/Terang -->
      <button
        type="button"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-ink-600 dark:text-white hover:bg-ink-100 dark:hover:bg-ink-700 shrink-0 transition"
        @click="toggle"
        aria-label="Ganti tema"
      >
        <NavIcon :name="isDark ? 'sun' : 'moon'" :size="18" />
      </button>

      <!-- Profil -->
      <div class="relative" ref="menuRef">
        <button
          type="button"
          class="flex items-center gap-2.5 pl-3 border-l border-ink-100 dark:border-ink-700 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-lg pr-2 py-1 transition"
          @click="toggleMenu"
          aria-haspopup="true"
          :aria-expanded="menuOpen"
        >
          <div class="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden">
            <img v-if="profile.photo" :src="profile.photo" alt="Foto profil" class="w-full h-full object-cover" />
            <span v-else>{{ initials() }}</span>
          </div>
          <div class="hidden sm:block leading-tight text-left">
            <p class="text-[13.5px] font-medium text-ink-900 dark:text-white">{{ profile.name }}</p>
            <p class="text-[11.5px] text-ink-400 dark:text-ink-300">{{ profile.role }}</p>
          </div>
          <svg class="hidden sm:block text-ink-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <!-- Dropdown profil -->
        <div
          v-if="menuOpen"
          class="absolute right-0 top-[calc(100%+8px)] w-64 bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700 rounded-card shadow-card py-2 z-50"
        >
          <!-- Info profil -->
          <div class="flex items-center gap-3 px-4 py-3 border-b border-ink-100 dark:border-ink-700">
            <div class="w-11 h-11 rounded-full bg-brand-500 flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden">
              <img v-if="profile.photo" :src="profile.photo" alt="Foto profil" class="w-full h-full object-cover" />
              <span v-else>{{ initials() }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-ink-900 dark:text-white truncate">{{ profile.name }}</p>
              <p class="text-[12px] text-ink-400 dark:text-ink-300 truncate">{{ profile.email || profile.role }}</p>
            </div>
          </div>

          <!-- Aksi -->
          <div class="py-1">
            <button
              type="button"
              class="w-full flex items-center gap-2.5 px-4 py-2 text-[13.5px] text-ink-700 dark:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-700 transition"
              @click="goToProfile"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Lihat profil
            </button>

            <button
              type="button"
              class="w-full flex items-center gap-2.5 px-4 py-2 text-[13.5px] text-ink-700 dark:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-700 transition disabled:opacity-50"
              :disabled="uploading"
              @click="triggerFileInput"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              {{ uploading ? 'Mengunggah...' : 'Ganti foto profil' }}
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onFileChange"
            />

            <p v-if="uploadError" class="px-4 pt-1 text-[12px] text-danger-600">{{ uploadError }}</p>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>