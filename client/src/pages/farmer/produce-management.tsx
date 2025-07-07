import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Image, ChevronRight, Sprout, Package, Calendar, TrendingUp } from "lucide-react";
import { Product } from "@shared/schema";

export default function ProduceManagement() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    description: '',
    price: '',
    unit: 'kg',
    quantity: '',
    category: '',
    image: '',
    organic: false
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Fetch user and products
    const fetchData = async () => {
      try {
        // Fetch user info
        const userResponse = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (userResponse.status === 401) {
          window.location.href = '/auth';
          return;
        }
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await userResponse.json();
        
        if (userData.role !== 'farmer') {
          window.location.href = `/${userData.role}/dashboard`;
          return;
        }
        
        setUser(userData);
        
        // Fetch farmer's products
        const productsResponse = await fetch('/api/farmer/products', {
          credentials: 'include'
        });
        
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const productsData = await productsResponse.json();
        setProducts(productsData);
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value, type } = e.target;

  if (type === 'checkbox') {
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: checked,
    });
  } else if (name === 'price' || name === 'quantity') {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  } else {
    setFormData({
      ...formData,
      [name]: value,
    });
  }
};

const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({
        ...formData,
        image: reader.result as string, // base64 data URL
      });
    };
    reader.readAsDataURL(file);
  }
};


  const resetForm = () => {
    setFormData({
      id: 0,
      name: '',
      description: '',
      price: '',
      unit: 'kg',
      quantity: '',
      category: '',
      image: '',
      organic: false
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // Validate form
      if (!formData.name || !formData.price || !formData.quantity || !formData.category) {
        throw new Error('Please fill in all required fields');
      }
      
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        unit: formData.unit,
        quantity: parseInt(formData.quantity),
        category: formData.category,
        image: formData.image || 'https://placehold.co/600x400?text=Product+Image',
        organic: formData.organic
      };
      
      const response = await fetch('/api/farmer/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }
      
      const newProduct = await response.json();
      setProducts([...products, newProduct]);
      
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      
      resetForm();
      setShowAddDialog(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // Validate form
      if (!formData.name || !formData.price || !formData.quantity || !formData.category) {
        throw new Error('Please fill in all required fields');
      }
      
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        unit: formData.unit,
        quantity: parseInt(formData.quantity),
        category: formData.category,
        image: formData.image || 'https://placehold.co/600x400?text=Product+Image',
        organic: formData.organic
      };
      
      const response = await fetch(`/api/farmer/products/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }
      
      const updatedProduct = await response.json();
      
      // Update the products list
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      
      setShowEditDialog(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/farmer/products/${selectedProduct.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }
      
      // Remove the product from the list
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      
      setShowDeleteDialog(false);
      setSelectedProduct(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (product: Product) => {
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      unit: product.unit,
      quantity: product.quantity.toString(),
      category: product.category,
      image: product.image || '',
      organic: product.organic || false
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

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
  
  if (isLoading && !products.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error && !products.length) {
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
          <Sprout className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Farmers Market</h1>
        </div>
        
        <nav className="space-y-2">
          <a 
            href="/farmer/dashboard" 
            className="flex items-center p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Dashboard
          </a>
          <a 
            href="/farmer/produce" 
            className="flex items-center p-2 rounded-md bg-primary/10 text-primary"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            My Produce
          </a>
          <a 
            href="/farmer/orders" 
            className="flex items-center p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Orders
          </a>
          <a 
            href="/farmer/market-prices" 
            className="flex items-center p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Market Prices
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
            <h1 className="text-2xl font-bold">My Produce</h1>
            <p className="text-muted-foreground">Manage your products</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            
            <Button 
              onClick={handleLogout}
              variant="outline" 
              className="md:hidden"
            >
              Sign Out
            </Button>
          </div>
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video relative bg-gray-100">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                
                {product.organic && (
                  <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Organic
                  </span>
                )}
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle>{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </CardHeader>
              
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-lg font-bold">
                    Ksh{product.price.toFixed(2)} / {product.unit}
                  </div>
                  <div className="text-sm">
                    {product.quantity} {product.unit} available
                  </div>
                </div>
                
                <p className="text-sm line-clamp-2">{product.description}</p>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openEditDialog(product)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => openDeleteDialog(product)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {products.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
              <Image className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No products yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                You haven't added any products to your inventory.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Add a new product to your inventory.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddProduct} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Product Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Organic Apples"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price(unauzaje / How much I you selling per  e.g Kilo, Dozen, Grams)</Label>
                <Input 
               id="price" 
               name="price" 
               type="number"
               value={formData.price}
                onChange={handleInputChange}
                placeholder="3.99"
                 step="0.01"
                required
               />
              </div>
              
              <div className="space-y-2">
  <Label htmlFor="unit">Measurement Unit</Label>
  <select 
    id="unit" 
    name="unit" 
    value={formData.unit}
    onChange={handleInputChange}
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
  >
    <option value="">-- Select Unit --</option>
    <option value="kg">Kilogram (kg) - approx. 2 milk packets</option>
    <option value="g">Gram (g) - small quantities, e.g. spices</option>
    <option value="lb">Pound (lb) - almost half a kilo</option>
    <option value="oz">Ounce (oz) - very small weight</option>
    <option value="piece">Piece - single item</option>
    <option value="dozen">Dozen - 12 pieces</option>
    <option value="bunch">Bunch - e.g. of bananas or spinach</option>
    <option value="basket">Basket - local basket full</option>
    <option value="tin">Tin - local standard container</option>
  </select>
</div>

              
              <div className="space-y-2">
  <Label htmlFor="quantity" className="flex items-center gap-1">
    Quantity / Kiasi  
    <span
      className="text-sm text-muted-foreground"
      title="Enter the amount based on the unit you selected, like 10 kg, 3 buckets, or 2 dozen"
    >
      ❓
    </span>
  </Label>
  <input
    type="number"
    id="quantity"
    name="quantity"
    value={formData.quantity}
    onChange={handleInputChange}
    placeholder="e.g. 10, 3, 2"
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
  />
  <p className="text-sm text-muted-foreground">
    Enter the amount based on the unit chosen.  
    Weka kiasi kulingana na kipimo ulichochagua.  
    Mfano: 10 kg, ndoo 3, au  dazeni 2, au gorogoro 2.
  </p>
</div>

              
              <div className="space-y-2">
                <Label htmlFor="category">Category(Type of the produce/ changua aina ya Kiplimo yako)</Label>
                <select 
                  id="category" 
                  name="category" 
                  value={formData.category}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Meat">Meat</option>
                  <option value="Poultry">Poultry</option>
                  <option value="Grains">Grains</option>
                  <option value="Herbs">Herbs</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="space-y-2 col-span-2">
  <Label htmlFor="imageUrl">Image URL (optional)</Label>
  <Input 
    id="imageUrl" 
    name="image" 
    value={formData.image}
    onChange={handleInputChange}
    placeholder="https://example.com/image.jpg"
    type="url"
  />

  <Label htmlFor="imageUpload">or Upload an Image</Label>
  <Input 
    id="imageUpload" 
    name="imageUpload"
    type="file"
    accept="image/*"
    onChange={handleFileUpload}
  />
</div>

              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Fresh organic apples grown in our farm."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2 col-span-2">
                <input
                  type="checkbox"
                  id="organic"
                  name="organic"
                  checked={formData.organic}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="organic">Organic Product</Label>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  'Add Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update your product information.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditProduct} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Organic Apples"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input 
                  id="edit-price" 
                  name="price" 
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="3.99"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unit</Label>
                <select 
                  id="edit-unit" 
                  name="unit" 
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="lb">Pound (lb)</option>
                  <option value="g">Gram (g)</option>
                  <option value="oz">Ounce (oz)</option>
                  <option value="piece">Piece</option>
                  <option value="dozen">Dozen</option>
                  <option value="bunch">Bunch</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity Available</Label>
                <Input 
                  id="edit-quantity" 
                  name="quantity" 
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="100"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <select 
                  id="edit-category" 
                  name="category" 
                  value={formData.category}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Meat">Meat</option>
                  <option value="Poultry">Poultry</option>
                  <option value="Grains">Grains</option>
                  <option value="Herbs">Herbs</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="space-y-2 col-span-2">
  <Label htmlFor="edit-image">Image URL (optional)</Label>
  <Input 
    id="edit-image" 
    name="image" 
    type="url"
    value={formData.image}
    onChange={handleInputChange}
    placeholder="https://example.com/image.jpg"
  />

  <Label htmlFor="upload-image">Or Upload an Image</Label>
  <Input 
    id="upload-image" 
    name="imageUpload"
    type="file"
    accept="image/*"
    onChange={handleFileUpload}
  />

  {/* Optional Preview */}
  {formData.image && (
    <div className="mt-2">
      <Label>Preview:</Label>
      <img src={formData.image} alt="Uploaded or entered" className="mt-1 max-h-48 rounded" />
    </div>
  )}
</div>

              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  name="description" 
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Fresh organic apples grown in our farm."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2 col-span-2">
                <input
                  type="checkbox"
                  id="edit-organic"
                  name="organic"
                  checked={formData.organic}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-organic">Organic Product</Label>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  'Update Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product 
              "{selectedProduct?.name}" from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}