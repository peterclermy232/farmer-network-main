import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import { Order } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2,
  Search,
  Package,
  ExternalLink,
  Clock,
  CheckCircle,
  ShoppingCart,
  AlertCircle
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function BuyerOrders() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Fetch buyer's orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user?.id,
  });

  // Get order details
  const { data: orderDetails, isLoading: isLoadingOrderDetails } = useQuery({
    queryKey: ["/api/orders", selectedOrderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${selectedOrderId}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      return res.json();
    },
    enabled: selectedOrderId !== null,
  });

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = searchTerm === "" || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Shipped</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-8 w-8 text-yellow-500" />;
      case "shipped":
        return <Package className="h-8 w-8 text-blue-500" />;
      case "delivered":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "cancelled":
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <ShoppingCart className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <Layout 
      title="My Orders"
      subtitle="Track and manage your purchases"
    >
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search by order number..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your filters or search term"
              : "You haven't placed any orders yet"}
          </p>
          <Button onClick={() => window.location.href = "/buyer/marketplace"}>
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-start space-x-4">
                  <div>
                    {getStatusIcon(order.status)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      Ordered on {format(new Date(order.createdAt), "MMMM d, yyyy")}
                    </p>
                    <p className="font-medium">Total: Ksh{order.total.toFixed(2)}</p>
                    {order.status === "shipped" && (
                      <p className="text-sm text-blue-600">Estimated delivery: 2-3 days</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      Order Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Order Details</DialogTitle>
                      <DialogDescription>
                        Complete information about your order.
                      </DialogDescription>
                    </DialogHeader>
                    
                    {isLoadingOrderDetails ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : orderDetails ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Order Number</p>
                            <p className="text-base font-semibold">{orderDetails.orderNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Date</p>
                            <p className="text-base">
                              {format(new Date(orderDetails.createdAt), "MMM dd, yyyy")}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Status</p>
                            <p className="text-base">{getStatusBadge(orderDetails.status)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Total</p>
                            <p className="text-base font-semibold">Ksh{orderDetails.total.toFixed(2)}</p>
                          </div>
                        </div>

                        <Card>
                          <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Product</TableHead>
                                  <TableHead>Quantity</TableHead>
                                  <TableHead>Price</TableHead>
                                  <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {orderDetails.items?.map((item: any, index: number) => (
                                  <TableRow key={index}>
                                    <TableCell>{item.productName || `Product #${item.productId}`}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>Ksh{item.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                      Ksh{(item.quantity * item.price).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                )) || (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                      No items available
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                        <DialogFooter>
                          {orderDetails.status === "delivered" && (
                            <Button className="w-full">
                              <CheckCircle className="mr-2 h-4 w-4" /> Write a Review
                            </Button>
                          )}
                          {orderDetails.status === "shipped" && (
                            <Button className="w-full">
                              <ExternalLink className="mr-2 h-4 w-4" /> Track Package
                            </Button>
                          )}
                        </DialogFooter>
                      </>
                    ) : (
                      <p className="text-center py-4 text-red-500">Failed to load order details</p>
                    )}
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
