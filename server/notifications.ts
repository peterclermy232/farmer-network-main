// This file handles notification functionality for the Farmers Market application
import { storage } from './storage';


export interface Notification {
  id: number;
  userId: number;
  userRole: 'farmer' | 'buyer' | 'admin';
  type: 'order_placed' | 'order_confirmed' | 'payment_received' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'new_message';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  relatedId?: number; // Can be orderId, productId, etc.
}

class NotificationService {
  private notifications: Map<number, Notification[]> = new Map();
  private lastId: number = 0;

  constructor() {
    // Initialize with some mock data
    this.initialize();
  }

  private initialize() {
    // In a real app, we would load notifications from a database
    // For now, we'll just create some mock data
  }

  // Create a new notification for a user
  async createNotification(
    userId: number,
    userRole: 'farmer' | 'buyer' | 'admin',
    type: Notification['type'],
    title: string,
    message: string,
    relatedId?: number
  ): Promise<Notification> {
    const notification: Notification = {
      id: ++this.lastId,
      userId,
      userRole,
      type,
      title,
      message,
      read: false,
      createdAt: new Date(),
      relatedId
    };

    // Get existing notifications for this user or create a new array
    const userNotifications = this.notifications.get(userId) || [];
    
    // Add the new notification
    userNotifications.push(notification);
    
    // Update the map
    this.notifications.set(userId, userNotifications);

    return notification;
  }

  // Get notifications for a user
  async getNotificationsForUser(userId: number): Promise<Notification[]> {
    return this.notifications.get(userId) || [];
  }

  // Mark a notification as read
  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    const userNotifications = this.notifications.get(userId);
    
    if (!userNotifications) {
      return false;
    }

    // Find the notification and mark it as read
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return false;
    }

    notification.read = true;
    return true;
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: number): Promise<boolean> {
    const userNotifications = this.notifications.get(userId);
    
    if (!userNotifications) {
      return false;
    }

    userNotifications.forEach(notification => {
      notification.read = true;
    });

    return true;
  }

  // Clear a notification
  async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    const userNotifications = this.notifications.get(userId);
    
    if (!userNotifications) {
      return false;
    }

    // Filter out the notification to delete
    const updatedNotifications = userNotifications.filter(n => n.id !== notificationId);
    
    // Update the map
    this.notifications.set(userId, updatedNotifications);

    return true;
  }

  // Notification for order placement
  async notifyOrderPlaced(orderId: number, buyerId: number, farmerId: number): Promise<void> {
    // Notify the buyer
    await this.createNotification(
      buyerId,
      'buyer',
      'order_placed',
      'Order Placed Successfully',
      'Your order has been placed and is waiting for confirmation.',
      orderId
    );

    // Notify the farmer
    await this.createNotification(
      farmerId,
      'farmer',
      'order_placed',
      'New Order Received',
      'You have received a new order that needs your confirmation.',
      orderId
    );
  }

  // Notification for payment received
  async notifyPaymentReceived(orderId: number, buyerId: number, farmerId: number): Promise<void> {
    // Notify the buyer
    await this.createNotification(
      buyerId,
      'buyer',
      'payment_received',
      'Payment Successful',
      'Your payment has been processed successfully. The farmer will be notified.',
      orderId
    );

    // Notify the farmer
    await this.createNotification(
      farmerId,
      'farmer',
      'payment_received',
      'Payment Received',
      'Payment for an order has been received. Please confirm and process the order.',
      orderId
    );
  }

  // Notification for order confirmation by farmer
  async notifyOrderConfirmed(orderId: number, buyerId: number, farmerId: number): Promise<void> {
    // Notify the buyer
    await this.createNotification(
      buyerId,
      'buyer',
      'order_confirmed',
      'Order Confirmed',
      'Your order has been confirmed by the farmer and is being prepared.',
      orderId
    );
  }

  // Notification for order shipped
  async notifyOrderShipped(orderId: number, buyerId: number, farmerId: number): Promise<void> {
    // Notify the buyer
    await this.createNotification(
      buyerId,
      'buyer',
      'order_shipped',
      'Order Shipped',
      'Your order has been shipped and is on its way to you.',
      orderId
    );
  }

  // Notification for order delivered
  async notifyOrderDelivered(orderId: number, buyerId: number, farmerId: number): Promise<void> {
    // Notify the buyer
    await this.createNotification(
      buyerId,
      'buyer',
      'order_delivered',
      'Order Delivered',
      'Your order has been delivered. Please rate your experience.',
      orderId
    );

    // Notify the farmer
    await this.createNotification(
      farmerId,
      'farmer',
      'order_delivered',
      'Order Delivered',
      'An order has been successfully delivered to the customer.',
      orderId
    );
  }

  // Notification for order cancellation
  async notifyOrderCancelled(orderId: number, buyerId: number, farmerId: number, cancelledBy: 'farmer' | 'buyer'): Promise<void> {
    if (cancelledBy === 'farmer') {
      // Notify the buyer
      await this.createNotification(
        buyerId,
        'buyer',
        'order_cancelled',
        'Order Cancelled',
        'Your order has been cancelled by the farmer.',
        orderId
      );
    } else {
      // Notify the farmer
      await this.createNotification(
        farmerId,
        'farmer',
        'order_cancelled',
        'Order Cancelled',
        'An order has been cancelled by the customer.',
        orderId
      );
    }
  }
}

export const notificationService = new NotificationService();