-- Menambahkan kolom jadwal_id ke tabel obat jika belum ada.
-- Kolom ini dipakai supaya saat mencatat pemberian obat lewat halaman
-- "Jadwal Pemberian Obat", jadwal terkait bisa otomatis ditandai selesai
-- (lihat api/src/routes/obat.js). Tabel sortir & panen sudah punya kolom
-- serupa, tapi obat tertinggal saat itu.

ALTER TABLE obat ADD COLUMN IF NOT EXISTS jadwal_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'obat_jadwal_id_fkey'
  ) THEN
    ALTER TABLE obat
      ADD CONSTRAINT obat_jadwal_id_fkey
      FOREIGN KEY (jadwal_id) REFERENCES jadwal(id)
      ON DELETE SET NULL;
  END IF;
END $$;