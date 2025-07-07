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

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private marketPrices: Map<number, MarketPrice>;
  private userId: number;
  private productId: number;
  private orderId: number;
  private orderItemId: number;
  private marketPriceId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.marketPrices = new Map();
    this.userId = 1;
    this.productId = 1;
    this.orderId = 1;
    this.orderItemId = 1;
    this.marketPriceId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize with admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$X7NXj5Toz9pzAJA5/.Nwl.WOhwPRTU.9o9Z1U.YyXVbCaHUINnKT2", // "admin123"
      role: "admin",
      name: "Admin User",
      email: "admin@farmersmarket.com"
    });
    
    // Initialize with some market prices
    this.initializeMarketPrices();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserStatus(id: number, active: boolean): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, active };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...profile };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByFarmerId(farmerId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.farmerId === farmerId,
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const newProduct: Product = {
      ...product,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, product: InsertProduct): Promise<Product> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) {
      throw new Error("Product not found");
    }
    
    const updatedProduct: Product = {
      ...existingProduct,
      ...product,
      id,
      updatedAt: new Date()
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
  }

  // Order operations
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByBuyerId(buyerId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.buyerId === buyerId,
    );
  }

  async getOrdersByFarmerId(farmerId: number): Promise<Order[]> {
    // Get all product IDs that belong to this farmer
    const farmerProductIds = Array.from(this.products.values())
      .filter(product => product.farmerId === farmerId)
      .map(product => product.id);
    
    // Find all order item IDs that contain these products
    const orderIdsWithFarmerProducts = new Set<number>();
    
    Array.from(this.orderItems.values()).forEach(item => {
      if (farmerProductIds.includes(item.productId)) {
        orderIdsWithFarmerProducts.add(item.orderId);
      }
    });
    
    // Get orders with those IDs
    return Array.from(this.orders.values()).filter(
      order => orderIdsWithFarmerProducts.has(order.id)
    );
  }

  async createOrder(order: InsertOrder, items: any[]): Promise<Order> {
    const id = this.orderId++;
    const newOrder: Order = {
      ...order,
      id,
      createdAt: new Date()
    };
    this.orders.set(id, newOrder);
    
    // Create order items
    items.forEach(item => {
      const itemId = this.orderItemId++;
      const orderItem: OrderItem = {
        id: itemId,
        orderId: id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      };
      this.orderItems.set(itemId, orderItem);
      
      // Update product quantity
      const product = this.products.get(item.productId);
      if (product) {
        const updatedProduct = {
          ...product,
          quantity: product.quantity - item.quantity,
          updatedAt: new Date()
        };
        this.products.set(item.productId, updatedProduct);
      }
    });
    
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error("Order not found");
    }
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async isFarmerOrderParticipant(farmerId: number, orderId: number): Promise<boolean> {
    // Get all product IDs that belong to this farmer
    const farmerProductIds = Array.from(this.products.values())
      .filter(product => product.farmerId === farmerId)
      .map(product => product.id);
    
    // Check if any order items for this order contain products from this farmer
    return Array.from(this.orderItems.values()).some(item => 
      item.orderId === orderId && farmerProductIds.includes(item.productId)
    );
  }

  // Market Price operations
  async getAllMarketPrices(): Promise<MarketPrice[]> {
    return Array.from(this.marketPrices.values());
  }

  async getMarketPriceById(id: number): Promise<MarketPrice | undefined> {
    return this.marketPrices.get(id);
  }

  async createMarketPrice(marketPrice: InsertMarketPrice): Promise<MarketPrice> {
    const id = this.marketPriceId++;
    const newMarketPrice: MarketPrice = {
      ...marketPrice,
      id,
      updatedAt: new Date()
    };
    this.marketPrices.set(id, newMarketPrice);
    return newMarketPrice;
  }

  async updateMarketPrice(id: number, marketPrice: InsertMarketPrice): Promise<MarketPrice> {
    const existingPrice = this.marketPrices.get(id);
    if (!existingPrice) {
      throw new Error("Market price not found");
    }
    
    const updatedPrice: MarketPrice = {
      ...existingPrice,
      ...marketPrice,
      id,
      updatedAt: new Date()
    };
    this.marketPrices.set(id, updatedPrice);
    return updatedPrice;
  }

  // Initialize some market prices data
  private initializeMarketPrices() {
    const initialMarketPrices: Omit<MarketPrice, 'id'>[] = [
      {
        productName: "Tomatoes",
        category: "Vegetables",
        price: 2.50,
        previousPrice: 2.30,
        updatedAt: new Date()
      },
      {
        productName: "Potatoes",
        category: "Vegetables",
        price: 1.75,
        previousPrice: 1.68,
        updatedAt: new Date()
      },
      {
        productName: "Onions",
        category: "Vegetables",
        price: 1.20,
        previousPrice: 1.24,
        updatedAt: new Date()
      },
      {
        productName: "Lettuce",
        category: "Vegetables",
        price: 3.00,
        previousPrice: 3.00,
        updatedAt: new Date()
      },
      {
        productName: "Carrots",
        category: "Vegetables",
        price: 1.80,
        previousPrice: 1.70,
        updatedAt: new Date()
      }
    ];

    initialMarketPrices.forEach(price => {
      this.createMarketPrice(price);
    });
  }
}

export const storage = new MemStorage();
