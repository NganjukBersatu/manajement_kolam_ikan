-- 001_business_id.sql
-- Menambah kolom business_id ke 13 tabel data (multi-tenant).
-- Data lama dimasukkan ke business milik akun 'admin1'.
-- Semua dijalankan dalam satu transaksi: kalau ada error, tidak ada yang berubah.

BEGIN;

DO $$
DECLARE
  pemilik_biz integer;
  tabel text;
  daftar_tabel text[] := ARRAY[
    'jenis_ikan', 'kolam', 'tebar', 'jadwal', 'sortir', 'panen',
    'pakan', 'obat', 'ganti_air', 'penjualan', 'pengeluaran',
    'stok_pakan', 'pengaturan_akun'
  ];
BEGIN
  -- Cari business milik pemilik data lama
  SELECT business_id INTO pemilik_biz FROM users WHERE username = 'admin1';

  IF pemilik_biz IS NULL THEN
    RAISE EXCEPTION 'User admin1 tidak ditemukan atau belum punya business_id';
  END IF;

  FOREACH tabel IN ARRAY daftar_tabel LOOP
    -- 1. Tambah kolom (boleh kosong dulu, supaya data lama bisa diisi)
    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS business_id integer REFERENCES businesses(id) ON DELETE CASCADE',
      tabel
    );

    -- 2. Isi data lama dengan business milik admin1
    EXECUTE format(
      'UPDATE %I SET business_id = %s WHERE business_id IS NULL',
      tabel, pemilik_biz
    );

    -- 3. Setelah semua terisi, wajibkan tidak boleh kosong
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN business_id SET NOT NULL',
      tabel
    );

    -- 4. Index supaya query per business cepat
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I (business_id)',
      'idx_' || tabel || '_business_id', tabel
    );
  END LOOP;
END $$;

COMMIT;