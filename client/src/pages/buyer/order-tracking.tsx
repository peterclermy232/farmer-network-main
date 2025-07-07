import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Store, 
  ChevronRight, 
  PackageCheck, 
  MapPin, 
  TruckIcon,
  CheckCircle,
  Star,
  Phone,
  Calendar,
  Clock,
  Info
} from "lucide-react";
import { Order } from "@shared/schema";

interface DeliveryStatus {
  status: 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered';
  label: string;
  completedStep: number;
  timestamp: string;
  description: string;
  icon: React.ReactNode;
}

export default function OrderTracking() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [productRating, setProductRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  
  // Get order ID from URL
  const getOrderId = () => {
    // In a real app, you would get this from the URL params
    // For now, let's return a mock order ID
    return 1;
  };
  
  const statusSteps: DeliveryStatus[] = [
    {
      status: 'processing',
      label: 'Order Confirmed',
      completedStep: 1,
      timestamp: '2023-09-10 09:30 AM',
      description: 'Your order has been confirmed and is being processed.',
      icon: <CheckCircle className="h-5 w-5" />
    },
    {
      status: 'packed',
      label: 'Order Packed',
      completedStep: 2,
      timestamp: '2023-09-10 02:15 PM',
      description: 'Your order has been packed and is ready for shipping.',
      icon: <PackageCheck className="h-5 w-5" />
    },
    {
      status: 'shipped',
      label: 'Order Shipped',
      completedStep: 3,
      timestamp: '2023-09-11 10:45 AM',
      description: 'Your order has been shipped and is on its way.',
      icon: <TruckIcon className="h-5 w-5" />
    },
    {
      status: 'out_for_delivery',
      label: 'Out for Delivery',
      completedStep: 4,
      timestamp: '2023-09-12 08:30 AM',
      description: 'Your order is out for delivery and will arrive soon.',
      icon: <MapPin className="h-5 w-5" />
    },
    {
      status: 'delivered',
      label: 'Delivered',
      completedStep: 5,
      timestamp: '2023-09-12 01:45 PM',
      description: 'Your order has been delivered successfully.',
      icon: <CheckCircle className="h-5 w-5" />
    }
  ];

  useEffect(() => {
    // Fetch user and order data
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
        
        // Fetch order details
        const orderId = getOrderId();
        // In a real app, would use something like:
        // const orderResponse = await fetch(`/api/orders/${orderId}`, {
        //   credentials: 'include'
        // });
        
        // Simulate a server response delay
        setTimeout(() => {
          // Mock order data
          const mockOrder = {
            id: orderId,
            orderNumber: 'FM-1001',
            status: 'shipped',
            total: 56.75,
            createdAt: new Date().toISOString(),
            items: [
              { id: 1, name: "Organic Apples", quantity: 2, price: 4.99, unit: "kg", farmer: "Green Acres Farm" },
              { id: 2, name: "Fresh Carrots", quantity: 1, price: 3.49, unit: "bunch", farmer: "Valley View Organics" },
              { id: 3, name: "Free-range Eggs", quantity: 1, price: 5.99, unit: "dozen", farmer: "Happy Hen Farm" }
            ],
            shippingInfo: {
              fullName: 'John Smith',
              email: 'john@example.com',
              address: '123 Main St',
              city: 'Anytown',
              state: 'CA',
              zipCode: '12345',
              phone: '(555) 123-4567',
              deliveryMethod: 'standard',
              deliveryDate: '2023-09-12',
              deliveryTimeSlot: 'afternoon'
            },
            currentStep: 3, // corresponds to 'shipped' status
            estimatedDelivery: '2023-09-12',
            trackingNumber: 'FM-TRACK-1234567',
            driverInfo: {
              name: 'Michael Johnson',
              phone: '(555) 987-6543',
              vehicleInfo: 'White Delivery Van #42'
            },
            currentLocation: {
              lat: 37.7749,
              lng: -122.4194,
              address: 'Distribution Center, Anytown',
              lastUpdated: '2023-09-11 11:30 AM'
            }
          };
          
          setOrder(mockOrder);
          setIsLoading(false);
        }, 1000);
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  const handleRatingSubmit = () => {
    // In a real app, this would send ratings to the server
    toast({
      title: "Thank you for your feedback!",
      description: "Your ratings have been submitted successfully.",
    });
    
    setShowRatingDialog(false);
  };

  const renderStarRating = (
    rating: number, 
    setRating: React.Dispatch<React.SetStateAction<number>>,
    interactive = true
  ) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setRating(star)}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
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
        <Button onClick={() => window.location.href = '/buyer/orders'}>
          Back to Orders
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-destructive mb-4">Order not found</div>
        <Button onClick={() => window.location.href = '/buyer/orders'}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const currentStatus = statusSteps.find(step => step.completedStep === order.currentStep);
  const progressPercentage = (order.currentStep / 5) * 100;

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
            <h1 className="text-2xl font-bold">Order Tracking</h1>
            <p className="text-muted-foreground">Track your order in real-time</p>
          </div>
          
          <div className="space-x-2 hidden md:block">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/buyer/orders'}
            >
              Back to Orders
            </Button>
            
            {order.status === 'delivered' && (
              <Button onClick={() => setShowRatingDialog(true)}>
                Rate Your Purchase
              </Button>
            )}
          </div>
          
          {/* Mobile action buttons */}
          <Button 
            variant="outline" 
            size="icon"
            className="md:hidden"
            onClick={() => window.location.href = '/buyer/orders'}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order status column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Order Status</CardTitle>
                  <Badge className="flex items-center gap-1">
                    {currentStatus?.icon}
                    {currentStatus?.label}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="mb-4">
                  <Progress value={progressPercentage} className="h-2" />
                </div>
                
                <div className="space-y-6">
                  {statusSteps.map((step, index) => (
                    <div 
                      key={step.status} 
                      className={`flex items-start gap-4 ${
                        index < order.currentStep ? 'opacity-100' : 'opacity-50'
                      }`}
                    >
                      <div className={`rounded-full p-2 ${
                        index < order.currentStep 
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.icon}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{step.label}</h3>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                          {index < order.currentStep && (
                            <span className="text-sm text-muted-foreground">{step.timestamp}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {order.status === 'shipped' || order.status === 'out_for_delivery' ? (
                  <div className="mt-6 bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Estimated Delivery</h3>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span>{order.estimatedDelivery}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span>
                          {order.shippingInfo.deliveryTimeSlot === 'morning'
                            ? 'Between 8am - 12pm'
                            : order.shippingInfo.deliveryTimeSlot === 'afternoon'
                            ? 'Between 12pm - 4pm'
                            : 'Between 4pm - 8pm'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
                
                {order.status === 'out_for_delivery' && (
                  <div className="mt-4 p-4 border rounded-lg bg-primary/5">
                    <h3 className="font-medium mb-2">Delivery Driver Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Name:</span>
                        <span className="font-medium">{order.driverInfo.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vehicle:</span>
                        <span>{order.driverInfo.vehicleInfo}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full mt-2 flex items-center justify-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Call Driver
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Map card */}
            <Card>
              <CardHeader>
                <CardTitle>Live Tracking</CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="relative bg-muted h-64 w-full rounded-md overflow-hidden mb-4">
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-primary animate-bounce" />
                      <p className="text-muted-foreground">Map view would be displayed here</p>
                      <p className="text-xs text-muted-foreground">Integrates with Google Maps or similar service</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Current Location</h4>
                      <p className="text-sm">{order.currentLocation.address}</p>
                      <p className="text-xs text-muted-foreground">Last updated: {order.currentLocation.lastUpdated}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Mobile rate button */}
            {order.status === 'delivered' && (
              <div className="md:hidden">
                <Button 
                  className="w-full"
                  onClick={() => setShowRatingDialog(true)}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Rate Your Purchase
                </Button>
              </div>
            )}
          </div>
          
          {/* Order details column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Number</span>
                    <span className="font-medium">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date Placed</span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">Ksh{order.total.toFixed(2)}</span>
                  </div>
                  {order.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tracking #</span>
                      <span className="font-medium">{order.trackingNumber}</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-medium">Items</h4>
                  {order.items.map((item: any) => (
                    <div key={item.id} className="grid grid-cols-[auto,1fr] gap-3">
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        <PackageCheck className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit} × Ksh{item.price.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Sold by: {item.farmer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Delivery Address</h4>
                  <p className="text-sm">{order.shippingInfo.fullName}</p>
                  <p className="text-sm">{order.shippingInfo.address}</p>
                  <p className="text-sm">{order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.zipCode}</p>
                  <p className="text-sm">{order.shippingInfo.phone}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Help</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Info className="h-4 w-4" />
                    Need Help with This Order?
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rate Your Purchase</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Product Quality</h4>
              <p className="text-sm text-muted-foreground">How satisfied are you with the products you received?</p>
              {renderStarRating(productRating, setProductRating)}
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Delivery Experience</h4>
              <p className="text-sm text-muted-foreground">How was your delivery experience?</p>
              {renderStarRating(deliveryRating, setDeliveryRating)}
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Additional Comments</h4>
              <textarea 
                className="w-full min-h-[100px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Share your experience or give feedback..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleRatingSubmit}>Submit Rating</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}