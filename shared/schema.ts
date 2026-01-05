import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(), // Using text as it might store UUID or Email
  full_name: text("full_name"),
  email_id: text("email_id"),
  secure_key: text("secure_key"),
  key_expiry: timestamp("key_expiry"),
  screensaver_photos: text("screensaver_photos").array(),
  selfie_photo: text("selfie_photo"),
});

export const insertUserSchema = createInsertSchema(users);
export const insertProfileSchema = createInsertSchema(profiles);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

// WebSocket Message Types moved to ws-types.ts
