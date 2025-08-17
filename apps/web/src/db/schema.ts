import {
  pgTable, serial, varchar, timestamp, boolean, integer, index,
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
