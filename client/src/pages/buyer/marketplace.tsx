import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter,
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Image, 
  ChevronRight, 
  ShoppingCart, 
  Store, 
  Package, 
  Search, 
  Filter, 
  SlidersHorizontal,
  X,
  Minus,
  Plus,
  ShoppingBasket
} from "lucide-react";
import { Product } from "@shared/schema";

interface CartItem extends Product {
  quantity: number;
}

export default function Marketplace() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [organicOnly, setOrganicOnly] = useState(false);

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  useEffect(() => {
    // Fetch user and products
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
        
        // Fetch all products
        const productsResponse = await fetch('/api/products', {
          credentials: 'include'
        });
        
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const productsData = await productsResponse.json();
        setProducts(productsData);
        setFilteredProducts(productsData);
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

  useEffect(() => {
    // Apply filters to products
    let results = [...products];
    
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(product => 
        product.name.toLowerCase().includes(term) || 
        (product.description?.toLowerCase().includes(term)) ||
        product.category.toLowerCase().includes(term)
      );
    }
    
    // Category filter
    if (categoryFilter) {
      results = results.filter(product => product.category === categoryFilter);
    }
    
    // Organic filter
    if (organicOnly) {
      results = results.filter(product => product.organic);
    }
    
    setFilteredProducts(results);
  }, [searchTerm, categoryFilter, organicOnly, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      // Check if item already exists in cart
      const existingItem = prev.find(item => item.id === product.id);
      
      if (existingItem) {
        // Increase quantity if already in cart
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Add new item to cart
        return [...prev, { ...product, quantity: 1 }];
      }
    });
    
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // Make sure quantity doesn't exceed available stock
    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.quantity) {
      toast({
        title: "Quantity Limited",
        description: `Only ${product.quantity} ${product.unit}s available`,
        variant: "destructive"
      });
      newQuantity = product.quantity;
    }
    
    setCart(prev => 
      prev.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart",
    });
  };

  const proceedToCheckout = () => {
    // Store cart in session storage for checkout page
    sessionStorage.setItem('cart', JSON.stringify(cart));
    window.location.href = '/buyer/checkout';
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

  // Get unique categories for the filter
  const categories = [...new Set(products.map(p => p.category))];
  
  if (isLoading && !products.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error && !products.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-destructive mb-4">{error}</div>
        <Button onClick={() => window.location.href = '/auth'}>
          Return to Login
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
            className="flex items-center p-2 rounded-md bg-primary/10 text-primary"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Marketplace
          </a>
          <a 
            href="/buyer/orders" 
            className="flex items-center p-2 rounded-md hover:bg-gray-100"
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
            <h1 className="text-2xl font-bold">Marketplace</h1>
            <p className="text-muted-foreground">Browse fresh produce from local farmers</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCart(true)} className="relative">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Button>
            
            <Button 
              onClick={handleLogout}
              variant="outline" 
              className="md:hidden"
            >
              Sign Out
            </Button>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <select 
                className="px-3 py-2 border rounded-md"
                value={categoryFilter || ''}
                onChange={(e) => setCategoryFilter(e.target.value || null)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <Button 
                variant={organicOnly ? "default" : "outline"} 
                onClick={() => setOrganicOnly(!organicOnly)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Organic Only
              </Button>
            </div>
          </div>
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video relative bg-gray-100">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                
                {product.organic && (
                  <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Organic
                  </span>
                )}
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle>{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </CardHeader>
              
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-lg font-bold">
                    Ksh{product.price.toFixed(2)} / {product.unit}
                  </div>
                  <div className="text-sm">
                    {product.quantity} {product.unit} available
                  </div>
                </div>
                
                <p className="text-sm line-clamp-2 mb-4">{product.description}</p>
                
                <Button 
                  className="w-full"
                  onClick={() => addToCart(product)}
                  disabled={product.quantity <= 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
              <ShoppingBasket className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground text-center mb-4">
                No products match your search criteria. Try adjusting your filters.
              </p>
              <Button onClick={() => {
                setSearchTerm('');
                setCategoryFilter(null);
                setOrganicOnly(false);
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Shopping Cart Sidebar */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
            <SheetDescription>
              {cart.length} item{cart.length !== 1 ? 's' : ''} in your cart
            </SheetDescription>
          </SheetHeader>
          
          {cart.length > 0 ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto py-4">
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4 py-2 border-b">
                      <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Image className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">Ksh{item.price.toFixed(2)} / {item.unit}</p>
                        
                        <div className="flex items-center mt-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="mx-2 w-6 text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className="font-medium">
                          Ksh{(item.price * item.quantity).toFixed(2)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 mt-2"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-medium">Ksh{cartTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground mb-4">
                  <span>Shipping and taxes calculated at checkout</span>
                </div>
                
                <div className="space-y-2">
                  <Button className="w-full" onClick={proceedToCheckout}>
                    Checkout (Ksh{cartTotal.toFixed(2)})
                  </Button>
                  
                  <Button variant="outline" className="w-full" onClick={clearCart}>
                    Clear Cart
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[70vh]">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground text-center mb-4">
                Browse the marketplace and add some items to your cart.
              </p>
              <SheetClose asChild>
                <Button>Continue Shopping</Button>
              </SheetClose>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}