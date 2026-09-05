-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "kolam" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_kolam" varchar(50) NOT NULL,
	"luas_m2" numeric,
	"status" varchar(20) DEFAULT 'kosong' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
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
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jenis_ikan" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"hari_sortir" integer NOT NULL,
	"hari_panen" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jadwal" (
	"id" serial PRIMARY KEY NOT NULL,
	"tebar_id" integer NOT NULL,
	"kolam_id" integer NOT NULL,
	"jenis" varchar(20) NOT NULL,
	"tanggal_jadwal" date NOT NULL,
	"status" varchar(20) DEFAULT 'belum' NOT NULL,
	"created_at" timestamp DEFAULT now()
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
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "panen" (
	"id" serial PRIMARY KEY NOT NULL,
	"jadwal_id" integer,
	"tebar_id" integer NOT NULL,
	"kolam_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"jumlah_ekor" integer NOT NULL,
	"berat_kg" numeric,
	"catatan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pakan" (
	"id" serial PRIMARY KEY NOT NULL,
	"kolam_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"jumlah_kg" numeric NOT NULL,
	"biaya" numeric DEFAULT '0' NOT NULL,
	"catatan" text,
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
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pengeluaran" (
	"id" serial PRIMARY KEY NOT NULL,
	"kategori" varchar(30) NOT NULL,
	"jumlah" numeric NOT NULL,
	"deskripsi" text,
	"tanggal" date NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pengaturan_akun" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"email" varchar(100),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tebar" ADD CONSTRAINT "tebar_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tebar" ADD CONSTRAINT "tebar_jenis_ikan_id_fkey" FOREIGN KEY ("jenis_ikan_id") REFERENCES "public"."jenis_ikan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_tebar_id_fkey" FOREIGN KEY ("tebar_id") REFERENCES "public"."tebar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sortir" ADD CONSTRAINT "sortir_jadwal_id_fkey" FOREIGN KEY ("jadwal_id") REFERENCES "public"."jadwal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sortir" ADD CONSTRAINT "sortir_tebar_id_fkey" FOREIGN KEY ("tebar_id") REFERENCES "public"."tebar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sortir" ADD CONSTRAINT "sortir_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panen" ADD CONSTRAINT "panen_jadwal_id_fkey" FOREIGN KEY ("jadwal_id") REFERENCES "public"."jadwal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panen" ADD CONSTRAINT "panen_tebar_id_fkey" FOREIGN KEY ("tebar_id") REFERENCES "public"."tebar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panen" ADD CONSTRAINT "panen_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pakan" ADD CONSTRAINT "pakan_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penjualan" ADD CONSTRAINT "penjualan_jenis_ikan_id_fkey" FOREIGN KEY ("jenis_ikan_id") REFERENCES "public"."jenis_ikan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penjualan" ADD CONSTRAINT "penjualan_kolam_id_fkey" FOREIGN KEY ("kolam_id") REFERENCES "public"."kolam"("id") ON DELETE no action ON UPDATE no action;
*/