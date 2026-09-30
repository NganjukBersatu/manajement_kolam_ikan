import { pgTable, index, foreignKey, serial, integer, date, numeric, text, timestamp, unique, check, varchar, uniqueIndex, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



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
	businessId: integer("business_id").notNull(),
}, (table) => [
	index("idx_panen_business_id").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
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
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "panen_business_id_fkey"
		}).onDelete("cascade"),
]);

export const pakan = pgTable("pakan", {
	id: serial().primaryKey().notNull(),
	kolamId: integer("kolam_id").notNull(),
	tanggal: date().notNull(),
	jumlahKg: numeric("jumlah_kg").notNull(),
	biaya: numeric().default('0').notNull(),
	catatan: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	stokPakanId: integer("stok_pakan_id"),
	sesi: varchar({ length: 10 }).notNull(),
	businessId: integer("business_id").notNull(),
}, (table) => [
	index("idx_pakan_business_id").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
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
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "pakan_business_id_fkey"
		}).onDelete("cascade"),
	unique("uq_pakan_kolam_tanggal_sesi").on(table.tanggal, table.sesi, table.kolamId),
	check("pakan_sesi_check", sql`(sesi)::text = ANY ((ARRAY['pagi'::character varying, 'siang'::character varying, 'sore'::character varying])::text[])`),
]);

export const jenisIkan = pgTable("jenis_ikan", {
	id: serial().primaryKey().notNull(),
	nama: varchar({ length: 100 }).notNull(),
	hariSortir: integer("hari_sortir"),
	hariPanen: integer("hari_panen"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	hargaPerKg: numeric("harga_per_kg").default('0').notNull(),
	hariObatPertama: integer("hari_obat_pertama").default(7),
	intervalObatHari: integer("interval_obat_hari").default(14),
	businessId: integer("business_id").notNull(),
}, (table) => [
	index("idx_jenis_ikan_business_id").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "jenis_ikan_business_id_fkey"
		}).onDelete("cascade"),
]);

export const kolam = pgTable("kolam", {
	id: serial().primaryKey().notNull(),
	namaKolam: varchar("nama_kolam", { length: 50 }).notNull(),
	luasM2: numeric("luas_m2"),
	status: varchar({ length: 20 }).default('kosong').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	jenisIkanId: integer("jenis_ikan_id"),
	intervalGantiAirHari: integer("interval_ganti_air_hari").default(7),
	businessId: integer("business_id").notNull(),
}, (table) => [
	index("idx_kolam_business_id").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.jenisIkanId],
			foreignColumns: [jenisIkan.id],
			name: "kolam_jenis_ikan_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "kolam_business_id_fkey"
		}).onDelete("cascade"),
]);

export const tebar = pgTable("tebar", {
	id: serial().primaryKey().notNull(),
	kolamId: integer("kolam_id").notNull(),
	jenisIkanId: integer("jenis_ikan_id").notNull(),
	tanggalTebar: date("tanggal_tebar").notNull(),
	jumlahBibit: integer("jumlah_bibit").notNull(),
	jumlahSaatIni: integer("jumlah_saat_ini").notNull(),
	status: varchar({ length: 20 }).default('aktif').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	businessId: integer("business_id").notNull(),
}, (table) => [
	index("idx_tebar_business_id").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
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
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "tebar_business_id_fkey"
		}).onDelete("cascade"),
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
	sortirKe: integer("sortir_ke").default(1).notNull(),
	businessId: integer("business_id").notNull(),
}, (table) => [
	index("idx_sortir_business_id").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
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
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "sortir_business_id_fkey"
		}).onDelete("cascade"),
]);

export const jadwal = pgTable("jadwal", {
	id: serial().primaryKey().notNull(),
	tebarId: integer("tebar_id").notNull(),
	kolamId: integer("kolam_id").notNull(),
	jenis: varchar({ length: 20 }).notNull(),
	tanggalJadwal: date("tanggal_jadwal").notNull(),
	status: varchar({ length: 20 }).default('belum').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	businessId: integer("business_id").notNull(),
	catatan: text(),
}, (table) => [
	index("idx_jadwal_business_id").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
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
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "jadwal_business_id_fkey"
		}).onDelete("cascade"),
]);

