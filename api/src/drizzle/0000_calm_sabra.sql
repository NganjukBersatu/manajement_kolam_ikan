-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "panen" (
	"id" serial PRIMARY KEY NOT NULL,
	"jadwal_id" integer,
	"tebar_id" integer NOT NULL,
	"kolam_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"jumlah_ekor" integer NOT NULL,
	"berat_kg" numeric,
	"catatan" text,
	"created_at" timestamp DEFAULT now(),
	"business_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pakan" (
	"id" serial PRIMARY KEY NOT NULL,
	"kolam_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"jumlah_kg" numeric NOT NULL,
	"biaya" numeric DEFAULT '0' NOT NULL,
	"catatan" text,
	"created_at" timestamp DEFAULT now(),
	"stok_pakan_id" integer,
	"sesi" varchar(10) NOT NULL,
	"business_id" integer NOT NULL,
	CONSTRAINT "uq_pakan_kolam_tanggal_sesi" UNIQUE("tanggal","sesi","kolam_id"),
	CONSTRAINT "pakan_sesi_check" CHECK ((sesi)::text = ANY ((ARRAY['pagi'::character varying, 'siang'::character varying, 'sore'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "jenis_ikan" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"hari_sortir" integer,
	"hari_panen" integer,
	"created_at" timestamp DEFAULT now(),
	"harga_per_kg" numeric DEFAULT '0' NOT NULL,
	"hari_obat_pertama" integer DEFAULT 7,
	"interval_obat_hari" integer DEFAULT 14,
	"business_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kolam" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_kolam" varchar(50) NOT NULL,
	"luas_m2" numeric,
	"status" varchar(20) DEFAULT 'kosong' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"jenis_ikan_id" integer,
	"interval_ganti_air_hari" integer DEFAULT 7,
	"business_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tebar" (
	"id" serial PRIMARY KEY NOT NULL,
	"kolam_id" integer NOT NULL,
	"jenis_ikan_id" integer NOT NULL,
	"tanggal_tebar" date NOT NULL,
	"jumlah_bibit" integer NOT NULL,
	"jumlah_saat_ini" integer NOT NULL,
	"status" varchar(20) DEFAULT 'aktif' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"business_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sortir" (
	"id" serial PRIMARY KEY NOT NULL,
	"jadwal_id" integer,
	"tebar_id" integer NOT NULL,
	"kolam_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"jumlah_mati" integer DEFAULT 0 NOT NULL,
	"catatan" text,
	"created_at" timestamp DEFAULT now(),
	"sortir_ke" integer DEFAULT 1 NOT NULL,
	"business_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jadwal" (
	"id" serial PRIMARY KEY NOT NULL,
	"tebar_id" integer NOT NULL,
	"kolam_id" integer NOT NULL,
	"jenis" varchar(20) NOT NULL,
	"tanggal_jadwal" date NOT NULL,
	"status" varchar(20) DEFAULT 'belum' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"business_id" integer NOT NULL,
	"catatan" text
);
--> statement-breakpoint
CREATE TABLE "obat" (
	"id" serial PRIMARY KEY NOT NULL,
	"kolam_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"nama_obat" varchar(100) NOT NULL,
	"dosis" varchar(50),
	"biaya" numeric DEFAULT '0',
	"catatan" text,
	"created_at" timestamp DEFAULT now(),
	"jadwal_id" integer,
	"business_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"address" text,
	"phone" varchar(30),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"business_id" integer,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "business_commodities" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"commodity_key" varchar(20) NOT NULL,
	"label" varchar(50) NOT NULL,
	"initial_pools" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "penjualan" (
	"id" serial PRIMARY KEY NOT NULL,
	"tanggal" date NOT NULL,
	"jenis_ikan_id" integer NOT NULL,
	"kolam_id" integer,
	"jumlah_kg" numeric NOT NULL,
	"harga_per_kg" numeric NOT NULL,
	"total" numeric NOT NULL,
	"catatan" text,
	"created_at" timestamp DEFAULT now(),
	"business_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengeluaran" (
	"id" serial PRIMARY KEY NOT NULL,
	"kategori" varchar(30) NOT NULL,
	"jumlah" numeric NOT NULL,
	"deskripsi" text,
	"tanggal" date NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"business_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stok_pakan" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"stok" numeric(12, 2) DEFAULT '0' NOT NULL,
	"satuan" varchar(20) DEFAULT 'kg' NOT NULL,
	"stok_minimum" numeric(12, 2) DEFAULT '10' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"harga_per_kg" numeric(12, 2) DEFAULT '0',
	"business_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengaturan_akun" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"email" varchar(100),
	"updated_at" timestamp DEFAULT now(),
	"business_id" integer NOT NULL,
	"foto" text,
	"usaha" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ganti_air" (
	"id" serial PRIMARY KEY NOT NULL,
	"jadwal_id" integer,
	"tebar_id" integer NOT NULL,
	"kolam_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"persentase_air" numeric DEFAULT '0' NOT NULL,
	"catatan" text,
	"created_at" timestamp DEFAULT now(),
	"business_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "panen" ADD CONSTRAINT "panen_jadwal_id_fkey" FOREIGN KEY ("jadwal_id") REFERENCES "public"."jadwal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panen" ADD CONSTRAINT "panen_tebar_id_fkey" FOREIGN KEY ("tebar_id") REFERENCES "public"."tebar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panen" ADD CONSTRAINT "panen_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panen" ADD CONSTRAINT "panen_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pakan" ADD CONSTRAINT "pakan_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pakan" ADD CONSTRAINT "pakan_stok_pakan_id_fkey" FOREIGN KEY ("stok_pakan_id") REFERENCES "public"."stok_pakan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pakan" ADD CONSTRAINT "pakan_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jenis_ikan" ADD CONSTRAINT "jenis_ikan_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kolam" ADD CONSTRAINT "kolam_jenis_ikan_id_fkey" FOREIGN KEY ("jenis_ikan_id") REFERENCES "public"."jenis_ikan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kolam" ADD CONSTRAINT "kolam_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tebar" ADD CONSTRAINT "tebar_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tebar" ADD CONSTRAINT "tebar_jenis_ikan_id_fkey" FOREIGN KEY ("jenis_ikan_id") REFERENCES "public"."jenis_ikan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tebar" ADD CONSTRAINT "tebar_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sortir" ADD CONSTRAINT "sortir_jadwal_id_fkey" FOREIGN KEY ("jadwal_id") REFERENCES "public"."jadwal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sortir" ADD CONSTRAINT "sortir_tebar_id_fkey" FOREIGN KEY ("tebar_id") REFERENCES "public"."tebar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sortir" ADD CONSTRAINT "sortir_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sortir" ADD CONSTRAINT "sortir_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_tebar_id_fkey" FOREIGN KEY ("tebar_id") REFERENCES "public"."tebar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obat" ADD CONSTRAINT "obat_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obat" ADD CONSTRAINT "obat_jadwal_id_fkey" FOREIGN KEY ("jadwal_id") REFERENCES "public"."jadwal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obat" ADD CONSTRAINT "obat_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_commodities" ADD CONSTRAINT "business_commodities_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penjualan" ADD CONSTRAINT "penjualan_jenis_ikan_id_fkey" FOREIGN KEY ("jenis_ikan_id") REFERENCES "public"."jenis_ikan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penjualan" ADD CONSTRAINT "penjualan_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penjualan" ADD CONSTRAINT "penjualan_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengeluaran" ADD CONSTRAINT "pengeluaran_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stok_pakan" ADD CONSTRAINT "stok_pakan_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengaturan_akun" ADD CONSTRAINT "pengaturan_akun_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ganti_air" ADD CONSTRAINT "ganti_air_jadwal_id_fkey" FOREIGN KEY ("jadwal_id") REFERENCES "public"."jadwal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ganti_air" ADD CONSTRAINT "ganti_air_tebar_id_fkey" FOREIGN KEY ("tebar_id") REFERENCES "public"."tebar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ganti_air" ADD CONSTRAINT "ganti_air_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ganti_air" ADD CONSTRAINT "ganti_air_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_panen_business_id" ON "panen" USING btree ("business_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_pakan_business_id" ON "pakan" USING btree ("business_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_jenis_ikan_business_id" ON "jenis_ikan" USING btree ("business_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_kolam_business_id" ON "kolam" USING btree ("business_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_tebar_business_id" ON "tebar" USING btree ("business_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_sortir_business_id" ON "sortir" USING btree ("business_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_jadwal_business_id" ON "jadwal" USING btree ("business_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_obat_business_id" ON "obat" USING btree ("business_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_penjualan_business_id" ON "penjualan" USING btree ("business_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_pengeluaran_business_id" ON "pengeluaran" USING btree ("business_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_stok_pakan_business_id" ON "stok_pakan" USING btree ("business_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_pengaturan_akun_business_id" ON "pengaturan_akun" USING btree ("business_id" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pengaturan_akun_business" ON "pengaturan_akun" USING btree ("business_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_ganti_air_business_id" ON "ganti_air" USING btree ("business_id" int4_ops);
*/