<script setup>
import { ref, onMounted } from 'vue'

const daftar = ref([])
const showForm = ref(false)
const jadwalDipilih = ref(null)
const form = ref({ tanggal: new Date().toISOString().slice(0, 10), jumlah_ekor: '', berat_kg: '', catatan: '' })

async function muat() {
  const res = await fetch('/api/jadwal?jenis=panen')
  const json = await res.json()
  daftar.value = json.data
}

function bukaForm(j) {
  jadwalDipilih.value = j
  form.value = { tanggal: new Date().toISOString().slice(0, 10), jumlah_ekor: j.jumlah_saat_ini, berat_kg: '', catatan: '' }
  showForm.value = true
}

async function simpan() {
  await fetch('/api/panen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jadwal_id: jadwalDipilih.value.id,
      tebar_id: jadwalDipilih.value.tebar_id,
      kolam_id: jadwalDipilih.value.kolam_id,
      ...form.value
    })
  })
  showForm.value = false
  await muat()
}

function tanggal(d) { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }

onMounted(muat)
</script>

<template>
  <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
    <table class="w-full text-left text-[13.5px]">
      <thead>
        <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
          <th class="px-4 py-3">Kolam</th>
          <th class="px-4 py-3">Jenis Ikan</th>
          <th class="px-4 py-3">Jumlah Saat Ini</th>
          <th class="px-4 py-3">Tgl Jadwal</th>
          <th class="px-4 py-3">Status</th>
          <th class="px-4 py-3 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="j in daftar" :key="j.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0">
          <td class="px-4 py-3 font-semibold">{{ j.nama_kolam }}</td>
          <td class="px-4 py-3">{{ j.nama_ikan }}</td>
          <td class="px-4 py-3">{{ j.jumlah_saat_ini }}</td>
          <td class="px-4 py-3">{{ tanggal(j.tanggal_jadwal) }}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-1 rounded-full text-[11.5px] font-semibold" :class="j.status === 'selesai' ? 'bg-ok-100 text-ok-600' : 'bg-warn-100 text-warn-600'">
              {{ j.status === 'selesai' ? 'Selesai' : 'Belum' }}
            </span>
          </td>
          <td class="px-4 py-3 text-right">
            <button v-if="j.status !== 'selesai'" type="button" class="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-[12.5px] font-semibold hover:bg-brand-600" @click="bukaForm(j)">
              Catat Panen
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
    <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
      <h2 class="text-[16px] font-semibold mb-4">Catat Panen — {{ jadwalDipilih?.nama_kolam }}</h2>
      <form class="space-y-3" @submit.prevent="simpan">
        <div>
          <label class="block text-[13px] font-medium mb-1">Tanggal</label>
          <input v-model="form.tanggal" type="date" required class="w-full rounded-lg border border-ink-100 px-3 py-2.5 text-[13.5px]" />
        </div>
        <div>
          <label class="block text-[13px] font-medium mb-1">Jumlah Ekor</label>
          <input v-model="form.jumlah_ekor" type="number" min="1" required class="w-full rounded-lg border border-ink-100 px-3 py-2.5 text-[13.5px]" />
        </div>
        <div>
          <label class="block text-[13px] font-medium mb-1">Berat (kg)</label>
          <input v-model="form.berat_kg" type="number" step="0.1" min="0" class="w-full rounded-lg border border-ink-100 px-3 py-2.5 text-[13.5px]" />
        </div>
        <div>
          <label class="block text-[13px] font-medium mb-1">Catatan (opsional)</label>
          <textarea v-model="form.catatan" class="w-full rounded-lg border border-ink-100 px-3 py-2.5 text-[13.5px]"></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" class="flex-1 rounded-lg border border-ink-100 py-2.5 text-[13.5px] font-semibold" @click="showForm = false">Batal</button>
          <button type="submit" class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600">Simpan</button>
        </div>
      </form>
    </div>
  </div>
</template>