import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import { MarketPrice, insertMarketPriceSchema } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2,
  Search,
  Upload,
  DollarSign,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  BarChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Edit,
  RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Define form schema with validation rules
const marketPriceFormSchema = z.object({
  productName: z.string().min(2, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  previousPrice: z.coerce.number().optional(),
});

type MarketPriceFormValues = z.infer<typeof marketPriceFormSchema>;

export default function AdminMarketData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<MarketPrice | null>(null);
  const [isBatchUpdateDialogOpen, setIsBatchUpdateDialogOpen] = useState(false);

  // Fetch market prices
  const { data: marketPrices = [], isLoading } = useQuery<MarketPrice[]>({
    queryKey: ["/api/market-prices"],
  });

  // Update market price mutation
  const updateMarketPriceMutation = useMutation({
    mutationFn: async (data: MarketPriceFormValues & { id: number }) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PUT", `/api/market-prices/${id}`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/market-prices"] });
      toast({
        title: "Market price updated",
        description: "The price has been successfully updated.",
      });
      setIsUpdateDialogOpen(false);
      setSelectedPrice(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update market price",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create market price mutation
  const createMarketPriceMutation = useMutation({
    mutationFn: async (data: MarketPriceFormValues) => {
      const res = await apiRequest("POST", "/api/market-prices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/market-prices"] });
      toast({
        title: "Market price added",
        description: "A new market price has been added.",
      });
      setIsBatchUpdateDialogOpen(false);
      batchForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add market price",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form for updating market price
  const form = useForm<MarketPriceFormValues>({
    resolver: zodResolver(marketPriceFormSchema),
    defaultValues: {
      productName: "",
      category: "",
      price: 0,
      previousPrice: 0,
    },
  });

  // Form for batch updating/adding market prices
  const batchForm = useForm<MarketPriceFormValues>({
    resolver: zodResolver(marketPriceFormSchema),
    defaultValues: {
      productName: "",
      category: "Vegetables",
      price: 0,
    },
  });

  // Filter market prices
  const filteredPrices = marketPrices.filter((price) => {
    const matchesSearch = searchTerm === "" || 
      price.productName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "All Categories" || 
      price.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ["All Categories", ...new Set(marketPrices.map(price => price.category))];

  // Calculate percentage change
  const getPercentChange = (current: number, previous: number | null) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Handle edit button click
  const handleEdit = (price: MarketPrice) => {
    setSelectedPrice(price);
    form.reset({
      productName: price.productName,
      category: price.category,
      price: price.price,
      previousPrice: price.previousPrice || undefined,
    });
    setIsUpdateDialogOpen(true);
  };

  // Handle form submission (update price)
  const onSubmitUpdate = (data: MarketPriceFormValues) => {
    if (selectedPrice) {
      updateMarketPriceMutation.mutate({ 
        ...data, 
        id: selectedPrice.id,
      });
    }
  };

  // Handle batch add form submission
  const onSubmitBatchAdd = (data: MarketPriceFormValues) => {
    createMarketPriceMutation.mutate(data);
  };

  // Prepare chart data for the last 7 prices (or all if less than 7)
  const chartData = filteredPrices
    .slice(-7)  // Get the last 7 entries
    .map(price => ({
      name: price.productName,
      currentPrice: price.price,
      previousPrice: price.previousPrice || null,
    }));

  return (
    <Layout 
      title="Market Price Management"
      subtitle="Track and update current market prices"
    >
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={() => setIsBatchUpdateDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Add Market Price
          </Button>
        </div>
      </div>

      {/* Price Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Market Price Trends</CardTitle>
          <CardDescription>Recent price changes by product</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <LineChart className="h-12 w-12 mb-2" />
                <p>No price data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Ksh${value}`, 'Price']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="currentPrice" 
                    stroke="#4CAF50" 
                    activeDot={{ r: 8 }} 
                    name="Current Price" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="previousPrice" 
                    stroke="#FF9800" 
                    strokeDasharray="5 5" 
                    name="Previous Price" 
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Market Prices Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Market Prices</CardTitle>
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/market-prices"] })}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPrices.length === 0 ? (
            <div className="py-12 text-center">
              <BarChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No price data found</h3>
              <p className="text-gray-500">
                {searchTerm || categoryFilter !== "All Categories"
                  ? "Try adjusting your filters or search term"
                  : "Start by adding market prices to the system"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>Previous Price</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrices.map((price) => {
                  const percentChange = getPercentChange(price.price, price.previousPrice || null);
                  const isPositive = percentChange > 0;
                  const isNeutral = percentChange === 0;
                  
                  return (
                    <TableRow key={price.id}>
                      <TableCell className="font-medium">{price.productName}</TableCell>
                      <TableCell>{price.category}</TableCell>
                      <TableCell>Ksh{price.price.toFixed(2)}/kg</TableCell>
                      <TableCell>
                        {price.previousPrice ? `Ksh${price.previousPrice.toFixed(2)}/kg` : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            isNeutral
                              ? "text-gray-500"
                              : isPositive
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {isNeutral
                            ? "0%"
                            : `${isPositive ? "+" : ""}${percentChange.toFixed(1)}%`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {isNeutral ? (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 flex items-center">
                              <MinusIcon className="h-3 w-3 mr-1" /> Stable
                            </Badge>
                          ) : isPositive ? (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1" /> Rising
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center">
                              <TrendingDown className="h-3 w-3 mr-1" /> Falling
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(price.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(price)}
                        >
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Update Price Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Market Price</DialogTitle>
            <DialogDescription>
              Update the current market price for this product.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Tomatoes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Vegetables">Vegetables</SelectItem>
                        <SelectItem value="Fruits">Fruits</SelectItem>
                        <SelectItem value="Grains">Grains</SelectItem>
                        <SelectItem value="Dairy">Dairy</SelectItem>
                        <SelectItem value="Meat">Meat</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="previousPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Price (Ksh/kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          disabled
                          value={selectedPrice?.price || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Price* (Ksh/kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMarketPriceMutation.isPending}>
                  {updateMarketPriceMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Price"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add New Price Dialog */}
      <Dialog open={isBatchUpdateDialogOpen} onOpenChange={setIsBatchUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Market Price</DialogTitle>
            <DialogDescription>
              Add a new product to the market price list.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...batchForm}>
            <form onSubmit={batchForm.handleSubmit(onSubmitBatchAdd)} className="space-y-4">
              <FormField
                control={batchForm.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Apples" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={batchForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Vegetables">Vegetables</SelectItem>
                        <SelectItem value="Fruits">Fruits</SelectItem>
                        <SelectItem value="Grains">Grains</SelectItem>
                        <SelectItem value="Dairy">Dairy</SelectItem>
                        <SelectItem value="Meat">Meat</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={batchForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price* (Ksh/kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsBatchUpdateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMarketPriceMutation.isPending}>
                  {createMarketPriceMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Price"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
