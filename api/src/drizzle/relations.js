import { relations } from "drizzle-orm/relations";
import { kolam, tebar, jenisIkan, jadwal, sortir, panen, pakan, penjualan } from "./schema.js";

export const tebarRelations = relations(tebar, ({one, many}) => ({
	kolam: one(kolam, {
		fields: [tebar.kolamId],
		references: [kolam.id]
	}),
	jenisIkan: one(jenisIkan, {
		fields: [tebar.jenisIkanId],
		references: [jenisIkan.id]
	}),
	jadwals: many(jadwal),
	sortirs: many(sortir),
	panens: many(panen),
}));

export const kolamRelations = relations(kolam, ({many}) => ({
	tebars: many(tebar),
	jadwals: many(jadwal),
	sortirs: many(sortir),
	panens: many(panen),
	pakans: many(pakan),
	penjualans: many(penjualan),
}));

export const jenisIkanRelations = relations(jenisIkan, ({many}) => ({
	tebars: many(tebar),
	penjualans: many(penjualan),
}));

export const jadwalRelations = relations(jadwal, ({one, many}) => ({
	tebar: one(tebar, {
		fields: [jadwal.tebarId],
		references: [tebar.id]
	}),
	kolam: one(kolam, {
		fields: [jadwal.kolamId],
		references: [kolam.id]
	}),
	sortirs: many(sortir),
	panens: many(panen),
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
}));

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
}));

export const pakanRelations = relations(pakan, ({one}) => ({
	kolam: one(kolam, {
		fields: [pakan.kolamId],
		references: [kolam.id]
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
}));