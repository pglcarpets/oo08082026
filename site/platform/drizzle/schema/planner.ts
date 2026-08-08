import { date, pgTable, text, timestamp, jsonb, uuid, index, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("profiles_email_idx").on(table.email),
  index("profiles_role_idx").on(table.role),
  index("profiles_created_at_idx").on(table.createdAt),
]);

export const plans = pgTable("oando_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  engine: text("engine").notNull(),
  payload: jsonb("payload").notNull().default({}),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("plans_user_id_idx").on(table.userId),
  index("plans_status_idx").on(table.status),
  index("plans_created_at_idx").on(table.createdAt),
  index("plans_updated_at_idx").on(table.updatedAt),
  index("plans_user_id_status_idx").on(table.userId, table.status),
  index("plans_user_id_created_at_idx").on(table.userId, table.createdAt),
  index("plans_user_id_updated_at_idx").on(table.userId, table.updatedAt),
]);

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("teams_created_at_idx").on(table.createdAt),
]);

export const teamMembers = pgTable("team_members", {
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.teamId, table.userId] }),
  index("team_members_team_id_idx").on(table.teamId),
  index("team_members_user_id_idx").on(table.userId),
]);

export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  invitedBy: uuid("invited_by").notNull().references(() => profiles.id),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("invites_team_id_idx").on(table.teamId),
  index("invites_invited_by_idx").on(table.invitedBy),
  index("invites_email_idx").on(table.email),
  index("invites_created_at_idx").on(table.createdAt),
]);

/** Admin P05 — versioned price books (Buyer P04 consumes emitted JSON contract). */
export const priceBooks = pgTable("price_books", {
  id: uuid("id").primaryKey().defaultRandom(),
  familySlug: text("family_slug").notNull(),
  bookId: text("book_id").notNull(),
  activeVersionId: text("active_version_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("price_books_book_id_uidx").on(table.bookId),
  index("price_books_family_slug_idx").on(table.familySlug),
]);

export const priceBookVersions = pgTable("price_book_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookRowId: uuid("book_row_id").notNull().references(() => priceBooks.id, { onDelete: "cascade" }),
  versionId: text("version_id").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("draft"),
  rules: jsonb("rules").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("price_book_versions_book_version_uidx").on(table.bookRowId, table.versionId),
  index("price_book_versions_status_idx").on(table.status),
]);

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull(),
  actorId: uuid("actor_id").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: uuid("target_id"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("audit_events_team_id_idx").on(table.teamId),
  index("audit_events_actor_id_idx").on(table.actorId),
  index("audit_events_action_idx").on(table.action),
  index("audit_events_created_at_idx").on(table.createdAt),
  index("audit_events_team_id_created_at_idx").on(table.teamId, table.createdAt),
]);

export const reviewLinks = pgTable("review_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  permission: text("permission").notNull().default("view"),
  expiresAt: timestamp("expires_at"),
  isRevoked: text("is_revoked").notNull().default("false"),
  createdBy: uuid("created_by").notNull().references(() => profiles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("review_links_token_uidx").on(table.token),
  index("review_links_plan_id_idx").on(table.planId),
  index("review_links_created_by_idx").on(table.createdBy),
]);

export const reviewComments = pgTable("review_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  linkId: uuid("link_id").references(() => reviewLinks.id, { onDelete: "set null" }),
  objectId: text("object_id"),
  objectType: text("object_type"),
  authorName: text("author_name").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("review_comments_plan_id_idx").on(table.planId),
  index("review_comments_link_id_idx").on(table.linkId),
  index("review_comments_created_at_idx").on(table.createdAt),
]);
