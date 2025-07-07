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
import { DatabaseStorage } from "./db-storage";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail?(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: number, active: boolean): Promise<User>;
  updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User>;
  
  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByFarmerId(farmerId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: InsertProduct): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Order operations
  getAllOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByBuyerId(buyerId: number): Promise<Order[]>;
  getOrdersByFarmerId(farmerId: number): Promise<Order[]>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  isFarmerOrderParticipant(farmerId: number, orderId: number): Promise<boolean>;
  
  // Market Price operations
  getAllMarketPrices(): Promise<MarketPrice[]>;
  getMarketPriceById(id: number): Promise<MarketPrice | undefined>;
  createMarketPrice(marketPrice: InsertMarketPrice): Promise<MarketPrice>;
  updateMarketPrice(id: number, marketPrice: InsertMarketPrice): Promise<MarketPrice>;
  
  // Session store
  sessionStore: session.SessionStore;
}

// Create storage instance - use database storage if DATABASE_URL is available
export const storage: IStorage = process.env.DATABASE_URL 
  ? new DatabaseStorage()
  : (() => {
      console.warn("DATABASE_URL not found. Please set up PostgreSQL database.");
      throw new Error("Database connection required. Please set DATABASE_URL environment variable.");
    })();
