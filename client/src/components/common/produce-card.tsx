import { Product } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Edit, Trash } from "lucide-react";

interface ProduceCardProps {
  product: Product;
  isFarmer?: boolean;
  onAddToCart?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export default function ProduceCard({
  product,
  isFarmer = false,
  onAddToCart,
  onEdit,
  onDelete,
}: ProduceCardProps) {
  const isLowStock = product.quantity <= 25;
  
  return (
    <Card className="overflow-hidden">
      <div className="h-48 w-full overflow-hidden bg-gray-100">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>No image</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {product.description?.length > 50
                ? `${product.description.substring(0, 50)}...`
                : product.description}
            </p>
          </div>
          <Badge variant="outline" className="bg-primary bg-opacity-10 text-primary">
            {product.category}
          </Badge>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <div>
            <p className="text-lg font-semibold text-gray-900">
              Ksh{product.price.toFixed(2)} / {product.unit}
            </p>
            <p className={`text-sm ${isLowStock ? "text-yellow-600" : "text-green-600"}`}>
              {isLowStock ? "Low Stock" : "In Stock"}: {product.quantity} {product.unit}
            </p>
          </div>
          
          {isFarmer ? (
            <div className="flex space-x-2">
              {onEdit && (
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={() => onEdit(product)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  size="icon" 
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => onDelete(product)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            onAddToCart && (
              <Button 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => onAddToCart(product)}
              >
                <ShoppingCart className="h-4 w-4 mr-1" /> Add
              </Button>
            )
          )}
        </div>
      </CardContent>
      
      {isFarmer && (
        <CardFooter className="px-4 py-3 bg-gray-50 border-t flex justify-between text-sm text-gray-500">
          <span>
            SKU: {product.sku || `PRD-${product.id}`}
          </span>
          <span>
            Updated: {new Date(product.updatedAt).toLocaleDateString()}
          </span>
        </CardFooter>
      )}
    </Card>
  );
}
