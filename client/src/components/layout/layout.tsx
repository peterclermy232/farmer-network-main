import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { Menu, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import NotificationCenter from "../common/notification-center";

interface LayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center">
            <Sprout className="h-5 w-5 text-primary mr-2" />
            <h1 className="text-lg font-semibold text-gray-900">Farmers Market</h1>
          </div>
          <NotificationCenter userRole={user?.role || 'buyer'} />
        </div>
      </header>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0">
          <div className="h-full">
            <Sidebar />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="h-screen sticky top-0">
            <Sidebar />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 pt-16 md:pt-0 pb-16 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600">{subtitle}</p>}
            </div>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
// gggggh