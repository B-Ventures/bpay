import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, boolean, integer, primaryKey, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

// Payment methods table
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'card', 'bank_account', 'paypal', 'stripe_balance', etc.
  brand: text("brand"), // for cards: 'visa', 'mastercard', etc.
  lastFour: text("last_four"), // last 4 digits for cards or bank accounts
  expiryMonth: integer("expiry_month"), // for cards
  expiryYear: integer("expiry_year"), // for cards
  name: text("name"), // display name for the payment method
  isDefault: boolean("is_default").default(false),
  stripePaymentMethodId: text("stripe_payment_method_id"), // ID in Stripe
  stripeAccountId: text("stripe_account_id"), // ID for Stripe connect accounts
  bankName: text("bank_name"), // for bank accounts
  accountType: text("account_type"), // 'checking', 'savings', etc. for bank accounts
  provider: text("provider"), // 'paypal', 'stripe', etc. for digital wallets
  email: text("email"), // email for PayPal or other services
  metadata: jsonb("metadata"), // flexible field for storing additional method-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Virtual cards table
export const virtualCards = pgTable("virtual_cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  cardholderName: text("cardholder_name").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'expired', 'frozen', etc.
  cardNumber: text("card_number").notNull(),
  expiryMonth: integer("expiry_month").notNull(),
  expiryYear: integer("expiry_year").notNull(),
  cvv: text("cvv").notNull(),
  balance: integer("balance").default(0), // in cents, optional
  currency: text("currency").notNull().default("usd"),
  isSaved: boolean("is_saved").notNull().default(false), // Whether the card is saved for future use
  isOneTime: boolean("is_one_time").notNull().default(false), // Whether the card is one-time use only
  stripeCardId: text("stripe_card_id"), // ID of the card in Stripe Issuing
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Virtual card funding sources
export const virtualCardFunding = pgTable("virtual_card_funding", {
  id: serial("id").primaryKey(),
  virtualCardId: integer("virtual_card_id").references(() => virtualCards.id).notNull(),
  paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id).notNull(),
  amount: integer("amount").notNull(), // in cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  virtualCardId: integer("virtual_card_id").references(() => virtualCards.id).notNull(),
  merchant: text("merchant"),
  amount: integer("amount").notNull(), // in cents
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'failed', etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System settings table - for storing application configuration
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  valueJson: jsonb("value_json"),
  description: text("description"),
  category: text("category").notNull().default("general"),
  isSecret: boolean("is_secret").notNull().default(false), // Whether this is a sensitive setting (API key, etc.)
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  paymentMethods: many(paymentMethods),
  virtualCards: many(virtualCards),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one, many }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id],
  }),
  fundingSources: many(virtualCardFunding),
}));

export const virtualCardsRelations = relations(virtualCards, ({ one, many }) => ({
  user: one(users, {
    fields: [virtualCards.userId],
    references: [users.id],
  }),
  fundingSources: many(virtualCardFunding),
  transactions: many(transactions),
}));

