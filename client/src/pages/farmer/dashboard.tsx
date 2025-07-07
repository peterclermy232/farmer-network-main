import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import StatsCard from "@/components/common/stats-card";
import MarketPriceTable from "@/components/common/market-price-table";
import OrderTable from "@/components/common/order-table";
import { 
  DollarSign, 
  Store, 
  ShoppingCart, 
  PlusCircle, 
  Tag, 
  Truck, 
  BarChart,
  FileText,
  Newspaper,
  Video,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Product, Order } from "@shared/schema";

export default function FarmerDashboard() {
  const { user } = useAuth();
  
  const { data: products } = useQuery<Product[]>({
    queryKey: [`/api/farmers/${user?.id}/products`],
    enabled: !!user?.id,
  });
  
  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user?.id,
  });

  // Calculate stats
  const activeListings = products?.length || 0;
  const totalSales = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
  const pendingOrders = orders?.filter(order => order.status === "pending").length || 0;

  return (
    <Layout 
      title={`Welcome, ${user?.name?.split(' ')[0] || user?.username}!`}
      subtitle="Here's an overview of your farming business."
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Sales"
          value={`Ksh${totalSales.toFixed(2)}`}
          icon={<DollarSign className="h-5 w-5" />}
          trend={{ value: "12%", positive: true, text: "from last month" }}
        />
        
        <StatsCard
          title="Active Listings"
          value={activeListings}
          icon={<Store className="h-5 w-5" />}
          trend={{ value: "3", positive: true, text: "new listings this week" }}
          iconBgColor="bg-amber-100 text-amber-600"
        />
        
        <StatsCard
          title="Pending Orders"
          value={pendingOrders}
          icon={<ShoppingCart className="h-5 w-5" />}
          trend={{ value: "", positive: true, text: "Needs your attention" }}
          iconBgColor="bg-green-100 text-green-600"
        />
      </div>
      
      {/* Market Price Trends */}
      <div className="mb-6">
        <MarketPriceTable />
      </div>
      
      {/* Recent Orders */}
      <div className="mb-6">
        <OrderTable />
      </div>
      
      {/* Quick Actions and Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-auto">
                <PlusCircle className="h-8 w-8 text-primary mb-2" />
                <span>Add Produce</span>
              </Button>
              
              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-auto">
                <Tag className="h-8 w-8 text-amber-500 mb-2" />
                <span>Update Prices</span>
              </Button>
              
              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-auto">
                <Truck className="h-8 w-8 text-green-500 mb-2" />
                <span>Track Shipment</span>
              </Button>
              
              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-auto">
                <BarChart className="h-8 w-8 text-gray-700 mb-2" />
                <span>Sales Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tips & Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start text-left h-auto p-3">
                <FileText className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium">Maximizing Crop Yield</p>
                  <p className="text-xs text-gray-500">Learn techniques to increase your production</p>
                </div>
              </Button>
              
              <Button variant="outline" className="w-full justify-start text-left h-auto p-3">
                <Video className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium">Organic Pest Control</p>
                  <p className="text-xs text-gray-500">Video guide on natural pest management</p>
                </div>
              </Button>
              
              <Button variant="outline" className="w-full justify-start text-left h-auto p-3">
                <Calendar className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium">Upcoming Market Events</p>
                  <p className="text-xs text-gray-500">Local farmer gatherings and expos</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