export const obat = pgTable("obat", {
	id: serial().primaryKey().notNull(),
	kolamId: integer("kolam_id").notNull(),
	tanggal: date().notNull(),
	namaObat: varchar("nama_obat", { length: 100 }).notNull(),
	dosis: varchar({ length: 50 }),
	biaya: numeric().default('0'),
	catatan: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	jadwalId: integer("jadwal_id"),
	businessId: integer("business_id").notNull(),
}, (table) => [
	index("idx_obat_business_id").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.kolamId],
			foreignColumns: [kolam.id],
			name: "obat_kolam_id_fkey"
		}),
	foreignKey({
			columns: [table.jadwalId],
			foreignColumns: [jadwal.id],
			name: "obat_jadwal_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "obat_business_id_fkey"
		}).onDelete("cascade"),
]);

export const businesses = pgTable("businesses", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 150 }).notNull(),
	address: text(),
	phone: varchar({ length: 30 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 50 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	businessId: integer("business_id"),
}, (table) => [
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "users_business_id_fkey"
		}),
	unique("users_username_unique").on(table.username),
]);

export const businessCommodities = pgTable("business_commodities", {
	id: serial().primaryKey().notNull(),
	businessId: integer("business_id").notNull(),
	commodityKey: varchar("commodity_key", { length: 20 }).notNull(),
	label: varchar({ length: 50 }).notNull(),
	initialPools: integer("initial_pools").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "business_commodities_business_id_fkey"
		}).onDelete("cascade"),
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
	businessId: integer("business_id").notNull(),
}, (table) => [
	index("idx_penjualan_business_id").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
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
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "penjualan_business_id_fkey"
		}).onDelete("cascade"),
]);

export const pengeluaran = pgTable("pengeluaran", {
	id: serial().primaryKey().notNull(),
	kategori: varchar({ length: 30 }).notNull(),
	jumlah: numeric().notNull(),
	deskripsi: text(),
	tanggal: date().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	businessId: integer("business_id").notNull(),
}, (table) => [
	index("idx_pengeluaran_business_id").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "pengeluaran_business_id_fkey"
		}).onDelete("cascade"),
]);

export const stokPakan = pgTable("stok_pakan", {
	id: serial().primaryKey().notNull(),
	nama: varchar({ length: 100 }).notNull(),
	stok: numeric({ precision: 12, scale:  2 }).default('0').notNull(),
	satuan: varchar({ length: 20 }).default('kg').notNull(),
	stokMinimum: numeric("stok_minimum", { precision: 12, scale:  2 }).default('10').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	hargaPerKg: numeric("harga_per_kg", { precision: 12, scale:  2 }).default('0'),
	businessId: integer("business_id").notNull(),
}, (table) => [
	index("idx_stok_pakan_business_id").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "stok_pakan_business_id_fkey"
		}).onDelete("cascade"),
]);

export const pengaturanAkun = pgTable("pengaturan_akun", {
	id: serial().primaryKey().notNull(),
	nama: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	businessId: integer("business_id").notNull(),
	foto: text(),
	usaha: jsonb().default({}).notNull(),
}, (table) => [
	index("idx_pengaturan_akun_business_id").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("uq_pengaturan_akun_business").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "pengaturan_akun_business_id_fkey"
		}).onDelete("cascade"),
]);

export const gantiAir = pgTable("ganti_air", {
	id: serial().primaryKey().notNull(),
	jadwalId: integer("jadwal_id"),
	tebarId: integer("tebar_id").notNull(),
	kolamId: integer("kolam_id").notNull(),
	tanggal: date().notNull(),
	persentaseAir: numeric("persentase_air").default('0').notNull(),
	catatan: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	businessId: integer("business_id").notNull(),
}, (table) => [
	index("idx_ganti_air_business_id").using("btree", table.businessId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.jadwalId],
			foreignColumns: [jadwal.id],
			name: "ganti_air_jadwal_id_fkey"
		}),
	foreignKey({
			columns: [table.tebarId],
			foreignColumns: [tebar.id],
			name: "ganti_air_tebar_id_fkey"
		}),
	foreignKey({
			columns: [table.kolamId],
			foreignColumns: [kolam.id],
			name: "ganti_air_kolam_id_fkey"
		}),
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "ganti_air_business_id_fkey"
		}).onDelete("cascade"),
]);
