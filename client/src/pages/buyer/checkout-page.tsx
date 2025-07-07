import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Store, ChevronRight, CreditCard, ArrowLeft, CheckCircle } from "lucide-react";
import { Product } from "@shared/schema";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface CartItem extends Product {
  quantity: number;
}

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required environment variable: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm({ clientSecret, orderTotal, onSuccess }: { 
  clientSecret: string; 
  orderTotal: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        setError(submitError.message || 'An unexpected error occurred');
        return;
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (paymentError) {
        setError(paymentError.message || 'An unexpected error occurred with your payment');
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful",
          description: "Your order has been placed successfully!",
        });
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Details</h3>
        
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded text-sm">
            {error}
          </div>
        )}
        
        <PaymentElement />
        
        <div className="flex justify-between p-3 bg-muted/50 rounded">
          <span className="font-medium">Total:</span>
          <span className="font-bold">Ksh{orderTotal.toFixed(2)}</span>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={!stripe || isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay Now Ksh{orderTotal.toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    deliveryMethod: 'standard'
  });

  // Calculate totals
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shippingCost = shippingInfo.deliveryMethod === 'express' ? 10 : 5;
  const orderTotal = subtotal + shippingCost;

  useEffect(() => {
    // Fetch user and retrieve cart from session storage
    const fetchUserAndCart = async () => {
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
        
        // Get cart from session storage
        const cartData = sessionStorage.getItem('cart');
        
        if (!cartData || JSON.parse(cartData).length === 0) {
          toast({
            title: "Empty Cart",
            description: "Your cart is empty. Add products to your cart before checkout.",
            variant: "destructive"
          });
          window.location.href = '/buyer/marketplace';
          return;
        }
        
        const parsedCart = JSON.parse(cartData);
        setCart(parsedCart);
        
        // Pre-fill shipping info with user data if available
        if (userData.name || userData.email) {
          setShippingInfo(prev => ({
            ...prev,
            fullName: userData.name || prev.fullName,
            email: userData.email || prev.email
          }));
        }
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
    
    fetchUserAndCart();
  }, [toast]);

  const handleShippingInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeliveryMethodChange = (value: string) => {
    setShippingInfo(prev => ({
      ...prev,
      deliveryMethod: value
    }));
  };

  const validateShippingForm = () => {
    const { fullName, email, address, city, state, zipCode, phone } = shippingInfo;
    
    if (!fullName || !email || !address || !city || !state || !zipCode || !phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all shipping details",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const proceedToPayment = async () => {
    if (!validateShippingForm()) return;
    
    try {
      setIsLoading(true);
      
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: orderTotal }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }
      
      const data = await response.json();
      setClientSecret(data.clientSecret);
      setStep('payment');
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Clear cart from session storage
    sessionStorage.removeItem('cart');
    
    // Move to confirmation step
    setStep('confirmation');
  };

  const backToMarketplace = () => {
    window.location.href = '/buyer/marketplace';
  };

  const viewOrders = () => {
    window.location.href = '/buyer/orders';
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
        <Button onClick={() => window.location.href = '/buyer/marketplace'}>
          Return to Marketplace
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
            <h1 className="text-2xl font-bold">Checkout</h1>
            {step === 'shipping' && <p className="text-muted-foreground">Enter your shipping information</p>}
            {step === 'payment' && <p className="text-muted-foreground">Complete your payment</p>}
            {step === 'confirmation' && <p className="text-muted-foreground">Your order has been placed</p>}
          </div>
          
          {step !== 'confirmation' && (
            <Button 
              variant="outline" 
              onClick={backToMarketplace} 
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main checkout form column */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="pt-6">
                {/* Shipping Information Step */}
                {step === 'shipping' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Shipping Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input 
                          id="fullName" 
                          name="fullName" 
                          value={shippingInfo.fullName}
                          onChange={handleShippingInfoChange}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email"
                          value={shippingInfo.email}
                          onChange={handleShippingInfoChange}
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input 
                          id="address" 
                          name="address" 
                          value={shippingInfo.address}
                          onChange={handleShippingInfoChange}
                          placeholder="123 Main St"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input 
                          id="city" 
                          name="city" 
                          value={shippingInfo.city}
                          onChange={handleShippingInfoChange}
                          placeholder="New York"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input 
                          id="state" 
                          name="state" 
                          value={shippingInfo.state}
                          onChange={handleShippingInfoChange}
                          placeholder="NY"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input 
                          id="zipCode" 
                          name="zipCode" 
                          value={shippingInfo.zipCode}
                          onChange={handleShippingInfoChange}
                          placeholder="10001"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          value={shippingInfo.phone}
                          onChange={handleShippingInfoChange}
                          placeholder="(555) 123-4567"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Delivery Method</Label>
                      <RadioGroup 
                        value={shippingInfo.deliveryMethod} 
                        onValueChange={handleDeliveryMethodChange}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div className="flex items-center justify-between space-x-2 border p-4 rounded-md">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="standard" id="standard" />
                            <Label htmlFor="standard">Standard Delivery</Label>
                          </div>
                          <span className="font-medium">Ksh5.00</span>
                        </div>
                        
                        <div className="flex items-center justify-between space-x-2 border p-4 rounded-md">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="express" id="express" />
                            <Label htmlFor="express">Express Delivery</Label>
                          </div>
                          <span className="font-medium">Ksh10.00</span>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={proceedToPayment}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Continue to Payment'
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Payment Step */}
                {step === 'payment' && clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm 
                      clientSecret={clientSecret} 
                      orderTotal={orderTotal} 
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                )}
                
                {/* Confirmation Step */}
                {step === 'confirmation' && (
                  <div className="flex flex-col items-center py-12">
                    <div className="rounded-full bg-green-100 p-4 mb-4">
                      <CheckCircle className="h-16 w-16 text-green-600" />
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-2">Order Complete!</h2>
                    <p className="text-center text-muted-foreground mb-6">
                      Thank you for your purchase. Your order has been received and is being processed.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                      <Button variant="outline" onClick={backToMarketplace}>
                        Continue Shopping
                      </Button>
                      <Button onClick={viewOrders}>
                        View Orders
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Order summary column */}
          {step !== 'confirmation' && (
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} x Ksh{item.price.toFixed(2)}
                          </div>
                        </div>
                        <div className="font-medium">
                          Ksh{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>Ksh{subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>Ksh{shippingCost.toFixed(2)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>Ksh{orderTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}