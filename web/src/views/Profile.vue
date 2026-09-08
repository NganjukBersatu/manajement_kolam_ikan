<script setup>
import { ref } from 'vue'
import { useProfile } from '../composables/useProfile.js'
import NavIcon from '../components/NavIcon.vue'

const { profile, initials, handleFileSelect, removePhoto, updateProfile } = useProfile()

const fileInput = ref(null)
const uploadError = ref('')
const uploading = ref(false)
const saved = ref(false)

const form = ref({
  name: profile.value.name,
  role: profile.value.role,
  email: profile.value.email
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

function saveProfile() {
  updateProfile({ ...form.value })
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-xl font-semibold text-ink-900 dark:text-white mb-6">Profil saya</h1>

    <div class="bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700 rounded-card p-6">
      <!-- Foto -->
      <div class="flex items-center gap-5 mb-6 pb-6 border-b border-ink-100 dark:border-ink-700">
        <div class="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-white font-semibold text-2xl shrink-0 overflow-hidden">
          <img v-if="profile.photo" :src="profile.photo" alt="Foto profil" class="w-full h-full object-cover" />
          <span v-else>{{ initials() }}</span>
        </div>
        <div>
          <div class="flex gap-2">
            <button
              type="button"
              class="text-[13px] font-medium px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition disabled:opacity-60"
              :disabled="uploading"
              @click="triggerFileInput"
            >
              {{ uploading ? 'Mengunggah...' : 'Ganti foto' }}
            </button>
            <button
              v-if="profile.photo"
              type="button"
              class="text-[13px] font-medium px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-600 text-ink-600 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-700 transition"
              @click="removePhoto"
            >
              Hapus foto
            </button>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileChange"
          />
          <p class="text-[12px] text-ink-400 mt-2">JPG atau PNG, maksimal 2MB.</p>
          <p v-if="uploadError" class="text-[12px] text-danger-600 mt-1">{{ uploadError }}</p>
        </div>
      </div>

      <!-- Form data -->
      <form class="space-y-4" @submit.prevent="saveProfile">
        <div>
          <label class="block text-[13px] font-medium text-ink-700 dark:text-ink-200 mb-1.5">Nama</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full rounded-lg border border-ink-100 dark:border-ink-600 bg-cream dark:bg-ink-900 px-3.5 py-2.5 text-[14px] text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
          />
        </div>

        <div>
          <label class="block text-[13px] font-medium text-ink-700 dark:text-ink-200 mb-1.5">Jabatan / role</label>
          <input
            v-model="form.role"
            type="text"
            class="w-full rounded-lg border border-ink-100 dark:border-ink-600 bg-cream dark:bg-ink-900 px-3.5 py-2.5 text-[14px] text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
          />
        </div>

        <div>
          <label class="block text-[13px] font-medium text-ink-700 dark:text-ink-200 mb-1.5">Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="nama@email.com"
            class="w-full rounded-lg border border-ink-100 dark:border-ink-600 bg-cream dark:bg-ink-900 px-3.5 py-2.5 text-[14px] text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
          />
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button
            type="submit"
            class="px-4 py-2.5 rounded-lg bg-brand-500 text-white text-[14px] font-semibold hover:bg-brand-600 transition"
          >
            Simpan perubahan
          </button>
          <span v-if="saved" class="flex items-center gap-1.5 text-[13px] text-ok-500">
            <NavIcon name="check" :size="15" />
            Tersimpan
          </span>
        </div>
      </form>
    </div>
  </div>
</template>