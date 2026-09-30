import { relations } from "drizzle-orm/relations";
import { jadwal, panen, tebar, kolam, businesses, pakan, stokPakan, jenisIkan, sortir, obat, users, businessCommodities, penjualan, pengeluaran, pengaturanAkun, gantiAir } from "./schema";

export const panenRelations = relations(panen, ({one}) => ({
	jadwal: one(jadwal, {
		fields: [panen.jadwalId],
		references: [jadwal.id]
	}),
	tebar: one(tebar, {
		fields: [panen.tebarId],
		references: [tebar.id]
	}),
	kolam: one(kolam, {
		fields: [panen.kolamId],
		references: [kolam.id]
	}),
	business: one(businesses, {
		fields: [panen.businessId],
		references: [businesses.id]
	}),
}));

export const jadwalRelations = relations(jadwal, ({one, many}) => ({
	panens: many(panen),
	sortirs: many(sortir),
	tebar: one(tebar, {
		fields: [jadwal.tebarId],
		references: [tebar.id]
	}),
	kolam: one(kolam, {
		fields: [jadwal.kolamId],
		references: [kolam.id]
	}),
	business: one(businesses, {
		fields: [jadwal.businessId],
		references: [businesses.id]
	}),
	obats: many(obat),
	gantiAirs: many(gantiAir),
}));

export const tebarRelations = relations(tebar, ({one, many}) => ({
	panens: many(panen),
	kolam: one(kolam, {
		fields: [tebar.kolamId],
		references: [kolam.id]
	}),
	jenisIkan: one(jenisIkan, {
		fields: [tebar.jenisIkanId],
		references: [jenisIkan.id]
	}),
	business: one(businesses, {
		fields: [tebar.businessId],
		references: [businesses.id]
	}),
	sortirs: many(sortir),
	jadwals: many(jadwal),
	gantiAirs: many(gantiAir),
}));

export const kolamRelations = relations(kolam, ({one, many}) => ({
	panens: many(panen),
	pakans: many(pakan),
	jenisIkan: one(jenisIkan, {
		fields: [kolam.jenisIkanId],
		references: [jenisIkan.id]
	}),
	business: one(businesses, {
		fields: [kolam.businessId],
		references: [businesses.id]
	}),
	tebars: many(tebar),
	sortirs: many(sortir),
	jadwals: many(jadwal),
	obats: many(obat),
	penjualans: many(penjualan),
	gantiAirs: many(gantiAir),
}));

export const businessesRelations = relations(businesses, ({many}) => ({
	panens: many(panen),
	pakans: many(pakan),
	jenisIkans: many(jenisIkan),
	kolams: many(kolam),
	tebars: many(tebar),
	sortirs: many(sortir),
	jadwals: many(jadwal),
	obats: many(obat),
	users: many(users),
	businessCommodities: many(businessCommodities),
	penjualans: many(penjualan),
	pengeluarans: many(pengeluaran),
	stokPakans: many(stokPakan),
	pengaturanAkuns: many(pengaturanAkun),
	gantiAirs: many(gantiAir),
}));

export const pakanRelations = relations(pakan, ({one}) => ({
	kolam: one(kolam, {
		fields: [pakan.kolamId],
		references: [kolam.id]
	}),
	stokPakan: one(stokPakan, {
		fields: [pakan.stokPakanId],
		references: [stokPakan.id]
	}),
	business: one(businesses, {
		fields: [pakan.businessId],
		references: [businesses.id]
	}),
}));

export const stokPakanRelations = relations(stokPakan, ({one, many}) => ({
	pakans: many(pakan),
	business: one(businesses, {
		fields: [stokPakan.businessId],
		references: [businesses.id]
	}),
}));

export const jenisIkanRelations = relations(jenisIkan, ({one, many}) => ({
	business: one(businesses, {
		fields: [jenisIkan.businessId],
		references: [businesses.id]
	}),
	kolams: many(kolam),
	tebars: many(tebar),
	penjualans: many(penjualan),
}));

export const sortirRelations = relations(sortir, ({one}) => ({
	jadwal: one(jadwal, {
		fields: [sortir.jadwalId],
		references: [jadwal.id]
	}),
	tebar: one(tebar, {
		fields: [sortir.tebarId],
		references: [tebar.id]
	}),
	kolam: one(kolam, {
		fields: [sortir.kolamId],
		references: [kolam.id]
	}),
	business: one(businesses, {
		fields: [sortir.businessId],
		references: [businesses.id]
	}),
}));

export const obatRelations = relations(obat, ({one}) => ({
	kolam: one(kolam, {
		fields: [obat.kolamId],
		references: [kolam.id]
	}),
	jadwal: one(jadwal, {
		fields: [obat.jadwalId],
		references: [jadwal.id]
	}),
	business: one(businesses, {
		fields: [obat.businessId],
		references: [businesses.id]
	}),
}));

export const usersRelations = relations(users, ({one}) => ({
	business: one(businesses, {
		fields: [users.businessId],
		references: [businesses.id]
	}),
}));

export const businessCommoditiesRelations = relations(businessCommodities, ({one}) => ({
	business: one(businesses, {
		fields: [businessCommodities.businessId],
		references: [businesses.id]
	}),
}));

export const penjualanRelations = relations(penjualan, ({one}) => ({
	jenisIkan: one(jenisIkan, {
		fields: [penjualan.jenisIkanId],
		references: [jenisIkan.id]
	}),
	kolam: one(kolam, {
		fields: [penjualan.kolamId],
		references: [kolam.id]
	}),
	business: one(businesses, {
		fields: [penjualan.businessId],
		references: [businesses.id]
	}),
}));

export const pengeluaranRelations = relations(pengeluaran, ({one}) => ({
	business: one(businesses, {
		fields: [pengeluaran.businessId],
		references: [businesses.id]
	}),
}));

export const pengaturanAkunRelations = relations(pengaturanAkun, ({one}) => ({
	business: one(businesses, {
		fields: [pengaturanAkun.businessId],
		references: [businesses.id]
	}),
}));

export const gantiAirRelations = relations(gantiAir, ({one}) => ({
	jadwal: one(jadwal, {
		fields: [gantiAir.jadwalId],
		references: [jadwal.id]
	}),
	tebar: one(tebar, {
		fields: [gantiAir.tebarId],
		references: [tebar.id]
	}),
	kolam: one(kolam, {
		fields: [gantiAir.kolamId],
		references: [kolam.id]
	}),
	business: one(businesses, {
		fields: [gantiAir.businessId],
		references: [businesses.id]
	}),
}));