export const virtualCardFundingRelations = relations(virtualCardFunding, ({ one }) => ({
  virtualCard: one(virtualCards, {
    fields: [virtualCardFunding.virtualCardId],
    references: [virtualCards.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [virtualCardFunding.paymentMethodId],
    references: [paymentMethods.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  virtualCard: one(virtualCards, {
    fields: [transactions.virtualCardId],
    references: [virtualCards.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const selectUserSchema = createSelectSchema(users);

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({ 
  id: true, 
  createdAt: true 
});
export const selectPaymentMethodSchema = createSelectSchema(paymentMethods);

export const insertVirtualCardSchema = createInsertSchema(virtualCards).omit({ 
  id: true, 
  createdAt: true 
});
export const selectVirtualCardSchema = createSelectSchema(virtualCards);

export const insertVirtualCardFundingSchema = createInsertSchema(virtualCardFunding).omit({ 
  id: true, 
  createdAt: true 
});
export const selectVirtualCardFundingSchema = createSelectSchema(virtualCardFunding);

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true, 
  createdAt: true 
});
export const selectTransactionSchema = createSelectSchema(transactions);

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export const selectSystemSettingSchema = createSelectSchema(systemSettings);

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

export type VirtualCard = typeof virtualCards.$inferSelect;
export type InsertVirtualCard = z.infer<typeof insertVirtualCardSchema>;

export type VirtualCardFunding = typeof virtualCardFunding.$inferSelect;
export type InsertVirtualCardFunding = z.infer<typeof insertVirtualCardFundingSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

// Content Management tables
export const pageContent = pgTable("page_content", {
  id: serial("id").primaryKey(),
  pageId: text("page_id").notNull().unique(), // homepage, about, contact, etc.
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  status: text("status").notNull().default("published"), // draft, published, archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sectionContent = pgTable("section_content", {
  id: serial("id"),
  pageId: text("page_id").references(() => pageContent.pageId).notNull(),
  sectionId: text("section_id").notNull(), // hero, features, cta, etc.
  name: text("name").notNull(),
  content: jsonb("content").notNull(), // JSON data for the section content
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
},
(table) => {
  return {
    pageSectionUnique: primaryKey({ columns: [table.pageId, table.sectionId] }),
  };
});

export const mediaLibrary = pgTable("media_library", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  url: text("url").notNull(),
  size: integer("size").notNull(), // file size in bytes
  width: integer("width"), // for images
  height: integer("height"), // for images
  altText: text("alt_text"),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const themeSettings = pgTable("theme_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  primaryColor: text("primary_color").notNull().default("#3b82f6"), // blue-500
  backgroundColor: text("background_color").notNull().default("#f9fafb"), // gray-50
  textColor: text("text_color").notNull().default("#111827"), // gray-900
  accentColor: text("accent_color").notNull().default("#2563eb"), // blue-600
  secondaryColor: text("secondary_color").notNull().default("#4b5563"), // gray-600
  fontPrimary: text("font_primary").notNull().default("Inter, sans-serif"),
  fontSecondary: text("font_secondary").notNull().default("Inter, sans-serif"),
  borderRadius: text("border_radius").notNull().default("0.5rem"),
  buttonStyle: text("button_style").notNull().default("rounded"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const pageContentRelations = relations(pageContent, ({ many }) => ({
  sections: many(sectionContent),
}));

export const sectionContentRelations = relations(sectionContent, ({ one }) => ({
  page: one(pageContent, {
    fields: [sectionContent.pageId],
    references: [pageContent.pageId],
  }),
}));

// Schemas
export const insertPageContentSchema = createInsertSchema(pageContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectPageContentSchema = createSelectSchema(pageContent);

export const insertSectionContentSchema = createInsertSchema(sectionContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectSectionContentSchema = createSelectSchema(sectionContent);

export const insertMediaLibrarySchema = createInsertSchema(mediaLibrary).omit({
  id: true,
  createdAt: true,
});
export const selectMediaLibrarySchema = createSelectSchema(mediaLibrary);

export const insertThemeSettingsSchema = createInsertSchema(themeSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectThemeSettingsSchema = createSelectSchema(themeSettings);

// TypeScript types for Content Management
export type PageContent = typeof pageContent.$inferSelect;
export type InsertPageContent = z.infer<typeof insertPageContentSchema>;

export type SectionContent = typeof sectionContent.$inferSelect;
export type InsertSectionContent = z.infer<typeof insertSectionContentSchema>;

export type MediaLibrary = typeof mediaLibrary.$inferSelect;
export type InsertMediaLibrary = z.infer<typeof insertMediaLibrarySchema>;

export type ThemeSettings = typeof themeSettings.$inferSelect;
export type InsertThemeSettings = z.infer<typeof insertThemeSettingsSchema>;