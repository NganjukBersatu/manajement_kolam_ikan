-- Tambah kolom interval ganti air ke tabel kolam
ALTER TABLE kolam ADD COLUMN IF NOT EXISTS interval_ganti_air_hari INT NOT NULL DEFAULT 7;

-- Tabel riwayat ganti air (mirip struktur sortir)
CREATE TABLE IF NOT EXISTS ganti_air (
  id SERIAL PRIMARY KEY,
  jadwal_id INT REFERENCES jadwal(id),
  tebar_id INT NOT NULL REFERENCES tebar(id),
  kolam_id INT NOT NULL REFERENCES kolam(id),
  tanggal DATE NOT NULL,
  persentase_air NUMERIC NOT NULL DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);