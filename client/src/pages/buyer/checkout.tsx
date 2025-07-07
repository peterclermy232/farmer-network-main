import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/layout';
import { useAuth } from '@/hooks/use-auth';


// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ amount, onSuccess }: { amount: number, onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setIsProcessing(true);
    setErrorMessage(undefined);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/buyer/orders',
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message);
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      toast({
        title: "Payment Successful",
        description: "Thank you for your purchase!",
      });
      onSuccess();
    } else {
      setErrorMessage('An unexpected error occurred.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && (
        <div className="text-destructive text-sm mt-2">{errorMessage}</div>
      )}
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay Ksh${(amount / 100).toFixed(2)}`
        )}
      </Button>
    </form>
  );
};

function CheckoutContent() {
  const [searchParams] = useLocation();
  const params = new URLSearchParams(searchParams);
  const amountParam = params.get('amount');
  const amount = amountParam ? parseInt(amountParam, 10) : 0;
  const orderItems = params.get('items');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Extract the navigate function from useLocation
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!amount) {
      toast({
        title: "Invalid amount",
        description: "Please select products before checking out",
        variant: "destructive"
      });
      navigate('/buyer/marketplace');
      return;
    }

    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          amount: amount, // Amount is already in cents
          items: orderItems ? JSON.parse(orderItems) : []
        });
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message);
        }
        
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: "Error creating payment",
          description: error.message || "Please try again later",
          variant: "destructive"
        });
        navigate('/buyer/marketplace');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, orderItems, navigate, toast]);

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    setTimeout(() => {
      navigate('/buyer/orders');
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-destructive text-lg">Unable to initialize payment.</p>
        <Button className="mt-4" onClick={() => navigate('/buyer/marketplace')}>
          Return to Marketplace
        </Button>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: 'hsl(var(--primary))',
      colorBackground: 'hsl(var(--card))',
      colorText: 'hsl(var(--card-foreground))',
      colorDanger: 'hsl(var(--destructive))',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <Card className="max-w-xl w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Complete your purchase</CardTitle>
        <CardDescription>
          Secure payment processing by Stripe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <div className="flex justify-between mb-2">
            <span>Order total:</span>
            <span className="font-semibold">Ksh{(amount / 100).toFixed(2)}</span>
          </div>
        </div>
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm amount={amount} onSuccess={handlePaymentSuccess} />
        </Elements>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <p className="text-sm text-muted-foreground text-center">
          Your payment information is securely processed by Stripe. We don't store your card details.
        </p>
      </CardFooter>
    </Card>
  );
}

export default function CheckoutPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Handle authentication state
  useEffect(() => {
    // Simple authentication check
    if (!isLoading && (!user || user.role !== 'buyer')) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  // We only render the actual content if user is authenticated as a buyer
  if (!user || user.role !== 'buyer') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive text-lg mb-4">You need to be logged in as a buyer to access this page.</p>
          <Button onClick={() => navigate('/auth')}>Go to Login</Button>
        </div>
      </div>
    );
  }
  
  return (
    <Layout title="Checkout" subtitle="Complete your purchase securely">
      <CheckoutContent />
    </Layout>
  );
}