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

export const call_logs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  start_time: timestamp("start_time").defaultNow(),
  end_time: timestamp("end_time"),
  duration_seconds: text("duration_seconds"), // Storing as text for simplicity in formatting or BigInt
  status: text("status").default("completed"),
});

export const insertUserSchema = createInsertSchema(users);
export const insertProfileSchema = createInsertSchema(profiles);
export const insertCallLogSchema = createInsertSchema(call_logs);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type CallLog = typeof call_logs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;

// WebSocket Message Types moved to ws-types.ts
