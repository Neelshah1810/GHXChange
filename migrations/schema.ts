import { pgTable, unique, varchar, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const producers = pgTable("producers", {
	id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	address: text().notNull(),
	name: text().notNull(),
	location: text().notNull(),
	energySourceTypes: jsonb("energy_source_types").notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("producers_address_unique").on(table.address),
]);

export const certifiers = pgTable("certifiers", {
	id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: text().notNull(),
	licenseNumber: text("license_number").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("certifiers_license_number_unique").on(table.licenseNumber),
]);

export const certificates = pgTable("certificates", {
	id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	certificateId: text("certificate_id").notNull(),
	producerId: varchar("producer_id").notNull().references(() => producers.id),
	certifierId: varchar("certifier_id").notNull().references(() => certifiers.id),
	hydrogenKg: integer("hydrogen_kg").notNull(),
	energySource: text("energy_source").notNull(),
	productionDate: timestamp("production_date", { mode: 'string' }).notNull(),
	issueDate: timestamp("issue_date", { mode: 'string' }).defaultNow(),
	signature: text().notNull(),
	status: text().default('valid'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("certificates_certificate_id_unique").on(table.certificateId),
]);

export const transactions = pgTable("transactions", {
	id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	txHash: text("tx_hash").notNull(),
	fromWalletId: varchar("from_wallet_id").notNull().references(() => wallets.id),
	toWalletId: varchar("to_wallet_id").notNull().references(() => wallets.id),
	amount: integer().notNull(),
	txType: text("tx_type").notNull(),
	certificateId: varchar("certificate_id").references(() => certificates.id),
	signature: text().notNull(),
	data: jsonb(),
	status: text().default('confirmed'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("transactions_tx_hash_unique").on(table.txHash),
]);

export const userRoles = pgTable("user_roles", {
	id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id").notNull().references(() => users.id),
	role: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	primaryRole: text("primary_role").notNull(),
	name: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	isVerified: boolean("is_verified").default(false).notNull(),
	minBalanceForProducer: integer("min_balance_for_producer").default(1000).notNull(), // Minimum GHC balance required to become producer
}, (table) => [
	unique("users_username_unique").on(table.username),
]);

export const wallets = pgTable("wallets", {
	id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	address: text().notNull(),
	privateKey: text("private_key").notNull(),
	name: text().notNull(),
	type: text().notNull(),
	userId: varchar("user_id").notNull().references(() => users.id),
	balance: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("wallets_address_unique").on(table.address),
]);
