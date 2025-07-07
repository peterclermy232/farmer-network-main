import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Sprout, LogOut } from "lucide-react";
import {
  ChevronRight,
  LayoutDashboard,
  Store,
  ShoppingCart,
  LineChart,
  Users,
  Settings,
  User,
  PackageSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();

  const farmerNavItems: NavItem[] = [
    { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, href: "/farmer/dashboard" },
    { label: "My Produce", icon: <Store className="h-5 w-5" />, href: "/farmer/produce" },
    { label: "Orders", icon: <ShoppingCart className="h-5 w-5" />, href: "/farmer/orders" },
    { label: "Market Prices", icon: <LineChart className="h-5 w-5" />, href: "/farmer/market-prices" },
    { label: "My Profile", icon: <User className="h-5 w-5" />, href: "/farmer/profile" },
  ];

  const buyerNavItems: NavItem[] = [
    { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, href: "/buyer/dashboard" },
    { label: "Marketplace", icon: <Store className="h-5 w-5" />, href: "/buyer/marketplace" },
    { label: "My Orders", icon: <ShoppingCart className="h-5 w-5" />, href: "/buyer/orders" },
    { label: "My Profile", icon: <User className="h-5 w-5" />, href: "/buyer/profile" },
  ];

  const adminNavItems: NavItem[] = [
    { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, href: "/admin/dashboard" },
    { label: "User Management", icon: <Users className="h-5 w-5" />, href: "/admin/users" },
    { label: "Market Data", icon: <LineChart className="h-5 w-5" />, href: "/admin/market-data" },
  ];

  const navItems = user?.role === "farmer" 
    ? farmerNavItems 
    : user?.role === "buyer" 
      ? buyerNavItems 
      : adminNavItems;

  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.username.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="hidden md:flex flex-col h-full bg-white border-r">
      <div className="p-4 border-b">
        <div className="flex items-center">
          <Sprout className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-bold text-gray-900">Farmers Market</h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-6">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary bg-opacity-20 flex items-center justify-center text-primary">
              <span className="text-sm font-medium">{userInitials}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name || user?.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={`w-full justify-start ${
                  isActive
                    ? "bg-primary bg-opacity-10 text-primary"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => navigate(item.href)}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
              </Button>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-gray-600 hover:bg-gray-100"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-5 w-5 mr-3" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </aside>
  );
}
