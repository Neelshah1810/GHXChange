import { relations } from "drizzle-orm/relations";
import { certificates, certifiers, producers, transactions, users, wallets } from "./schema";

export const producersRelations = relations(producers, ({ many }) => ({
  certificates: many(certificates),
}));

export const certifiersRelations = relations(certifiers, ({ many }) => ({
  certificates: many(certificates),
}));

export const certificatesRelations = relations(certificates, ({ one, many }) => ({
  producer: one(producers, {
    fields: [certificates.producerId],
    references: [producers.id],
  }),
  certifier: one(certifiers, {
    fields: [certificates.certifierId],
    references: [certifiers.id],
  }),
  transactions: many(transactions),
}));

export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(wallets),
  roles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
}));

export const walletsRelations
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  outgoingTransactions: many(transactions, { relationName: 'fromWallet' }),
  incomingTransactions: many(transactions, { relationName: 'toWallet' }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  fromWallet: one(wallets, {
    fields: [transactions.fromWalletId],
    references: [wallets.id],
  }),
  toWallet: one(wallets, {
    fields: [transactions.toWalletId],
    references: [wallets.id],
  }),
  certificate: one(certificates, {
    fields: [transactions.certificateId],
    references: [certificates.id],
  }),
}));
