import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, Users, ShieldCheck, BarChart, Settings } from "lucide-react";

export default function SimpleAdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFarmers: 0,
    totalBuyers: 0,
    totalOrders: 0
  });

  useEffect(() => {
    // Fetch user info
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          window.location.href = '/auth';
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        
        if (userData.role !== 'admin') {
          window.location.href = `/${userData.role}/dashboard`;
          return;
        }
        
        setUser(userData);
        
        // Mock stats - in a real app, you'd fetch these from an API
        setStats({
          totalUsers: 45,
          totalFarmers: 15,
          totalBuyers: 30,
          totalOrders: 125
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

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
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        
        <nav className="space-y-2">
          <a 
            href="/admin/dashboard" 
            className="flex items-center p-2 rounded-md bg-primary/10 text-primary"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Dashboard
          </a>
          <a 
            href="/admin/users" 
            className="flex items-center p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Users
          </a>
          <a 
            href="/admin/market-data" 
            className="flex items-center p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Market Data
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
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user?.name || user?.username}</p>
          </div>
          
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="md:hidden"
          >
            Sign Out
          </Button>
        </div>
        
        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="mr-2 rounded-full p-2 bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Farmers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="mr-2 rounded-full p-2 bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold">{stats.totalFarmers}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Buyers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="mr-2 rounded-full p-2 bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold">{stats.totalBuyers}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="mr-2 rounded-full p-2 bg-primary/10">
                  <BarChart className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-medium">New User Registration</h3>
                <p className="text-sm text-muted-foreground">John Smith joined as a buyer</p>
                <span className="text-xs text-muted-foreground">Today at 12:15</span>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="font-medium">Market Price Updated</h3>
                <p className="text-sm text-muted-foreground">Apples price increased by 5%</p>
                <span className="text-xs text-muted-foreground">Yesterday at 10:30</span>
              </div>
              
              <div>
                <h3 className="font-medium">New Farmer Onboarded</h3>
                <p className="text-sm text-muted-foreground">Green Acres Farm completed registration</p>
                <span className="text-xs text-muted-foreground">Apr 16, 2025 at 14:20</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 flex gap-4">
          <Button asChild variant="outline">
            <a href="/admin/users">Manage Users</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/admin/market-data">View Market Data</a>
          </Button>
        </div>
      </div>
    </div>
  );
}