/**
 * Database schema for Better Auth with Drizzle ORM.
 *
 * Tables: user, session, account, verification
 * Compatible with Neon PostgreSQL.
 */

import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`NOW()`),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`NOW()`),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`NOW()`),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`NOW()`),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "date" }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: "date" }),
  password: text("password"),
  scope: text("scope"),
  idToken: text("id_token"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`NOW()`),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`NOW()`),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`NOW()`),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`NOW()`),
});

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`NOW()`),
});
