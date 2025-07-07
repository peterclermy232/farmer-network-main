import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Store, 
  ShoppingCart, 
  LineChart, 
  Users, 
  User,
  Settings 
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

export default function MobileNav() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  const farmerNavItems: NavItem[] = [
    { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, href: "/farmer/dashboard" },
    { label: "Produce", icon: <Store className="h-5 w-5" />, href: "/farmer/produce" },
    { label: "Orders", icon: <ShoppingCart className="h-5 w-5" />, href: "/farmer/orders" },
    { label: "Profile", icon: <User className="h-5 w-5" />, href: "/farmer/profile" },
  ];

  const buyerNavItems: NavItem[] = [
    { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, href: "/buyer/dashboard" },
    { label: "Market", icon: <Store className="h-5 w-5" />, href: "/buyer/marketplace" },
    { label: "Orders", icon: <ShoppingCart className="h-5 w-5" />, href: "/buyer/orders" },
    { label: "Profile", icon: <User className="h-5 w-5" />, href: "/buyer/profile" },
  ];

  const adminNavItems: NavItem[] = [
    { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, href: "/admin/dashboard" },
    { label: "Users", icon: <Users className="h-5 w-5" />, href: "/admin/users" },
    { label: "Market", icon: <LineChart className="h-5 w-5" />, href: "/admin/market-data" },
    { label: "Settings", icon: <Settings className="h-5 w-5" />, href: "/admin/settings" },
  ];

  const navItems = user?.role === "farmer" 
    ? farmerNavItems 
    : user?.role === "buyer" 
      ? buyerNavItems 
      : adminNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="grid grid-cols-4 py-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <button
              key={item.href}
              className={`flex flex-col items-center justify-center py-2 ${
                isActive ? "text-primary" : "text-gray-600"
              }`}
              onClick={() => navigate(item.href)}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
