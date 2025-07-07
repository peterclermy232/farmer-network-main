import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import StatsCard from "@/components/common/stats-card";
import MarketPriceTable from "@/components/common/market-price-table";
import OrderTable from "@/components/common/order-table";
import { Product, Order } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  CircleDollarSign, 
  Package, 
  Store,
  Loader2,
  Search
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Cart item type
type CartItem = {
  product: Product;
  quantity: number;
};

export default function BuyerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Fetch featured products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch buyer's orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user?.id,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order placed successfully",
        description: "Your order has been placed and is being processed.",
      });
      setCartItems([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter products based on search term
  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 6); // Show only first 6 products

  // Calculate cart statistics
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  
  const cartItemCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Handle add to cart
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart.`,
    });
  };

  // Handle remove from cart
  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  // Handle cart item quantity change
  const updateCartItemQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    const orderData = {
      total: cartTotal,
      items: cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }))
    };
    
    createOrderMutation.mutate(orderData);
  };

  // Stats for buyer dashboard
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrdersCount = orders.filter(order => order.status === "pending").length;
  const completedOrdersCount = orders.filter(order => order.status === "delivered").length;

  return (
    <Layout 
      title={`Welcome, ${user?.name?.split(' ')[0] || user?.username}!`}
      subtitle="Find fresh produce directly from local farmers."
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Spent"
          value={`Ksh${totalSpent.toFixed(2)}`}
          icon={<CircleDollarSign className="h-5 w-5" />}
          iconBgColor="bg-blue-100 text-blue-600"
        />
        
        <StatsCard
          title="Pending Orders"
          value={pendingOrdersCount}
          icon={<Package className="h-5 w-5" />}
          iconBgColor="bg-amber-100 text-amber-600"
        />
        
        <StatsCard
          title="Completed Orders"
          value={completedOrdersCount}
          icon={<ShoppingCart className="h-5 w-5" />}
          iconBgColor="bg-green-100 text-green-600"
        />
      </div>

      {/* Search and Featured Products */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Featured Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search for produce..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {isLoadingProducts ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center">
                <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">
                  Try adjusting your search term
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id}>
                    <div className="h-40 w-full overflow-hidden bg-gray-100">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span>No image</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">Farmer #{product.farmerId}</p>
                        </div>
                        <Badge variant="outline" className="bg-primary bg-opacity-10 text-primary">
                          {product.category}
                        </Badge>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            Ksh{product.price.toFixed(2)} / {product.unit}
                          </p>
                          <p className={`text-sm ${product.quantity <= 25 ? "text-yellow-600" : "text-green-600"}`}>
                            {product.quantity <= 25 ? "Low Stock" : "In Stock"}: {product.quantity} {product.unit}
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => addToCart(product)}
                          disabled={product.quantity <= 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-center">
            <Button variant="outline" onClick={() => window.location.href = "/buyer/marketplace"}>
              View All Products
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Market Price Trends */}
        <div className="lg:col-span-2">
          <MarketPriceTable />
        </div>

        {/* Cart Summary */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Cart</CardTitle>
              <Badge>{cartItemCount} items</Badge>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <div className="py-6 text-center">
                  <ShoppingCart className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md overflow-hidden mr-3 bg-gray-100">
                          {item.product.imageUrl ? (
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.product.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span>No image</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{item.product.name}</h4>
                          <p className="text-xs text-gray-500">
                            {item.quantity} {item.product.unit} x Ksh{item.product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Ksh{(item.quantity * item.product.price).toFixed(2)}
                        </p>
                        <button 
                          className="text-xs text-red-600"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-sm font-medium text-gray-900">Ksh{cartTotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">Delivery Fee</p>
                  <p className="text-sm font-medium text-gray-900">Ksh2.00</p>
                </div>
                <div className="flex justify-between items-center font-semibold">
                  <p className="text-gray-900">Total</p>
                  <p className="text-gray-900">Ksh{(cartTotal + 2).toFixed(2)}</p>
                </div>
                
                <div className="mt-4">
                  <Button 
                    className="w-full"
                    disabled={cartItems.length === 0 || createOrderMutation.isPending}
                    onClick={handleCheckout}
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Proceed to Checkout"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mb-6">
        <OrderTable />
      </div>
    </Layout>
  );
}
