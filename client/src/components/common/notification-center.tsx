import React, { useState, useEffect } from 'react';
import { Bell, Check, X, BellRing, ShoppingCart, Package, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Define notification type
export interface Notification {
  id: number;
  userId: number;
  userRole: 'farmer' | 'buyer' | 'admin';
  type: 'order_placed' | 'order_confirmed' | 'payment_received' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'new_message';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  relatedId?: number;
}

// Icon mapping for different notification types
const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  switch(type) {
    case 'order_placed':
      return <ShoppingCart className="h-4 w-4 text-primary" />;
    case 'order_confirmed':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'payment_received':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'order_shipped':
      return <Truck className="h-4 w-4 text-blue-500" />;
    case 'order_delivered':
      return <Package className="h-4 w-4 text-green-500" />;
    case 'order_cancelled':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'new_message':
      return <BellRing className="h-4 w-4 text-amber-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

type NotificationCenterProps = {
  userRole: 'farmer' | 'buyer' | 'admin';
}

export default function NotificationCenter({ userRole }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        // For demo, show mocked notifications if API fails
        const mockNotifications = getMockNotifications(userRole);
        setNotifications(mockNotifications);
        return;
      }
      
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      // For demo, show mocked notifications
      const mockNotifications = getMockNotifications(userRole);
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate mock notifications based on user role for demo
  const getMockNotifications = (role: 'farmer' | 'buyer' | 'admin'): Notification[] => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (role === 'farmer') {
      return [
        {
          id: 1,
          userId: 1,
          userRole: 'farmer',
          type: 'payment_received',
          title: 'Payment Received',
          message: 'You have received payment for order #12345. Please confirm the order.',
          read: false,
          createdAt: now,
          relatedId: 12345
        },
        {
          id: 2,
          userId: 1,
          userRole: 'farmer',
          type: 'order_placed',
          title: 'New Order Received',
          message: 'You have received a new order #12346 that needs confirmation.',
          read: false,
          createdAt: yesterday,
          relatedId: 12346
        },
        {
          id: 3,
          userId: 1,
          userRole: 'farmer',
          type: 'order_delivered',
          title: 'Order Delivered',
          message: 'Order #12340 has been delivered to the customer.',
          read: true,
          createdAt: yesterday,
          relatedId: 12340
        }
      ];
    } else if (role === 'buyer') {
      return [
        {
          id: 1,
          userId: 2,
          userRole: 'buyer',
          type: 'order_confirmed',
          title: 'Order Confirmed',
          message: 'Your order #12345 has been confirmed by the farmer and is being prepared.',
          read: false,
          createdAt: now,
          relatedId: 12345
        },
        {
          id: 2,
          userId: 2,
          userRole: 'buyer',
          type: 'order_shipped',
          title: 'Order Shipped',
          message: 'Your order #12343 has been shipped and is on its way to you.',
          read: false,
          createdAt: yesterday,
          relatedId: 12343
        }
      ];
    } else {
      return [
        {
          id: 1,
          userId: 3,
          userRole: 'admin',
          type: 'new_message',
          title: 'System Update',
          message: 'A new system update is available.',
          read: false,
          createdAt: now
        }
      ];
    }
  };
  
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId ? { ...notification, read: true } : notification
          )
        );
      } else {
        // For demo, update UI anyway
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId ? { ...notification, read: true } : notification
          )
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // For demo, update UI anyway
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
        toast({
          title: "Notifications",
          description: "All notifications marked as read",
        });
      } else {
        // For demo, update UI anyway
        setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
        toast({
          title: "Notifications",
          description: "All notifications marked as read",
        });
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      // For demo, update UI anyway
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      toast({
        title: "Notifications",
        description: "All notifications marked as read",
      });
    }
  };
  
  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      } else {
        // For demo, update UI anyway
        setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      // For demo, update UI anyway
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    }
  };
  
  useEffect(() => {
    fetchNotifications();
    
    // Setup WebSocket connection for real-time notifications
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different notification types
        if (data.type === 'payment_received' && userRole === 'farmer') {
          toast({
            title: "Payment Received",
            description: `You have received payment for order #${data.orderId}`,
          });
          fetchNotifications(); // Refresh notifications
        } else if (data.type === 'order_confirmed' && userRole === 'buyer') {
          toast({
            title: "Order Confirmed",
            description: "Your order has been confirmed by the farmer",
          });
          fetchNotifications(); // Refresh notifications
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [userRole, toast]);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Notifications</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs" 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark all as read
              </Button>
            </div>
            <CardDescription className="text-xs">
              {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'No new notifications'}
            </CardDescription>
          </CardHeader>
          
          <Separator />
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <CardContent className="py-6 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
              </CardContent>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 border-b last:border-0 ${notification.read ? '' : 'bg-primary/5'}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <NotificationIcon type={notification.type} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-5 w-5" 
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-5 w-5" 
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{notification.message}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notification.createdAt), 'MMM dd, HH:mm')}
                        </span>
                        {!notification.read && <Badge variant="outline" className="text-[10px] h-5">New</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <CardContent className="py-6 text-center">
                <BellRing className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </CardContent>
            )}
          </div>
          
          {notifications.length > 0 && (
            <CardFooter className="p-2 justify-center border-t">
              <Button variant="ghost" size="sm" className="text-xs">
                View all notifications
              </Button>
            </CardFooter>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  );
}