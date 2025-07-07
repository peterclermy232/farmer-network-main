import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import StatsCard from "@/components/common/stats-card";
import { useQuery } from "@tanstack/react-query";
import { 
  User, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Store, 
  UserX, 
  Users, 
  ShoppingBag,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  CircleDollarSign
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Mock data for sales chart
const salesData = [
  { name: "Jan", value: 1200 },
  { name: "Feb", value: 1900 },
  { name: "Mar", value: 2400 },
  { name: "Apr", value: 1800 },
  { name: "May", value: 2800 },
  { name: "Jun", value: 3200 },
  { name: "Jul", value: 3800 },
];

// Mock data for user growth
const userGrowthData = [
  { name: "Jan", farmers: 15, buyers: 45 },
  { name: "Feb", farmers: 20, buyers: 60 },
  { name: "Mar", farmers: 25, buyers: 78 },
  { name: "Apr", farmers: 27, buyers: 90 },
  { name: "May", farmers: 30, buyers: 110 },
  { name: "Jun", farmers: 35, buyers: 130 },
  { name: "Jul", farmers: 40, buyers: 150 },
];

// Mock data for order status distribution
const orderStatusData = [
  { name: "Pending", value: 15 },
  { name: "Shipped", value: 30 },
  { name: "Delivered", value: 45 },
  { name: "Cancelled", value: 10 },
];

const COLORS = ["#FFC107", "#2196F3", "#4CAF50", "#F44336"];

export default function AdminDashboard() {
  const { user } = useAuth();

  // Fetch all users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });

  // Fetch all products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  // Fetch all orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Calculate stats
  const totalUsers = users.length;
  const activeFarmers = users.filter(u => u.role === "farmer").length;
  const totalProducts = products.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  // Get recent activities
  const recentActivities = [
    {
      id: 1,
      type: "user_registered",
      subject: "James Wilson",
      time: "2 hours ago",
      icon: <User className="h-4 w-4" />,
      iconBg: "bg-primary-light"
    },
    {
      id: 2,
      type: "order_placed",
      subject: "Order #ORD-4821",
      time: "4 hours ago",
      icon: <ShoppingCart className="h-4 w-4" />,
      iconBg: "bg-secondary-light"
    },
    {
      id: 3,
      type: "product_added",
      subject: "Green Valley Farms",
      time: "Yesterday",
      description: "added 5 new products",
      icon: <Store className="h-4 w-4" />,
      iconBg: "bg-accent-light"
    },
    {
      id: 4,
      type: "order_cancelled",
      subject: "Order #ORD-4818",
      time: "Yesterday",
      icon: <AlertCircle className="h-4 w-4" />,
      iconBg: "bg-error bg-opacity-20"
    },
    {
      id: 5,
      type: "market_prices_updated",
      subject: "Market prices",
      time: "2 days ago",
      icon: <CheckCircle className="h-4 w-4" />,
      iconBg: "bg-success bg-opacity-20"
    }
  ];

  return (
    <Layout 
      title="Admin Dashboard"
      subtitle="Platform overview and management"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Users"
          value={totalUsers}
          icon={<User className="h-5 w-5" />}
          trend={{ value: "12%", positive: true, text: "from last month" }}
        />
        
        <StatsCard
          title="Active Farmers"
          value={activeFarmers}
          icon={<Package className="h-5 w-5" />}
          trend={{ value: "8%", positive: true, text: "from last month" }}
          iconBgColor="bg-amber-100 text-amber-600"
        />
        
        <StatsCard
          title="Total Products"
          value={totalProducts}
          icon={<Store className="h-5 w-5" />}
          trend={{ value: "15%", positive: true, text: "from last month" }}
          iconBgColor="bg-green-100 text-green-600"
        />
        
        <StatsCard
          title="Monthly Revenue"
          value={`Ksh${totalRevenue.toFixed(2)}`}
          icon={<DollarSign className="h-5 w-5" />}
          trend={{ value: "23%", positive: true, text: "from last month" }}
          iconBgColor="bg-blue-100 text-blue-600"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly sales performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Ksh${value}`, 'Revenue']} />
                  <Legend />
                  <Bar dataKey="value" fill="#4CAF50" name="Monthly Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Farmers and buyers growth trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="farmers" stroke="#FF9800" name="Farmers" />
                  <Line type="monotone" dataKey="buyers" stroke="#2196F3" name="Buyers" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 rounded-full ${activity.iconBg} flex items-center justify-center text-white`}>
                      {activity.icon}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-900">
                      {activity.type === "user_registered" && (
                        <>New user <span className="font-medium">{activity.subject}</span> registered</>
                      )}
                      {activity.type === "order_placed" && (
                        <><span className="font-medium">{activity.subject}</span> was placed</>
                      )}
                      {activity.type === "product_added" && (
                        <><span className="font-medium">{activity.subject}</span> {activity.description}</>
                      )}
                      {activity.type === "order_cancelled" && (
                        <><span className="font-medium">{activity.subject}</span> was cancelled</>
                      )}
                      {activity.type === "market_prices_updated" && (
                        <><span className="font-medium">{activity.subject}</span> updated</>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <Button variant="link" size="sm">View all activities</Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Current status of all orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Orders']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Quick Access */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <Button size="sm">
            <User className="mr-2 h-4 w-4" /> Add User
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.slice(0, 3).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center text-white mr-3">
                          <span className="text-xs font-medium">
                            {user.name 
                              ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
                              : user.username.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name || user.username}</p>
                          <p className="text-xs text-gray-500">{user.email || 'No email'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex space-x-2 justify-end">
                        <Button variant="ghost" size="icon">
                          <User className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <UserX className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-4 text-right">
            <Button variant="link" onClick={() => window.location.href = "/admin/users"}>
              Manage all users
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Market Price Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Market Price Management</CardTitle>
          <Button size="sm">
            <CircleDollarSign className="mr-2 h-4 w-4" /> Update Prices
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Previous Price</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Tomatoes</TableCell>
                <TableCell>Vegetables</TableCell>
                <TableCell>Ksh2.50/kg</TableCell>
                <TableCell>Ksh2.30/kg</TableCell>
                <TableCell className="text-green-600">+8%</TableCell>
                <TableCell>Aug 15, 2023</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Potatoes</TableCell>
                <TableCell>Vegetables</TableCell>
                <TableCell>Ksh1.75/kg</TableCell>
                <TableCell>Ksh1.68/kg</TableCell>
                <TableCell className="text-green-600">+4%</TableCell>
                <TableCell>Aug 15, 2023</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Onions</TableCell>
                <TableCell>Vegetables</TableCell>
                <TableCell>Ksh1.20/kg</TableCell>
                <TableCell>Ksh1.24/kg</TableCell>
                <TableCell className="text-red-600">-3%</TableCell>
                <TableCell>Aug 15, 2023</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="mt-4 text-right">
            <Button variant="link" onClick={() => window.location.href = "/admin/market-data"}>
              Manage all market prices
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
