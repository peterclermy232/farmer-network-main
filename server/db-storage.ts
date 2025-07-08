import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, inArray } from "drizzle-orm";
import {
  users,
  type User,
  type InsertUser,
  type UpdateUserProfile,
  products,
  type Product,
  type InsertProduct,
  orders,
  type Order,
  type InsertOrder,
  orderItems,
  type OrderItem,
  type InsertOrderItem,
  marketPrices,
  type MarketPrice,
  type InsertMarketPrice,
} from "@shared/schema";
import session, { Store as SessionStore } from "express-session";
import createMemoryStore from "memorystore";
import { IStorage } from "./storage";

const MemoryStore = createMemoryStore(session);

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private sqlite: InstanceType<typeof Database>;
  sessionStore: SessionStore;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    const dbPath = databaseUrl.replace("sqlite://", "") || "./farmers_market.db";
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.sqlite = new Database(dbPath);
    this.db = drizzle(this.sqlite);

    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });

    this.initializeTables();
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

//   async updateUserStatus(id: number, active: boolean): Promise<User> {
//   const result = await this.db
//     .update(users)
//     .set({ isActive: active })
//     .where(eq(users.id, id))
//     .returning();

//   if (result.length === 0) throw new Error("User not found");

//   return result[0];
// }


  async updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User> {
    const result = await this.db.update(users).set(profile).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getAllProducts(): Promise<Product[]> {
    return await this.db.select().from(products);
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const result = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductsByFarmerId(farmerId: number): Promise<Product[]> {
    return await this.db.select().from(products).where(eq(products.farmerId, farmerId));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await this.db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: number, product: InsertProduct): Promise<Product> {
    const result = await this.db.update(products).set(product).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }

  async getAllOrders(): Promise<Order[]> {
    return await this.db.select().from(orders);
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const result = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getOrdersByBuyerId(buyerId: number): Promise<Order[]> {
    return await this.db.select().from(orders).where(eq(orders.buyerId, buyerId));
  }

  async getOrdersByFarmerId(farmerId: number): Promise<Order[]> {
    const productIds = (await this.db.select({ id: products.id }).from(products).where(eq(products.farmerId, farmerId))).map(p => p.id);
    const orderIds = (await this.db.select({ orderId: orderItems.orderId }).from(orderItems).where(inArray(orderItems.productId, productIds))).map(o => o.orderId);
    return await this.db.select().from(orders).where(inArray(orders.id, orderIds));
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [created] = await this.db.insert(orders).values(order).returning();
    const itemValues = items.map(i => ({ ...i, orderId: created.id }));
    await this.db.insert(orderItems).values(itemValues);
    return created;
  }

  async updateOrderStatus(
  id: number,
  status: "pending" | "shipped" | "delivered" | "cancelled"
): Promise<Order> {
  const result = await this.db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, id))
    .returning();

  if (result.length === 0) {
    throw new Error("Order not found");
  }

  return result[0];
}


  async isFarmerOrderParticipant(farmerId: number, orderId: number): Promise<boolean> {
    const productIds = (await this.db.select({ id: products.id }).from(products).where(eq(products.farmerId, farmerId))).map(p => p.id);
    const count = await this.db.select().from(orderItems).where(and(eq(orderItems.orderId, orderId), inArray(orderItems.productId, productIds)));
    return count.length > 0;
  }

  async getAllMarketPrices(): Promise<MarketPrice[]> {
    return await this.db.select().from(marketPrices);
  }

  async getMarketPriceById(id: number): Promise<MarketPrice | undefined> {
    const result = await this.db.select().from(marketPrices).where(eq(marketPrices.id, id)).limit(1);
    return result[0];
  }

  async createMarketPrice(marketPrice: InsertMarketPrice): Promise<MarketPrice> {
    const result = await this.db.insert(marketPrices).values(marketPrice).returning();
    return result[0];
  }

  async updateMarketPrice(id: number, marketPrice: InsertMarketPrice): Promise<MarketPrice> {
    const result = await this.db.update(marketPrices).set(marketPrice).where(eq(marketPrices.id, id)).returning();
    return result[0];
  }

  private initializeTables() {
    this.sqlite.exec("PRAGMA foreign_keys = ON;");

    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('farmer', 'buyer', 'admin')),
        name TEXT,
        address TEXT,
        phone TEXT,
        bio TEXT,
        profile_picture TEXT,
        active INTEGER DEFAULT 1, -- ✅ Add this line
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        unit TEXT NOT NULL,
        quantity REAL NOT NULL,
        image_url TEXT,
        image TEXT,
        organic INTEGER DEFAULT 0,
        sku TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyer_id INTEGER NOT NULL,
        order_number TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
        total REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS market_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        previous_price REAL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async close(): Promise<void> {
    this.sqlite.close();
  }
}
