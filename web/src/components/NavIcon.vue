<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 16 }
})

const paths = {
  home: 'M3 12l9-9 9 9M4 10v10h6v-6h4v6h6V10',
  wallet: 'M3 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z M16 12h2',
  fish: 'M2 12s4-6 12-6 8 6 8 6-4 6-8 6-12-6-12-6z M18 9l2-2m-2 5l2 2',
  calendar: 'M3 4h18v18H3z M3 10h18 M8 2v4 M16 2v4',
  chart: 'M4 20V10 M10 20V4 M16 20v-8 M22 20H2',
  file: 'M6 2h9l5 5v15H6z M15 2v5h5',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19 12a7 7 0 00-.2-1.6l2-1.6-2-3.4-2.4 1a7 7 0 00-2.8-1.6L13 2h-2l-.6 2.8a7 7 0 00-2.8 1.6l-2.4-1-2 3.4 2 1.6A7 7 0 005 12a7 7 0 00.2 1.6l-2 1.6 2 3.4 2.4-1a7 7 0 002.8 1.6L11 22h2l.6-2.8a7 7 0 002.8-1.6l2.4 1 2-3.4-2-1.6c.13-.52.2-1.06.2-1.6z',
  scissors: 'M6 9a3 3 0 100-6 3 3 0 000 6z M6 21a3 3 0 100-6 3 3 0 000 6z M20 4L8.5 12 20 20 M9.5 12L4 8.5m5.5 3.5L4 15.5',
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m14.14-6.14l1.42-1.42M4.44 19.56l1.42-1.42M19.56 19.56l-1.42-1.42M4.44 4.44l1.42 1.42M12 7a5 5 0 100 10 5 5 0 000-10z',
  moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z'
}
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path :d="paths[name] || paths.file" />
  </svg>
</template>