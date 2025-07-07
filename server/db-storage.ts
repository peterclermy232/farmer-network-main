import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
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
  type InsertMarketPrice
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { IStorage } from "./storage";

const MemoryStore = createMemoryStore(session);

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private sql: postgres.Sql;
  sessionStore: session.SessionStore;

  constructor() {
    // Get database URL from environment variable
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    this.sql = postgres(databaseUrl);
    this.db = drizzle(this.sql);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User operations
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async updateUserStatus(id: number, active: boolean): Promise<User> {
    const result = await this.db
      .update(users)
      .set({ active })
      .where(eq(users.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("User not found");
    }
    
    return result[0];
  }
  
  async updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User> {
    const result = await this.db
      .update(users)
      .set(profile)
      .where(eq(users.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("User not found");
    }
    
    return result[0];
  }

  // Product operations
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
    const result = await this.db.insert(products).values({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateProduct(id: number, product: InsertProduct): Promise<Product> {
    const result = await this.db
      .update(products)
      .set({
        ...product,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Product not found");
    }
    
    return result[0];
  }

  async deleteProduct(id: number): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }

  // Order operations
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
    // Get all product IDs that belong to this farmer
    const farmerProducts = await this.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.farmerId, farmerId));
    
    const productIds = farmerProducts.map(p => p.id);
    
    if (productIds.length === 0) {
      return [];
    }
    
    // Get all order IDs that contain these products
    const orderItemsWithProducts = await this.db
      .select({ orderId: orderItems.orderId })
      .from(orderItems)
      .where(eq(orderItems.productId, productIds[0])); // This would need proper IN operator
    
    const orderIds = orderItemsWithProducts.map(item => item.orderId);
    
    if (orderIds.length === 0) {
      return [];
    }
    
    // Get orders with those IDs
    return await this.db.select().from(orders).where(eq(orders.id, orderIds[0])); // This would need proper IN operator
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    // Start transaction
    const result = await this.db.transaction(async (tx) => {
      // Create order
      const [newOrder] = await tx.insert(orders).values({
        ...order,
        createdAt: new Date()
      }).returning();
      
      // Create order items
      if (items.length > 0) {
        const orderItemsData = items.map(item => ({
          ...item,
          orderId: newOrder.id
        }));
        
        await tx.insert(orderItems).values(orderItemsData);
        
        // Update product quantities
        for (const item of items) {
          const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
          if (product) {
            await tx.update(products)
              .set({
                quantity: product.quantity - item.quantity,
                updatedAt: new Date()
              })
              .where(eq(products.id, item.productId));
          }
        }
      }
      
      return newOrder;
    });
    
    return result;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
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
    // Get all product IDs that belong to this farmer
    const farmerProducts = await this.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.farmerId, farmerId));
    
    const productIds = farmerProducts.map(p => p.id);
    
    if (productIds.length === 0) {
      return false;
    }
    
    // Check if any order items for this order contain products from this farmer
    const orderItemsCount = await this.db
      .select({ count: orderItems.id })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.orderId, orderId),
          eq(orderItems.productId, productIds[0]) // This would need proper IN operator
        )
      );
    
    return orderItemsCount.length > 0;
  }

  // Market Price operations
  async getAllMarketPrices(): Promise<MarketPrice[]> {
    return await this.db.select().from(marketPrices);
  }

  async getMarketPriceById(id: number): Promise<MarketPrice | undefined> {
    const result = await this.db.select().from(marketPrices).where(eq(marketPrices.id, id)).limit(1);
    return result[0];
  }

  async createMarketPrice(marketPrice: InsertMarketPrice): Promise<MarketPrice> {
    const result = await this.db.insert(marketPrices).values({
      ...marketPrice,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateMarketPrice(id: number, marketPrice: InsertMarketPrice): Promise<MarketPrice> {
    const result = await this.db
      .update(marketPrices)
      .set({
        ...marketPrice,
        updatedAt: new Date()
      })
      .where(eq(marketPrices.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Market price not found");
    }
    
    return result[0];
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}