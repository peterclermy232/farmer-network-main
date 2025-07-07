import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["farmer", "buyer", "admin"] }).notNull().default("buyer"),
  name: text("name"),
  address: text("address"),
  phone: text("phone"),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  name: true,
}).extend({
  // Add password strength validation
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Add email format validation
  email: z.string().email("Invalid email format"),
});

// For profile updates - exclude password and role
export const updateUserProfileSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
}).extend({
  address: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  profilePicture: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type User = typeof users.$inferSelect;

// Products/Produce table
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  farmerId: integer("farmer_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  price: real("price").notNull(),
  unit: text("unit").notNull(),
  quantity: real("quantity").notNull(),
  imageUrl: text("image_url"),
  image: text("image"), // For compatibility with UI components
  organic: integer("organic", { mode: "boolean" }).default(false),
  sku: text("sku"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Orders table
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  buyerId: integer("buyer_id").notNull(),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status", { enum: ["pending", "shipped", "delivered", "cancelled"] }).notNull().default("pending"),
  total: real("total").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order Items table
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: real("quantity").notNull(),
  price: real("price").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Market Prices table
export const marketPrices = sqliteTable("market_prices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productName: text("product_name").notNull(),
  category: text("category").notNull(),
  price: real("price").notNull(),
  previousPrice: real("previous_price"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const insertMarketPriceSchema = createInsertSchema(marketPrices).omit({
  id: true,
  updatedAt: true,
});

export type InsertMarketPrice = z.infer<typeof insertMarketPriceSchema>;
export type MarketPrice = typeof marketPrices.$inferSelect;
