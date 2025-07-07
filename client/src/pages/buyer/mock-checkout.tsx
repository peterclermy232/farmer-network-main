import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Store, ChevronRight, CreditCard, ArrowLeft, CheckCircle, Wallet } from "lucide-react";
import { Product } from "@shared/schema";

interface CartItem extends Product {
  quantity: number;
}

export default function MockCheckoutPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const [showCardDetails, setShowCardDetails] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'applepay'>('card');
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    deliveryMethod: 'standard',
    deliveryDate: '',
    deliveryTimeSlot: 'morning'
  });
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
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
          // If no cart items in session storage, check if we have mock products to create a sample cart
          const productsResponse = await fetch('/api/products', {
            credentials: 'include'
          });
          
          if (productsResponse.ok) {
            const products = await productsResponse.json();
            
            if (products.length > 0) {
              // Create a sample cart with 1 or 2 products
              const sampleCart = products.slice(0, Math.min(2, products.length)).map(product => ({
                ...product,
                quantity: 1
              }));
              setCart(sampleCart);
              sessionStorage.setItem('cart', JSON.stringify(sampleCart));
            } else {
              toast({
                title: "Empty Cart",
                description: "Your cart is empty. Add products to your cart before checkout.",
                variant: "destructive"
              });
              window.location.href = '/buyer/marketplace';
              return;
            }
          } else {
            toast({
              title: "Empty Cart",
              description: "Your cart is empty. Add products to your cart before checkout.",
              variant: "destructive"
            });
            window.location.href = '/buyer/marketplace';
            return;
          }
        } else {
          const parsedCart = JSON.parse(cartData);
          setCart(parsedCart);
        }
        
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

  const handleCardInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      // Format card number input 
      const formattedValue = value
        .replace(/\D/g, '')
        .replace(/(.{4})/g, 'Ksh1 ')
        .trim()
        .substring(0, 19);
      
      setCardInfo(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else if (name === 'expiryDate') {
      // Format expiry date (MM/YY)
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      
      if (cleaned.length > 2) {
        formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
      }
      
      setCardInfo(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else if (name === 'cvv') {
      // Only allow numbers with max length 4
      const formatted = value.replace(/\D/g, '').substring(0, 4);
      
      setCardInfo(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else {
      setCardInfo(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return false;
    }
    
    // Validate phone (simple check)
    if (phone.length < 9) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const validateCardInfo = () => {
    const { cardNumber, cardName, expiryDate, cvv } = cardInfo;
    
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      toast({
        title: "Missing Information",
        description: "Please fill in all card details",
        variant: "destructive"
      });
      return false;
    }
    
    // Check card number (remove spaces)
    if (cardNumber.replace(/\s/g, '').length < 16) {
      toast({
        title: "Invalid Card Number",
        description: "Please enter a valid card number",
        variant: "destructive"
      });
      return false;
    }
    
    // Check expiry date
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(expiryDate)) {
      toast({
        title: "Invalid Expiry Date",
        description: "Please enter a valid expiry date (MM/YY)",
        variant: "destructive"
      });
      return false;
    }
    
    // Check CVV
    if (cvv.length < 3) {
      toast({
        title: "Invalid CVV",
        description: "Please enter a valid security code",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const proceedToPayment = () => {
    if (!validateShippingForm()) return;
    setStep('payment');
  };

  const handlePayment = async () => {
    // Skip validation for demo purposes
    setPaymentLoading(true);
    
    try {
      // In a real app, create an order first and then pay for it
      // Here we'll simulate both steps
      
      // 1. Create mock order (in a real app, we'd send the cart items to the server)
      const mockOrderId = Math.floor(Math.random() * 10000); // Would normally come from the server
      
      // 2. Make API request to pay for the order
      const paymentResponse = await fetch(`/api/buyer/orders/${mockOrderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentMethod: paymentMethod || 'card', // Default to card if not selected
          amount: orderTotal,
          shippingInfo: shippingInfo
        })
      });
      
      if (!paymentResponse.ok) {
        // If server API fails, proceed with mock success anyway (for demo purposes)
        console.warn('Payment API failed, but continuing with mock success');
      } else {
        const paymentData = await paymentResponse.json();
        console.log('Payment successful:', paymentData);
      }
      
      // Clear cart from session storage
      sessionStorage.removeItem('cart');
      
      // Move to confirmation step
      setStep('confirmation');
      
      toast({
        title: "Payment Successful",
        description: "Your order has been placed successfully! The farmer will be notified.",
      });
    } catch (err) {
      console.error('Payment error:', err);
      toast({
        title: "Payment Processing",
        description: "Payment is being processed. You'll receive a notification when confirmed.",
      });
      
      // For demo purposes, still show success
      sessionStorage.removeItem('cart');
      setStep('confirmation');
    } finally {
      setPaymentLoading(false);
    }
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
                    
                    <div className="space-y-3 border p-4 rounded-md">
                      <h3 className="font-medium mb-2">Schedule Delivery</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="deliveryDate">Preferred Delivery Date</Label>
                        <Input 
                          id="deliveryDate" 
                          name="deliveryDate" 
                          type="date"
                          value={shippingInfo.deliveryDate}
                          onChange={handleShippingInfoChange}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                        <p className="text-xs text-muted-foreground">Select a date at least 24 hours from now</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="deliveryTimeSlot">Preferred Time Slot</Label>
                        <select 
                          id="deliveryTimeSlot" 
                          name="deliveryTimeSlot" 
                          value={shippingInfo.deliveryTimeSlot}
                          onChange={handleShippingInfoChange as any}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                          required
                        >
                          <option value="morning">Morning (8am - 12pm)</option>
                          <option value="afternoon">Afternoon (12pm - 4pm)</option>
                          <option value="evening">Evening (4pm - 8pm)</option>
                        </select>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={proceedToPayment}
                    >
                      Continue to Payment
                    </Button>
                  </div>
                )}
                
                {/* Payment Step */}
                {step === 'payment' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Payment Method</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div 
                        className="flex items-center justify-between space-x-2 border p-4 rounded-md bg-primary/5"
                        onClick={() => {
                          setPaymentMethod('card');
                          setShowCardDetails(true);
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="h-4 w-4 rounded-full border border-primary bg-primary"></div>
                          <Label htmlFor="card" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Credit/Debit Card
                          </Label>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2 border p-4 rounded-md opacity-60">
                        <div className="flex items-center space-x-2">
                          <div className="h-4 w-4 rounded-full border"></div>
                          <Label htmlFor="paypal" className="flex items-center gap-2">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M19.5 8.25L16.5 13.5L13.5 8.25H19.5Z" fill="currentColor" />
                              <path d="M7.5 14.25L4.5 19.5L1.5 14.25H7.5Z" fill="currentColor" />
                              <path d="M21 5.25H12V21.75H21V5.25Z" fill="currentColor" />
                              <path d="M9 2.25H0V18.75H9V2.25Z" fill="currentColor" />
                            </svg>
                            PayPal
                          </Label>
                        </div>
                        <span className="text-xs text-muted-foreground">Coming Soon</span>
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2 border p-4 rounded-md opacity-60">
                        <div className="flex items-center space-x-2">
                          <div className="h-4 w-4 rounded-full border"></div>
                          <Label htmlFor="applepay" className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            Apple Pay
                          </Label>
                        </div>
                        <span className="text-xs text-muted-foreground">Coming Soon</span>
                      </div>
                    </div>
                    
                    {showCardDetails && (
                      <div className="space-y-4 mt-4 p-4 border rounded-md">
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input 
                            id="cardNumber" 
                            name="cardNumber" 
                            value={cardInfo.cardNumber}
                            onChange={handleCardInfoChange}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cardName">Name on Card</Label>
                          <Input 
                            id="cardName" 
                            name="cardName" 
                            value={cardInfo.cardName}
                            onChange={handleCardInfoChange}
                            placeholder="John Doe"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiryDate">Expiry Date</Label>
                            <Input 
                              id="expiryDate" 
                              name="expiryDate" 
                              value={cardInfo.expiryDate}
                              onChange={handleCardInfoChange}
                              placeholder="MM/YY"
                              maxLength={5}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="cvv">Security Code (CVV)</Label>
                            <Input 
                              id="cvv" 
                              name="cvv" 
                              value={cardInfo.cvv}
                              onChange={handleCardInfoChange}
                              placeholder="123"
                              maxLength={4}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between p-3 bg-muted/50 rounded">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold">Ksh{orderTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep('shipping')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      
                      <Button 
                        className="flex-1" 
                        onClick={handlePayment}
                        disabled={paymentLoading}
                      >
                        {paymentLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay Ksh{orderTotal.toFixed(2)}
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      <p>This is a mock payment system for demonstration purposes.</p>
                      <p>No real payment will be processed.</p>
                    </div>
                  </div>
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
                    
                    <div className="bg-gray-50 w-full max-w-md p-4 rounded-md mb-6">
                      <h3 className="font-medium mb-2">Order Summary</h3>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Order Number:</span>
                          <span className="font-medium">FM-{Math.floor(Math.random() * 10000)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Date:</span>
                          <span className="font-medium">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total:</span>
                          <span className="font-medium">Ksh{orderTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Payment Method:</span>
                          <span className="font-medium">Credit Card (Mock)</span>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3 mb-3">
                        <h4 className="font-medium mb-2 text-sm">Shipping Information</h4>
                        <p className="text-sm">{shippingInfo.fullName}</p>
                        <p className="text-sm">{shippingInfo.address}</p>
                        <p className="text-sm">{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
                        <p className="text-sm">{shippingInfo.phone}</p>
                      </div>
                      
                      <div className="border-t pt-3">
                        <h4 className="font-medium mb-2 text-sm">Delivery Schedule</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Delivery Method:</span>
                            <span className="font-medium">
                              {shippingInfo.deliveryMethod === 'express' ? 'Express Delivery' : 'Standard Delivery'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Delivery Date:</span>
                            <span className="font-medium">
                              {shippingInfo.deliveryDate || new Date(Date.now() + 86400000 * 2).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Time Slot:</span>
                            <span className="font-medium">
                              {shippingInfo.deliveryTimeSlot === 'morning' ? 'Morning (8am - 12pm)' : 
                               shippingInfo.deliveryTimeSlot === 'afternoon' ? 'Afternoon (12pm - 4pm)' : 
                               'Evening (4pm - 8pm)'}
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          You will receive notifications when your order is confirmed, shipped, and out for delivery.
                        </p>
                      </div>
                    </div>
                    
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