import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  discriminator: text("discriminator").notNull(),
  avatar: text("avatar"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bots = pgTable("bots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  botId: text("bot_id").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  token: text("token").notNull(),
  isOnline: boolean("is_online").default(false).notNull(),
  serverCount: integer("server_count").default(0).notNull(),
  commandCount: integer("command_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeen: timestamp("last_seen"),
});

export const commands = pgTable("commands", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").references(() => bots.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  usage: integer("usage").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").references(() => bots.id).notNull(),
  type: text("type").notNull(), // 'deployment', 'error', 'offline', 'join_server', etc.
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const collaborators = pgTable("collaborators", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").references(() => bots.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull(), // 'owner', 'admin', 'editor', 'viewer'
  invitedBy: integer("invited_by").references(() => users.id).notNull(),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
  status: text("status").default("pending").notNull(), // 'pending', 'accepted', 'declined'
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBotSchema = createInsertSchema(bots).omit({
  id: true,
  createdAt: true,
  lastSeen: true,
});

export const insertCommandSchema = createInsertSchema(commands).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertCollaboratorSchema = createInsertSchema(collaborators).omit({
  id: true,
  invitedAt: true,
  acceptedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBot = z.infer<typeof insertBotSchema>;
export type Bot = typeof bots.$inferSelect;

export type InsertCommand = z.infer<typeof insertCommandSchema>;
export type Command = typeof commands.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertCollaborator = z.infer<typeof insertCollaboratorSchema>;
export type Collaborator = typeof collaborators.$inferSelect;

export type BotWithCommands = Bot & {
  commands: Command[];
};

export type ActivityWithBot = Activity & {
  bot: Bot;
};

export type BotWithCollaborators = Bot & {
  collaborators: (Collaborator & { user: User })[];
  userRole?: string;
};

export type CollaboratorWithUser = Collaborator & {
  user: User;
  invitedByUser: User;
};

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bots: many(bots),
  collaborations: many(collaborators),
  invitedCollaborators: many(collaborators, {
    relationName: "invitedBy",
  }),
}));

export const botsRelations = relations(bots, ({ one, many }) => ({
  user: one(users, {
    fields: [bots.userId],
    references: [users.id],
  }),
  commands: many(commands),
  activities: many(activities),
  collaborators: many(collaborators),
}));

export const commandsRelations = relations(commands, ({ one }) => ({
  bot: one(bots, {
    fields: [commands.botId],
    references: [bots.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  bot: one(bots, {
    fields: [activities.botId],
    references: [bots.id],
  }),
}));

export const collaboratorsRelations = relations(collaborators, ({ one }) => ({
  bot: one(bots, {
    fields: [collaborators.botId],
    references: [bots.id],
  }),
  user: one(users, {
    fields: [collaborators.userId],
    references: [users.id],
  }),
  invitedByUser: one(users, {
    fields: [collaborators.invitedBy],
    references: [users.id],
    relationName: "invitedBy",
  }),
}));
