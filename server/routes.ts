import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import Stripe from "stripe";
import { WebSocketServer } from "ws";
import { notificationService, Notification } from "./notifications";

// Check if Stripe API key is available
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
// @ts-ignore - Ignoring apiVersion mismatch - this is the currently supported version
const stripe = stripeApiKey ? new Stripe(stripeApiKey, { apiVersion: "2023-10-16" }) : null;

// Authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send('Unauthorized');
};

// Role-based access middleware
const hasRole = (role: string) => {
  return (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === role) {
      return next();
    }
    res.status(403).send('Forbidden');
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // ======= Products API =======
  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get product by ID
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get products by farmer ID
  app.get("/api/farmer/products", isAuthenticated, hasRole("farmer"), async (req, res) => {
    try {
      const farmerId = req.user.id;
      const products = await storage.getProductsByFarmerId(farmerId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new product
  app.post("/api/farmer/products", isAuthenticated, hasRole("farmer"), async (req, res) => {
    try {
      const farmerId = req.user.id;
      const product = {
        ...req.body,
        farmerId
      };
      
      const newProduct = await storage.createProduct(product);
      res.status(201).json(newProduct);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update a product
  app.put("/api/farmer/products/:id", isAuthenticated, hasRole("farmer"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const farmerId = req.user.id;
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.farmerId !== farmerId) {
        return res.status(403).json({ error: "You don't have permission to update this product" });
      }
      
      const updatedProduct = await storage.updateProduct(id, req.body);
      res.json(updatedProduct);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a product
  app.delete("/api/farmer/products/:id", isAuthenticated, hasRole("farmer"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const farmerId = req.user.id;
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.farmerId !== farmerId) {
        return res.status(403).json({ error: "You don't have permission to delete this product" });
      }
      
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ======= Orders API =======
  // Get all orders
  app.get("/api/admin/orders", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get orders for a buyer
  app.get("/api/buyer/orders", isAuthenticated, hasRole("buyer"), async (req, res) => {
    try {
      const buyerId = req.user.id;
      const orders = await storage.getOrdersByBuyerId(buyerId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get orders for a farmer
  app.get("/api/farmer/orders", isAuthenticated, hasRole("farmer"), async (req, res) => {
    try {
      const farmerId = req.user.id;
      const orders = await storage.getOrdersByFarmerId(farmerId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new order
  app.post("/api/buyer/orders", isAuthenticated, hasRole("buyer"), async (req, res) => {
    try {
      const buyerId = req.user.id;
      const { items, ...orderData } = req.body;
      
      const order = {
        ...orderData,
        buyerId,
        status: "pending"
      };
      
      const newOrder = await storage.createOrder(order, items);
      res.status(201).json(newOrder);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update order status (farmers can update their part of an order)
  app.put("/api/farmer/orders/:id", isAuthenticated, hasRole("farmer"), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const farmerId = req.user.id;
      
      // Check if the farmer is part of this order
      const isParticipant = await storage.isFarmerOrderParticipant(farmerId, orderId);
      
      if (!isParticipant) {
        return res.status(403).json({ error: "You don't have permission to update this order" });
      }
      
      const { status } = req.body;
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      res.json(updatedOrder);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ======= Market Prices API =======
  // Get all market prices
  app.get("/api/market-prices", async (req, res) => {
    try {
      const marketPrices = await storage.getAllMarketPrices();
      res.json(marketPrices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Create/update market price
  app.post("/api/admin/market-prices", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      const marketPrice = await storage.createMarketPrice(req.body);
      res.status(201).json(marketPrice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Update market price
  app.put("/api/admin/market-prices/:id", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const marketPrice = await storage.updateMarketPrice(id, req.body);
      res.json(marketPrice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ======= User Profile API =======
  // Get current user's profile
  app.get("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).send('Unauthorized');
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Don't send sensitive information like password back to client
      const { password, ...profile } = user;
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user's profile
  app.put("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).send('Unauthorized');
      }
      
      // Validate the input data
      const { email, name, address, phone, bio, profilePicture } = req.body;
      
      // Update user's profile
      const updatedUser = await storage.updateUserProfile(userId, {
        email,
        name,
        address,
        phone,
        bio,
        profilePicture
      });
      
      // Don't send sensitive information like password back to client
      const { password, ...profile } = updatedUser;
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ======= Notifications API =======
  // Get notifications for the current user
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).send('Unauthorized');
      }
      
      const notifications = await notificationService.getNotificationsForUser(userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Mark notification as read
  app.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).send('Unauthorized');
      }
      
      const success = await notificationService.markAsRead(notificationId, userId);
      
      if (!success) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Mark all notifications as read
  app.put("/api/notifications/read-all", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).send('Unauthorized');
      }
      
      const success = await notificationService.markAllAsRead(userId);
      
      if (!success) {
        return res.status(404).json({ error: "No notifications found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete a notification
  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).send('Unauthorized');
      }
      
      const success = await notificationService.deleteNotification(notificationId, userId);
      
      if (!success) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // ======= Payment and Order Processing =======
  // Process payment for an order (mock)
  app.post("/api/buyer/orders/:id/pay", isAuthenticated, hasRole("buyer"), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const buyerId = req.user?.id;
      
      if (!buyerId) {
        return res.status(401).send('Unauthorized');
      }
      
      // Get the order
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.buyerId !== buyerId) {
        return res.status(403).json({ error: "You don't have permission to pay for this order" });
      }
      
      if (order.status !== "pending") {
        return res.status(400).json({ error: "Order has already been processed" });
      }
      
      // Update order status to 'paid'
      const updatedOrder = await storage.updateOrderStatus(orderId, "paid");
      
      // For each farmer in the order, send a notification
      // In a real app, we would look up all farmers associated with the order items
      // For now, we'll use a mock farmerId
      const farmerId = 1; // Mock farmer ID
      
      // Send notifications
      await notificationService.notifyPaymentReceived(orderId, buyerId, farmerId);
      
      // Send realtime update via WebSocket
      const broadcast = (global as any).wsBroadcast;
      if (broadcast) {
        broadcast({
          type: 'payment_received',
          orderId: orderId,
          farmerId: farmerId
        });
      }
      
      res.json({
        success: true,
        order: updatedOrder,
        message: "Payment processed successfully"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Approve an order (farmer confirms receipt of payment and item availability)
  app.post("/api/farmer/orders/:id/approve", isAuthenticated, hasRole("farmer"), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const farmerId = req.user?.id;
      
      if (!farmerId) {
        return res.status(401).send('Unauthorized');
      }
      
      // Check if the farmer is part of this order
      const isParticipant = await storage.isFarmerOrderParticipant(farmerId, orderId);
      
      if (!isParticipant) {
        return res.status(403).json({ error: "You don't have permission to approve this order" });
      }
      
      // Get the order
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.status !== "paid") {
        return res.status(400).json({ error: "Order must be paid before it can be approved" });
      }
      
      // Update order status to 'confirmed'
      const updatedOrder = await storage.updateOrderStatus(orderId, "confirmed");
      
      // Send notification to buyer
      await notificationService.notifyOrderConfirmed(orderId, order.buyerId, farmerId);
      
      // Send realtime update via WebSocket
      const broadcast = (global as any).wsBroadcast;
      if (broadcast) {
        broadcast({
          type: 'order_confirmed',
          orderId: orderId,
          buyerId: order.buyerId
        });
      }
      
      res.json({
        success: true,
        order: updatedOrder,
        message: "Order has been approved and confirmed"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // ======= Stripe Payment Integration =======
  // Create payment intent
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: "Stripe API key not configured" });
      }
      
      const { amount } = req.body;
      
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      
      // Convert to cents for Stripe
      const amountInCents = Math.round(amount * 100);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "Ksh",
        // In a real app, you might want to store customer/metadata
        metadata: { userId: req.user?.id }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Send welcome message
    ws.send(JSON.stringify({ type: 'connection', message: 'Connected to Farmers Market WebSocket Server' }));
    
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
      
      // Here you can handle different message types and broadcast to relevant clients
      // For example, updating market prices, order status changes, etc.
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });
  
  // Broadcast function for sending messages to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(data));
      }
    });
  };
  
  // Export broadcast function for use elsewhere in the app
  (global as any).wsBroadcast = broadcast;

  return httpServer;
}