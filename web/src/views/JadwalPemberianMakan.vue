<script setup>
import { ref, onMounted, computed } from 'vue'

const daftarKolam = ref([])
const riwayatPakan = ref([])

const showForm = ref(false)
const kolamDipilih = ref(null)
const sesiDipilih = ref(null)
const form = ref({ jumlah_kg: '', biaya: '', catatan: '' })

const showRiwayat = ref(false)
const riwayatKolamDipilih = ref(null)
const riwayatDetail = ref([])

const hariIni = new Date().toISOString().slice(0, 10)

// Normalisasi tanggal ke format YYYY-MM-DD, baik sumbernya berupa teks
// maupun objek Date (Postgres via node-postgres mengembalikan kolom
// bertipe DATE sebagai objek Date, bukan teks — kalau langsung dipakai
// .slice() akan gagal diam-diam dan status selalu terbaca "Belum"
// meskipun sudah dicatat hari itu).
function keTanggalISO(d) {
  if (!d) return null
  const tgl = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(tgl.getTime())) return null
  return tgl.toISOString().slice(0, 10)
}

// Definisi 3 sesi pemberian makan per hari. Ubah jam_mulai/jam_selesai
// sesuai kebiasaan pemberian pakan di kolammu.
const DAFTAR_SESI = [
  { key: 'pagi', label: 'Pagi', jam_mulai: 6, jam_selesai: 10 },
  { key: 'siang', label: 'Siang', jam_mulai: 11, jam_selesai: 15 },
  { key: 'sore', label: 'Sore', jam_mulai: 16, jam_selesai: 19 }
]

// Hanya tampilkan kolam yang sedang aktif (ada ikannya)
const kolamAktif = computed(() => daftarKolam.value.filter(k => k.status === 'aktif'))

// Untuk setiap kolam, hitung status 3 sesi hari ini: 'sudah' | 'terlambat' | 'belum'
const daftarGabungan = computed(() => {
  const jamSekarang = new Date().getHours()

  return kolamAktif.value.map(k => {
    const riwayatHariIni = riwayatPakan.value.filter(
      r => r.kolam_id === k.id && keTanggalISO(r.tanggal) === hariIni
    )

    const sesiStatus = DAFTAR_SESI.map(s => {
      const sudahDicatat = riwayatHariIni.some(r => r.sesi === s.key)
      let status = 'belum'
      if (sudahDicatat) {
        status = 'sudah'
      } else if (jamSekarang > s.jam_selesai) {
        status = 'terlambat'
      }
      return { ...s, status }
    })

    return { ...k, sesiStatus }
  })
})

async function muatKolam() {
  const res = await fetch('/api/kolam')
  const json = await res.json()
  daftarKolam.value = json.data
}

async function muatRiwayat() {
  const res = await fetch('/api/pakan')
  const json = await res.json()
  riwayatPakan.value = json.data
}

function bukaForm(k, sesi) {
  if (sesi.status === 'sudah') return
  kolamDipilih.value = k
  sesiDipilih.value = sesi
  form.value = { jumlah_kg: '', biaya: '', catatan: '' }
  showForm.value = true
}

async function simpan() {
  const res = await fetch('/api/pakan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kolam_id: kolamDipilih.value.id,
      tanggal: hariIni,
      sesi: sesiDipilih.value.key,
      jumlah_kg: form.value.jumlah_kg,
      biaya: form.value.biaya || 0,
      catatan: form.value.catatan
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    alert(err.message || 'Gagal menyimpan pemberian makan')
    return
  }

  showForm.value = false
  await muatRiwayat()
}

async function bukaRiwayat(k) {
  riwayatKolamDipilih.value = k
  showRiwayat.value = true
  const res = await fetch(`/api/pakan/kolam/${k.id}`)
  const json = await res.json()
  riwayatDetail.value = json.data
}

function rupiah(n) {
  return n ? Number(n).toLocaleString('id-ID') : '-'
}

