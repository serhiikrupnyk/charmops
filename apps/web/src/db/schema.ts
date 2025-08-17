import {
  pgTable, serial, varchar, timestamp, boolean, integer, index,
  pgEnum,
} from "drizzle-orm/pg-core";
/**
 * Користувачі. Ролі: super_admin | admin | operator
 */
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    firstName: varchar("first_name", { length: 120 }).notNull(),
    lastName: varchar("last_name", { length: 120 }).notNull(),
    role: varchar("role", { length: 32 })
      .$type<"super_admin" | "admin" | "operator">()
      .notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
    roleIdx: index("users_role_idx").on(t.role),
  })
);

export const invitations = pgTable(
  "invitations",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 32 })
      .$type<"admin" | "operator">()
      .notNull(),
    // зберігаємо SHA-256 як hex (64 символи, без типів bytea — простіше)
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revoked: boolean("revoked").notNull().default(false),
    invitedByUserId: integer("invited_by_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    emailIdx: index("invitations_email_idx").on(t.email),
    tokenIdx: index("invitations_token_idx").on(t.tokenHash),
    inviterIdx: index("invitations_inviter_idx").on(t.invitedByUserId),
  })
);

// Платформи
export const platformEnum = pgEnum("platform", ["sofiadate", "sakuradate"]);

// Анкети (профілі)
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  platform: platformEnum("platform").notNull(),
  login: varchar("login", { length: 255 }).notNull(),
  passwordEnc: varchar("password_enc", { length: 2048 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  locale: varchar("locale", { length: 16 }).default("en"),
  avatarUrl: varchar("avatar_url", { length: 1024 }),
  status: varchar("status", { length: 32 })
    .$type<"active" | "paused" | "banned" | "archived">()
    .default("active"),
  assignedOperatorId: integer("assigned_operator_id")
    .references(() => users.id, { onDelete: "set null" }),
  createdByUserId: integer("created_by_user_id")
    .references(() => users.id)
    .notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  loginIdx: index("profiles_login_idx").on(t.login),
  operatorIdx: index("profiles_operator_idx").on(t.assignedOperatorId),
  platformIdx: index("profiles_platform_idx").on(t.platform),
}));

// Онлайн-пінги оператора
export const operatorActivity = pgTable("operator_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  pingAt: timestamp("ping_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userIdx: index("operator_activity_user_idx").on(t.userId),
  pingIdx: index("operator_activity_ping_idx").on(t.pingAt),
}));

//  Денні метрики оператора (MVP)
export const operatorStatsDaily = pgTable("operator_stats_daily", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  replies: integer("replies").default(0),
  avgReplySec: integer("avg_reply_sec").default(0),
  replyRatePct: integer("reply_rate_pct").default(0), // 0..100
}, (t) => ({
  userDateIdx: index("operator_stats_user_date_idx").on(t.userId, t.date),
}));

export const operatorPresence = pgTable("operator_presence", {
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .primaryKey(),
  lastPing: timestamp("last_ping", { withTimezone: true })
    .notNull()
    .defaultNow(),
});