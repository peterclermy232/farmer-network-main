import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { MarketPrice } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";

export default function MarketPriceTable() {
  const { data: marketPrices, isLoading, error } = useQuery<MarketPrice[]>({
    queryKey: ["/api/market-prices"],
  });

  if (isLoading) {
    return <MarketPriceTableSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-center text-red-500">
        Error loading market prices: {error.message}
      </div>
    );
  }

  const getPercentChange = (current: number, previous: number | null) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Market Price Trends</h2>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produce</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketPrices?.map((price) => {
                const percentChange = getPercentChange(price.price, price.previousPrice || null);
                const isPositive = percentChange > 0;
                const isNeutral = percentChange === 0;

                return (
                  <TableRow key={price.id}>
                    <TableCell className="font-medium">{price.productName}</TableCell>
                    <TableCell>Ksh{price.price.toFixed(2)}/kg</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {isNeutral ? (
                          <span className="flex items-center text-gray-500">
                            <MinusIcon className="h-4 w-4 mr-1" /> Stable
                          </span>
                        ) : isPositive ? (
                          <span className="flex items-center text-green-600">
                            <ArrowUpIcon className="h-4 w-4 mr-1" /> Rising
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <ArrowDownIcon className="h-4 w-4 mr-1" /> Falling
                          </span>
                        )}
                      </div>
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-right">
          <a href="#" className="text-sm text-primary font-medium">
            View all prices
          </a>
        </div>
      </div>
    </div>
  );
}

function MarketPriceTableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Market Price Trends</h2>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