function tanggal(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function labelSesi(key) {
  return DAFTAR_SESI.find(s => s.key === key)?.label || key
}

onMounted(() => {
  muatKolam()
  muatRiwayat()
})
</script>

<template>
  <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
    <table class="w-full text-left text-[13.5px]">
      <thead>
        <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis Ikan</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah Saat Ini</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tanggal</th>
          <th
            v-for="s in DAFTAR_SESI"
            :key="s.key"
            class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold text-center"
          >
            {{ s.label }}
          </th>
          <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Riwayat</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="k in daftarGabungan" :key="k.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100">
          <td class="px-4 py-3 font-semibold">{{ k.nama_kolam }}</td>
          <td class="px-4 py-3">{{ k.nama_ikan || '-' }}</td>
          <td class="px-4 py-3">{{ rupiah(k.jumlah_saat_ini) }}</td>
          <td class="px-4 py-3">{{ tanggal(hariIni) }}</td>

          <td v-for="s in k.sesiStatus" :key="s.key" class="px-4 py-3 text-center">
            <button
              type="button"
              class="px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
              :class="{
                'bg-ok-100 text-ok-600 dark:bg-ok-600/25 dark:text-ok-500 cursor-default': s.status === 'sudah',
                'bg-red-100 text-red-600 dark:bg-red-600/25 dark:text-red-400': s.status === 'terlambat',
                'bg-warn-100 text-warn-600 dark:bg-warn-600/25 dark:text-warn-500': s.status === 'belum'
              }"
              @click="bukaForm(k, s)"
            >
              {{ s.status === 'sudah' ? 'Sudah' : s.status === 'terlambat' ? 'Terlambat' : 'Belum' }}
            </button>
          </td>

          <td class="px-4 py-3 text-right">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 text-[12.5px] font-semibold"
              @click="bukaRiwayat(k)"
            >
              Lihat riwayat
            </button>
          </td>
        </tr>
        <tr v-if="daftarGabungan.length === 0">
          <td colspan="6" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
            Belum ada kolam aktif untuk diberi makan.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Modal: catat pemberian makan untuk satu sesi -->
  <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
    <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
      <h2 class="text-[16px] font-semibold dark:text-white mb-1">
        Catat Pemberian Makan — {{ kolamDipilih?.nama_kolam }}
      </h2>
      <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-4">
        Sesi {{ sesiDipilih?.label }} · {{ tanggal(hariIni) }}
      </p>
      <form class="space-y-3" @submit.prevent="simpan">
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jumlah Pakan (kg)</label>
          <input v-model="form.jumlah_kg" type="number" step="0.1" min="0" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
        </div>
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">
            Biaya (Rp) <span class="text-ink-400 font-normal">(opsional)</span>
          </label>
          <input v-model="form.biaya" type="number" min="0" placeholder="Contoh: 50000" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
        </div>
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Catatan (opsional)</label>
          <textarea v-model="form.catatan" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showForm = false">Batal</button>
          <button type="submit" class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600">Simpan</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: riwayat pemberian makan per kolam -->
  <div v-if="showRiwayat" class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-black/40" @click="showRiwayat = false" />
    <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-lg p-5 max-h-[80vh] overflow-y-auto">
      <h2 class="text-[16px] font-semibold dark:text-white mb-4">
        Riwayat Pemberian Makan — {{ riwayatKolamDipilih?.nama_kolam }}
      </h2>
      <table class="w-full text-left text-[13px]">
        <thead>
          <tr class="border-b border-ink-100 dark:border-ink-500 text-ink-500 dark:text-ink-300">
            <th class="py-2 pr-2">Tanggal</th>
            <th class="py-2 pr-2">Sesi</th>
            <th class="py-2 pr-2">Jumlah (kg)</th>
            <th class="py-2">Biaya</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in riwayatDetail" :key="r.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100">
            <td class="py-2 pr-2">{{ tanggal(r.tanggal) }}</td>
            <td class="py-2 pr-2">{{ labelSesi(r.sesi) }}</td>
            <td class="py-2 pr-2">{{ r.jumlah_kg }}</td>
            <td class="py-2">Rp {{ rupiah(r.biaya) }}</td>
          </tr>
          <tr v-if="riwayatDetail.length === 0">
            <td colspan="4" class="py-4 text-center text-ink-500 dark:text-ink-300">Belum ada riwayat.</td>
          </tr>
        </tbody>
      </table>
      <button type="button" class="mt-4 w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showRiwayat = false">
        Tutup
      </button>
    </div>
  </div>
</template>