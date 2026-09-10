-- Menambahkan kolom harga_per_kg ke tabel jenis_ikan jika belum ada
ALTER TABLE jenis_ikan ADD COLUMN IF NOT EXISTS harga_per_kg NUMERIC NOT NULL DEFAULT 0;

-- Berikan nilai default harga perkilo untuk jenis ikan bawaan (jika masih 0)
UPDATE jenis_ikan SET harga_per_kg = 25000 WHERE LOWER(nama) = 'lele' AND (harga_per_kg = 0 OR harga_per_kg IS NULL);
UPDATE jenis_ikan SET harga_per_kg = 35000 WHERE LOWER(nama) = 'nila' AND (harga_per_kg = 0 OR harga_per_kg IS NULL);
UPDATE jenis_ikan SET harga_per_kg = 55000 WHERE LOWER(nama) = 'gurame' AND (harga_per_kg = 0 OR harga_per_kg IS NULL);
