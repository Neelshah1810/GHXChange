import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  walletAddress: text("wallet_address"),
  name: text("name"),
});

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(),
  privateKey: text("private_key").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  balance: integer("balance").default(0),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  txHash: text("tx_hash").notNull().unique(),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  amount: integer("amount").notNull(),
  txType: text("tx_type").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  signature: text("signature"),
  data: jsonb("data"),
  status: text("status").default("confirmed"),
});

export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  certificateId: text("certificate_id").notNull().unique(),
  producerAddress: text("producer_address").notNull(),
  hydrogenKg: integer("hydrogen_kg").notNull(),
  energySource: text("energy_source").notNull(),
  location: text("location").notNull(),
  productionDate: timestamp("production_date").notNull(),
  issueDate: timestamp("issue_date").defaultNow(),
  certifierName: text("certifier_name").notNull(),
  signature: text("signature").notNull(),
  status: text("status").default("valid"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  address: true,
  privateKey: true,
  name: true,
  type: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  txHash: true,
  fromAddress: true,
  toAddress: true,
  amount: true,
  txType: true,
  signature: true,
  data: true,
});

export const insertCertificateSchema = createInsertSchema(certificates).pick({
  certificateId: true,
  producerAddress: true,
  hydrogenKg: true,
  energySource: true,
  location: true,
  productionDate: true,
  certifierName: true,
  signature: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required").trim(),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["producer", "buyer", "auditor"], {
    errorMap: () => ({ message: "Please select a valid role (producer, buyer, or auditor)" })
  }),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["producer", "buyer", "auditor"], {
    errorMap: () => ({ message: "Please select a valid role (producer, buyer, or auditor)" })
  }),
  name: z.string().min(1, "Full name is required").trim(),
  email: z.string().email("Invalid email address").trim().optional(),
  location: z.string().min(1, "Location is required").trim(),
});

export const issueCreditsSchema = z.object({
  hydrogenKg: z.number().min(1, "Hydrogen amount must be at least 1 kg"),
  energySource: z.string().min(1, "Energy source is required"),
  location: z.string().min(1, "Location is required"),
});

export const transferCreditsSchema = z.object({
  toAddress: z.string().min(1, "Recipient address is required"),
  amount: z.number().min(1, "Amount must be at least 1 GHC"),
});

export const purchaseCreditsSchema = z.object({
  producerAddress: z.string().min(1, "Producer address is required"),
  amount: z.number().min(1, "Amount must be at least 1 GHC"),
});

// Role switch schema
export const roleSwitchSchema = z.object({
  walletAddress: z.string(),
  newRole: z.enum(['buyer', 'producer'])
});

// Type exports
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type IssueCreditsData = z.infer<typeof issueCreditsSchema>;
export type PurchaseCreditsData = z.infer<typeof purchaseCreditsSchema>;
export type RoleSwitchData = z.infer<typeof roleSwitchSchema>;
export type PurchaseCreditsData = z.infer<typeof purchaseCreditsSchema>;
