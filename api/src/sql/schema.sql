CREATE TABLE jenis_ikan (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  hari_sortir INT NOT NULL,   -- jumlah hari setelah tebar untuk jadwal sortir
  hari_panen INT NOT NULL,    -- jumlah hari setelah tebar untuk jadwal panen
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE kolam (
  id SERIAL PRIMARY KEY,
  nama_kolam VARCHAR(50) NOT NULL,
  luas_m2 NUMERIC,
  status VARCHAR(20) NOT NULL DEFAULT 'kosong', -- kosong | aktif | panen
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tebar (
  id SERIAL PRIMARY KEY,
  kolam_id INT NOT NULL REFERENCES kolam(id),
  jenis_ikan_id INT NOT NULL REFERENCES jenis_ikan(id),
  tanggal_tebar DATE NOT NULL,
  jumlah_bibit INT NOT NULL,
  jumlah_saat_ini INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aktif', -- aktif | selesai
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE jadwal (
  id SERIAL PRIMARY KEY,
  tebar_id INT NOT NULL REFERENCES tebar(id),
  kolam_id INT NOT NULL REFERENCES kolam(id),
  jenis VARCHAR(20) NOT NULL, -- sortir | panen
  tanggal_jadwal DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'belum', -- belum | selesai
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sortir (
  id SERIAL PRIMARY KEY,
  jadwal_id INT REFERENCES jadwal(id),
  tebar_id INT NOT NULL REFERENCES tebar(id),
  kolam_id INT NOT NULL REFERENCES kolam(id),
  tanggal DATE NOT NULL,
  jumlah_mati INT NOT NULL DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE panen (
  id SERIAL PRIMARY KEY,
  jadwal_id INT REFERENCES jadwal(id),
  tebar_id INT NOT NULL REFERENCES tebar(id),
  kolam_id INT NOT NULL REFERENCES kolam(id),
  tanggal DATE NOT NULL,
  jumlah_ekor INT NOT NULL,
  berat_kg NUMERIC,
  catatan TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pakan (
  id SERIAL PRIMARY KEY,
  kolam_id INT NOT NULL REFERENCES kolam(id),
  tanggal DATE NOT NULL,
  jumlah_kg NUMERIC NOT NULL,
  biaya NUMERIC NOT NULL DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE penjualan (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  jenis_ikan_id INT NOT NULL REFERENCES jenis_ikan(id),
  kolam_id INT REFERENCES kolam(id),
  jumlah_kg NUMERIC NOT NULL,
  harga_per_kg NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  catatan TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pengeluaran (
  id SERIAL PRIMARY KEY,
  kategori VARCHAR(30) NOT NULL, -- obat | listrik | gaji | perlengkapan | lainnya
  jumlah NUMERIC NOT NULL,
  deskripsi TEXT,
  tanggal DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pengaturan_akun (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO pengaturan_akun (id, nama, email) VALUES (1, 'Pemilik Kolam', '') ON CONFLICT DO NOTHING;

-- contoh data jenis ikan (silakan sesuaikan)
INSERT INTO jenis_ikan (nama, hari_sortir, hari_panen) VALUES
  ('Lele', 30, 75),
  ('Nila', 45, 120),
  ('Gurame', 60, 180);