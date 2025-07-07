import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import { MarketPrice } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  BarChart,
  Search,
  LineChart
} from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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

type ChartDataPoint = {
  name: string;
  price: number;
  prevPrice: number | null;
};

export default function FarmerMarketPrices() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  // Fetch market prices
  const { data: marketPrices = [], isLoading } = useQuery<MarketPrice[]>({
    queryKey: ["/api/market-prices"],
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

  // Prepare chart data
  const chartData: ChartDataPoint[] = filteredPrices.map(price => ({
    name: price.productName,
    price: price.price,
    prevPrice: price.previousPrice || null
  }));

  // Price trend indicators with colors
  const getTrendIndicator = (current: number, previous: number | null) => {
    if (!previous) return <MinusIcon className="h-4 w-4 text-gray-500" />;
    
    const percentChange = getPercentChange(current, previous);
    
    if (percentChange > 0) {
      return <ArrowUpIcon className="h-4 w-4 text-green-600" />;
    } else if (percentChange < 0) {
      return <ArrowDownIcon className="h-4 w-4 text-red-600" />;
    } else {
      return <MinusIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Layout 
      title="Market Prices"
      subtitle="Track current market trends and price changes"
    >
      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
      </div>

      {/* Market Price Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Market Price Trends</CardTitle>
          <CardDescription>Visual representation of current market prices</CardDescription>
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
                    dataKey="price" 
                    stroke="#4CAF50" 
                    activeDot={{ r: 8 }} 
                    name="Current Price" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="prevPrice" 
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
        <CardHeader>
          <CardTitle>Detailed Market Prices</CardTitle>
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
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                            {getTrendIndicator(price.price, price.previousPrice)}
                            <span className="ml-1">
                              {isNeutral
                                ? "Stable"
                                : isPositive
                                ? "Rising"
                                : "Falling"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(price.updatedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
