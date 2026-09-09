import { pgTable, serial, varchar, numeric, timestamp, foreignKey, integer, date, text, unique, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const kolam = pgTable("kolam", {
	id: serial().primaryKey().notNull(),
	namaKolam: varchar("nama_kolam", { length: 50 }).notNull(),
	luasM2: numeric("luas_m2"),
	status: varchar({ length: 20 }).default('kosong').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const tebar = pgTable("tebar", {
	id: serial().primaryKey().notNull(),
	kolamId: integer("kolam_id").notNull(),
	jenisIkanId: integer("jenis_ikan_id").notNull(),
	tanggalTebar: date("tanggal_tebar").notNull(),
	jumlahBibit: integer("jumlah_bibit").notNull(),
	jumlahSaatIni: integer("jumlah_saat_ini").notNull(),
	status: varchar({ length: 20 }).default('aktif').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.kolamId],
			foreignColumns: [kolam.id],
			name: "tebar_kolam_id_fkey"
		}),
	foreignKey({
			columns: [table.jenisIkanId],
			foreignColumns: [jenisIkan.id],
			name: "tebar_jenis_ikan_id_fkey"
		}),
]);

export const jenisIkan = pgTable("jenis_ikan", {
	id: serial().primaryKey().notNull(),
	nama: varchar({ length: 100 }).notNull(),
	hariSortir: integer("hari_sortir").notNull(),
	hariPanen: integer("hari_panen").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const jadwal = pgTable("jadwal", {
	id: serial().primaryKey().notNull(),
	tebarId: integer("tebar_id").notNull(),
	kolamId: integer("kolam_id").notNull(),
	jenis: varchar({ length: 20 }).notNull(),
	tanggalJadwal: date("tanggal_jadwal").notNull(),
	status: varchar({ length: 20 }).default('belum').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tebarId],
			foreignColumns: [tebar.id],
			name: "jadwal_tebar_id_fkey"
		}),
	foreignKey({
			columns: [table.kolamId],
			foreignColumns: [kolam.id],
			name: "jadwal_kolam_id_fkey"
		}),
]);

export const sortir = pgTable("sortir", {
	id: serial().primaryKey().notNull(),
	jadwalId: integer("jadwal_id"),
	tebarId: integer("tebar_id").notNull(),
	kolamId: integer("kolam_id").notNull(),
	tanggal: date().notNull(),
	jumlahMati: integer("jumlah_mati").default(0).notNull(),
	catatan: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.jadwalId],
			foreignColumns: [jadwal.id],
			name: "sortir_jadwal_id_fkey"
		}),
	foreignKey({
			columns: [table.tebarId],
			foreignColumns: [tebar.id],
			name: "sortir_tebar_id_fkey"
		}),
	foreignKey({
			columns: [table.kolamId],
			foreignColumns: [kolam.id],
			name: "sortir_kolam_id_fkey"
		}),
]);

export const panen = pgTable("panen", {
	id: serial().primaryKey().notNull(),
	jadwalId: integer("jadwal_id"),
	tebarId: integer("tebar_id").notNull(),
	kolamId: integer("kolam_id").notNull(),
	tanggal: date().notNull(),
	jumlahEkor: integer("jumlah_ekor").notNull(),
	beratKg: numeric("berat_kg"),
	catatan: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.jadwalId],
			foreignColumns: [jadwal.id],
			name: "panen_jadwal_id_fkey"
		}),
	foreignKey({
			columns: [table.tebarId],
			foreignColumns: [tebar.id],
			name: "panen_tebar_id_fkey"
		}),
	foreignKey({
			columns: [table.kolamId],
			foreignColumns: [kolam.id],
			name: "panen_kolam_id_fkey"
		}),
]);

export const stokPakan = pgTable("stok_pakan", {
	id: serial().primaryKey().notNull(),
	nama: varchar({ length: 100 }).notNull(),
	stok: numeric({ precision: 12, scale: 2 }).default('0').notNull(),
	satuan: varchar({ length: 20 }).default('kg').notNull(),
	stokMinimum: numeric("stok_minimum", { precision: 12, scale: 2 }).default('10').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const pakan = pgTable("pakan", {
	id: serial().primaryKey().notNull(),
	kolamId: integer("kolam_id").notNull(),
	tanggal: date().notNull(),
	sesi: varchar({ length: 20 }),
	jumlahKg: numeric("jumlah_kg").notNull(),
	biaya: numeric().default('0').notNull(),
	catatan: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	stokPakanId: integer("stok_pakan_id"),
	sesi: varchar({ length: 10 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.kolamId],
			foreignColumns: [kolam.id],
			name: "pakan_kolam_id_fkey"
		}),
	foreignKey({
			columns: [table.stokPakanId],
			foreignColumns: [stokPakan.id],
			name: "pakan_stok_pakan_id_fkey"
		}).onDelete("set null"),
	unique("uq_pakan_kolam_tanggal_sesi").on(table.tanggal, table.sesi, table.kolamId),
	check("pakan_sesi_check", sql`(sesi)::text = ANY ((ARRAY['pagi'::character varying, 'siang'::character varying, 'sore'::character varying])::text[])`),
]);

export const penjualan = pgTable("penjualan", {
	id: serial().primaryKey().notNull(),
	tanggal: date().notNull(),
	jenisIkanId: integer("jenis_ikan_id").notNull(),
	kolamId: integer("kolam_id"),
	jumlahKg: numeric("jumlah_kg").notNull(),
	hargaPerKg: numeric("harga_per_kg").notNull(),
	total: numeric().notNull(),
	catatan: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.jenisIkanId],
			foreignColumns: [jenisIkan.id],
			name: "penjualan_jenis_ikan_id_fkey"
		}),
	foreignKey({
			columns: [table.kolamId],
			foreignColumns: [kolam.id],
			name: "penjualan_kolam_id_fkey"
		}),
]);

export const pengeluaran = pgTable("pengeluaran", {
	id: serial().primaryKey().notNull(),
	kategori: varchar({ length: 30 }).notNull(),
	jumlah: numeric().notNull(),
	deskripsi: text(),
	tanggal: date().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const pengaturanAkun = pgTable("pengaturan_akun", {
	id: serial().primaryKey().notNull(),
	nama: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

// Tabel akun login (admin dashboard)
export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 50 }).notNull().unique(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
 tambahgantiair
});

export const obat = pgTable("obat", {
	id: serial().primaryKey().notNull(),
	kolamId: integer("kolam_id").notNull(),
	tanggal: date().notNull(),
	namaObat: varchar("nama_obat", { length: 100 }).notNull(),
	dosis: varchar({ length: 50 }),
	biaya: numeric().default('0'),
	catatan: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.kolamId],
		foreignColumns: [kolam.id],
		name: "obat_kolam_id_fkey"
	}),
]);

export const stokPakan = pgTable("stok_pakan", {
	id: serial().primaryKey().notNull(),
	nama: varchar({ length: 100 }).notNull(),
	stok: numeric({ precision: 12, scale: 2 }).default('0').notNull(),
	satuan: varchar({ length: 20 }).default('kg').notNull(),
	stokMinimum: numeric("stok_minimum", { precision: 12, scale: 2 }).default('10').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});
=======
}, (table) => [
	unique("users_username_unique").on(table.username),
])
main
