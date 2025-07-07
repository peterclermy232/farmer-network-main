import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AuthTestPage from "@/pages/auth-test-page";
import SimpleAuthPage from "@/pages/simple-auth";
import SimpleFarmerDashboard from "@/pages/farmer/simple-dashboard";
import SimpleBuyerDashboard from "@/pages/buyer/simple-dashboard";
import SimpleAdminDashboard from "@/pages/admin/simple-dashboard";
import ProduceManagement from "@/pages/farmer/produce-management";
import OrderManagement from "@/pages/farmer/order-management";
import Marketplace from "@/pages/buyer/marketplace";
import MockCheckoutPage from "@/pages/buyer/mock-checkout";
import OrderHistory from "@/pages/buyer/order-history";
import OrderTracking from "@/pages/buyer/order-tracking";
import ProfileEditPage from "@/pages/profile-edit";
import { Redirect } from "wouter";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Simple component to handle fallback state
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Simple homepage that redirects
const HomePage = () => <Redirect to="/auth" />;

function Router() {
  return (
    <Suspense fallback={<Loading />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={SimpleAuthPage} />
        <Route path="/auth-test" component={AuthTestPage} />
        
        {/* Farmer Routes */}
        <Route path="/farmer/dashboard" component={SimpleFarmerDashboard} />
        <Route path="/farmer/produce" component={ProduceManagement} />
        <Route path="/farmer/orders" component={OrderManagement} />
        <Route path="/farmer/market-prices" component={SimpleFarmerDashboard} />
        <Route path="/farmer/profile" component={ProfileEditPage} />
        
        {/* Buyer Routes */}
        <Route path="/buyer/dashboard" component={SimpleBuyerDashboard} />
        <Route path="/buyer/marketplace" component={Marketplace} />
        <Route path="/buyer/orders" component={OrderHistory} />
        <Route path="/buyer/checkout" component={MockCheckoutPage} />
        <Route path="/buyer/order-tracking" component={OrderTracking} />
        <Route path="/buyer/order-tracking/:id" component={OrderTracking} />
        <Route path="/buyer/profile" component={ProfileEditPage} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" component={SimpleAdminDashboard} />
        <Route path="/admin/users" component={SimpleAdminDashboard} />
        <Route path="/admin/market-data" component={SimpleAdminDashboard} />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return <Router />;
}

export default App;
