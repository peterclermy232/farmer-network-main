import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Store, 
  ChevronRight, 
  Package, 
  Truck, 
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  X,
  CalendarDays,
  Star
} from "lucide-react";
import { Order } from "@shared/schema";

// Map order status to badge style
const orderStatusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" | null | undefined, icon: React.ReactNode }> = {
  "pending": { 
    label: "Pending", 
    variant: "outline", 
    icon: <Clock className="h-4 w-4" /> 
  },
  "confirmed": { 
    label: "Confirmed", 
    variant: "secondary", 
    icon: <CheckCircle className="h-4 w-4" /> 
  },
  "shipped": { 
    label: "Shipped", 
    variant: "default", 
    icon: <Truck className="h-4 w-4" /> 
  },
  "delivered": { 
    label: "Delivered", 
    variant: "default", 
    icon: <Package className="h-4 w-4" /> 
  },
  "cancelled": { 
    label: "Cancelled", 
    variant: "destructive", 
    icon: <X className="h-4 w-4" /> 
  }
};

export default function OrderHistory() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  
  // Mock orders data
  const mockOrders = [
    {
      id: 1,
      orderNumber: "FM-1001",
      status: "delivered",
      total: 56.75,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
      items: [
        { name: "Organic Apples", quantity: 2, price: 4.99, unit: "kg" },
        { name: "Fresh Carrots", quantity: 1, price: 3.49, unit: "bunch" },
        { name: "Free-range Eggs", quantity: 1, price: 5.99, unit: "dozen" }
      ],
      deliveryDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      hasRated: true,
      farmersInfo: [
        { name: "Green Acres Farm", id: 101 }
      ]
    },
    {
      id: 2,
      orderNumber: "FM-1002",
      status: "shipped",
      total: 42.30,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      items: [
        { name: "Organic Tomatoes", quantity: 1, price: 3.99, unit: "kg" },
        { name: "Local Honey", quantity: 1, price: 8.50, unit: "jar" }
      ],
      estimatedDelivery: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      trackingInfo: {
        number: "FM-TRACK-1234568",
        currentStatus: "in transit",
        currentLocation: "Distribution Center"
      },
      farmersInfo: [
        { name: "Valley View Organics", id: 102 }
      ]
    },
    {
      id: 3,
      orderNumber: "FM-1003",
      status: "confirmed",
      total: 78.45,
      createdAt: new Date().toISOString(), // today
      items: [
        { name: "Fresh Strawberries", quantity: 2, price: 6.99, unit: "box" },
        { name: "Artisanal Cheese", quantity: 1, price: 12.50, unit: "piece" },
        { name: "Organic Spinach", quantity: 1, price: 4.99, unit: "bundle" }
      ],
      estimatedDelivery: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days from now
      farmersInfo: [
        { name: "Sunny Field Farms", id: 103 },
        { name: "Dairy Delights", id: 104 }
      ]
    },
    {
      id: 4,
      orderNumber: "FM-1004",
      status: "pending",
      total: 35.20,
      createdAt: new Date().toISOString(), // today
      items: [
        { name: "Heirloom Tomatoes", quantity: 1, price: 5.99, unit: "kg" },
        { name: "Fresh Basil", quantity: 1, price: 2.99, unit: "bunch" },
        { name: "Olive Oil", quantity: 1, price: 12.99, unit: "bottle" }
      ],
      farmersInfo: [
        { name: "Mediterranean Harvest", id: 105 }
      ]
    }
  ];

  useEffect(() => {
    // Fetch user and orders
    const fetchData = async () => {
      try {
        // Fetch user info
        const userResponse = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (userResponse.status === 401) {
          window.location.href = '/auth';
          return;
        }
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await userResponse.json();
        
        if (userData.role !== 'buyer') {
          window.location.href = `/${userData.role}/dashboard`;
          return;
        }
        
        setUser(userData);
        
        // Fetch buyer's orders
        // In a real app, use something like:
        // const ordersResponse = await fetch('/api/buyer/orders', {
        //   credentials: 'include'
        // });
        
        // if (!ordersResponse.ok) {
        //   throw new Error('Failed to fetch orders');
        // }
        
        // const ordersData = await ordersResponse.json();
        
        // For now, use mock data
        setOrders(mockOrders);
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTrackOrder = (orderId: number) => {
    // In a real app, navigate to the order tracking page
    window.location.href = `/buyer/order-tracking/${orderId}`;
  };

  const handleViewDetails = (orderId: number) => {
    // In a real app, navigate to the order details page
    window.location.href = `/buyer/order-details/${orderId}`;
  };

  const handleReorder = (orderId: number) => {
    // Find the order
    const orderToReorder = orders.find(order => order.id === orderId);
    
    if (orderToReorder) {
      // In a real app, add all items to cart
      // For now, just show a success message
      toast({
        title: "Items Added to Cart",
        description: `${orderToReorder.items.length} items from order ${orderToReorder.orderNumber} have been added to your cart.`,
      });
    }
  };

  const handleRateOrder = (orderId: number) => {
    // In a real app, navigate to the rating page
    window.location.href = `/buyer/order-rating/${orderId}`;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = '/auth';
    } catch (err) {
      console.error('Logout failed', err);
    }
  };
  
  // Filter and sort orders
  const filteredOrders = orders.filter(order => {
    // Filter by status
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      if (
        !order.orderNumber.toLowerCase().includes(searchLower) &&
        !order.items.some((item: any) => 
          item.name.toLowerCase().includes(searchLower)
        ) &&
        !order.farmersInfo.some((farmer: any) =>
          farmer.name.toLowerCase().includes(searchLower)
        )
      ) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "date-asc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "date-desc":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "price-asc":
        return a.total - b.total;
      case "price-desc":
        return b.total - a.total;
      default:
        return 0;
    }
  });
  
  // Group orders by status for tabs
  const activeOrders = orders.filter(order => 
    ["pending", "confirmed", "shipped"].includes(order.status)
  );
  const pastOrders = orders.filter(order => 
    ["delivered", "cancelled"].includes(order.status)
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-destructive mb-4">{error}</div>
        <Button onClick={() => window.location.href = '/buyer/dashboard'}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Simple sidebar */}
      <div className="w-64 bg-white shadow-sm p-4 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <Store className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Farmers Market</h1>
        </div>
        
        <nav className="space-y-2">
          <a 
            href="/buyer/dashboard" 
            className="flex items-center p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Dashboard
          </a>
          <a 
            href="/buyer/marketplace" 
            className="flex items-center p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Marketplace
          </a>
          <a 
            href="/buyer/orders" 
            className="flex items-center p-2 rounded-md bg-primary/10 text-primary"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            My Orders
          </a>
        </nav>
        
        <div className="mt-auto pt-6">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">View and manage your orders</p>
          </div>
          
          <Button 
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={handleLogout}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
        </div>
        
        {/* Filters and search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          <div className="relative md:col-span-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders by number, product, or farm..."
              className="pl-9"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="md:col-span-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Orders tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
            <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastOrders.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="space-y-4">
              {sortedOrders.length > 0 ? (
                sortedOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onTrack={handleTrackOrder}
                    onViewDetails={handleViewDetails}
                    onReorder={handleReorder}
                    onRate={handleRateOrder}
                  />
                ))
              ) : (
                <div className="text-center p-8 bg-muted/40 rounded-lg">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No orders found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try changing your filters or search terms" 
                      : "Start shopping to see orders here"}
                  </p>
                  {(searchQuery || statusFilter !== "all") && (
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                    >
                      Clear all filters
                    </Button>
                  )}
                  <div className="mt-4">
                    <Button 
                      onClick={() => window.location.href = '/buyer/marketplace'}
                    >
                      Go to Marketplace
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="active">
            <div className="space-y-4">
              {activeOrders.length > 0 ? (
                activeOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onTrack={handleTrackOrder}
                    onViewDetails={handleViewDetails}
                    onReorder={handleReorder}
                    onRate={handleRateOrder}
                  />
                ))
              ) : (
                <div className="text-center p-8 bg-muted/40 rounded-lg">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active orders</h3>
                  <p className="text-muted-foreground">All your orders have been delivered or cancelled</p>
                  <div className="mt-4">
                    <Button 
                      onClick={() => window.location.href = '/buyer/marketplace'}
                    >
                      Go to Marketplace
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="past">
            <div className="space-y-4">
              {pastOrders.length > 0 ? (
                pastOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onTrack={handleTrackOrder}
                    onViewDetails={handleViewDetails}
                    onReorder={handleReorder}
                    onRate={handleRateOrder}
                  />
                ))
              ) : (
                <div className="text-center p-8 bg-muted/40 rounded-lg">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No past orders</h3>
                  <p className="text-muted-foreground">Your orders are still being processed</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Order card component
interface OrderCardProps {
  order: any;
  onTrack: (id: number) => void;
  onViewDetails: (id: number) => void;
  onReorder: (id: number) => void;
  onRate: (id: number) => void;
}

function OrderCard({ order, onTrack, onViewDetails, onReorder, onRate }: OrderCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2 md:mb-0">
            <div className="font-medium">Order #{order.orderNumber}</div>
            <div className="text-sm text-muted-foreground md:border-l md:pl-2">
              {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          <Badge variant={orderStatusMap[order.status]?.variant} className="w-fit flex items-center gap-1">
            {orderStatusMap[order.status]?.icon}
            {orderStatusMap[order.status]?.label}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Items</h3>
            <div className="text-sm space-y-1">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {item.quantity} × {item.name}
                  </span>
                  <span>Ksh{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              
              {order.items.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{order.items.length - 3} more items
                </div>
              )}
            </div>
            
            <div className="mt-2 flex justify-between font-medium">
              <span>Total:</span>
              <span>Ksh{order.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div>
            {/* Tracking information */}
            {order.status === 'shipped' && (
              <div className="space-y-1 mb-4">
                <div className="flex gap-2 items-center">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Delivery Status</span>
                </div>
                <div className="text-sm">
                  {order.trackingInfo?.currentStatus === 'in transit' ? 'In transit' : 'Preparing for shipment'}
                </div>
                {order.estimatedDelivery && (
                  <div className="flex gap-2 items-center text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Farmers information */}
            {order.farmersInfo && (
              <div className="text-sm mb-4">
                <span className="font-medium">From: </span>
                {order.farmersInfo.map((farmer: any, index: number) => (
                  <span key={farmer.id}>
                    {farmer.name}
                    {index < order.farmersInfo.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-auto">
              {order.status === 'shipped' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onTrack(order.id)}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Track Order
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onViewDetails(order.id)}
              >
                Details
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onReorder(order.id)}
              >
                Reorder
              </Button>
              
              {order.status === 'delivered' && !order.hasRated && (
                <Button 
                  size="sm" 
                  onClick={() => onRate(order.id)}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Rate
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}