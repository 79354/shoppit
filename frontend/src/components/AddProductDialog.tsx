import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { baseURL } from "@/lib/api";
import {
  addProduct,
  generateAIDescription,
  getProduct,
  toSnakeCase,
  updateProduct,
} from "@/lib/services";
import { IProduct } from "@/types/types";
import { Edit, Loader2, Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const categories = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports",
  "Books",
  "Health and Beauty",
  "Food",
  "Toys and Games",
];

interface ProductFormValues {
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
  image: FileList;
  featured: boolean;
}

interface Props {
  frontendPopulateProduct?: (newProduct: IProduct) => void;
  editProduct?: boolean;
  productId?: number;
  frontendUpdateProduct?: (id: number, obj: IProduct) => void;
}

export const AddProductDialog = ({
  frontendPopulateProduct,
  editProduct,
  productId,
  frontendUpdateProduct,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generateDescriptionLoader, setGenerateDescriptionLoader] =
    useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      category: "",
      price: 0,
      quantity: 0,
      description: "",
      featured: false,
    },
    mode: "onChange",
  });

  const formValues = watch();

  // 🚀 Generate AI Description
  const generateDescription = async () => {
    if (!formValues.name) {
      toast.error("Please enter product name first.");
      return;
    }

    setGenerateDescriptionLoader(true);

    try {
      const response = await generateAIDescription({ name: formValues.name });
      setValue("description", response.description);
      toast.message("Description Generated!", {
        description: "AI-powered product description has been created.",
      });
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setGenerateDescriptionLoader(false);
    }
  };

  // 🟢 Add Product
  const handleAddProduct = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const response = await addProduct(data);
      frontendPopulateProduct?.(response);
      toast.success(`✅ Product "${response.name}" created successfully!`);
      setOpen(false);
      reset();
      setPreview("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "❌ Failed to add product."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🟡 Update Product
  const handleUpdateProduct = async (data: FormData) => {
    if (!productId) return;

    setIsSubmitting(true);
    try {
      const response = await updateProduct(productId, data);
      frontendUpdateProduct?.(productId, response);
      toast.success(`✅ Product "${response.name}" updated successfully!`);
      setOpen(false);
      reset();
      setPreview("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "❌ Failed to update product."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 📌 Submit Handler
  const onSubmit = async (data: ProductFormValues) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("category", data.category);
    formData.append("price", data.price.toString());
    formData.append("quantity", data.quantity.toString());
    formData.append("minimumStock", "1");
    formData.append("description", data.description);
    formData.append("featured", data.featured.toString());

    if (data.image?.[0]) {
      formData.append("image", data.image[0]);
    }

    // editProduct ? handleUpdateProduct(formData) : handleAddProduct(formData);
    if (editProduct) {
      handleUpdateProduct(formData);
    } else {
      handleAddProduct(formData);
    }
  };

  // 📌 Fetch Existing Product in Edit mode
  const handleGetProduct = async () => {
    if (!productId) return;

    try {
      const response = await getProduct(productId);
      reset(response);
      setPreview(response.image ? `${baseURL}${response.image}` : "");
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };

  useEffect(() => {
    if (editProduct && productId) handleGetProduct();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editProduct ? (
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="bg-primary hover:bg-primary-dark">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl p-0">
        {/* Header */}
        <DialogHeader className="p-6 border-b bg-white/90 backdrop-blur sticky top-0 z-10 rounded-t-2xl">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-light rounded-lg flex items-center justify-center">
              {editProduct ? (
                <Edit className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-white" />
              )}
            </div>
            {editProduct ? "Update Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {editProduct
              ? "Modify the details of this product and save your changes."
              : "Create a new product listing for your store."}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          <form
            onSubmit={handleSubmit(onSubmit)}
            id="product-form"
            className="space-y-6"
          >
            {/* Name & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  {...register("name", {
                    required: "Product name is required",
                  })}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formValues.category}
                  onValueChange={(value) =>
                    setValue("category", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={toSnakeCase(cat)}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-red-500 text-sm">Category is required</p>
                )}
              </div>
            </div>

            {/* Price & Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price", {
                    required: "Price is required",
                    min: { value: 1, message: "Price must be greater than 0" },
                  })}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  {...register("quantity", {
                    required: "Stock quantity is required",
                    min: { value: 1, message: "Stock must be at least 1" },
                  })}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-sm">
                    {errors.quantity.message}
                  </p>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Product Image *</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                {...register("image", {
                  required: !editProduct ? "Product image is required" : false,
                })}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPreview(URL.createObjectURL(file));
                }}
              />
              {errors.image && (
                <p className="text-red-500 text-sm">{errors.image.message}</p>
              )}

              {preview && (
                <div className="mt-2">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Product Description</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateDescription}
                  disabled={generateDescriptionLoader}
                >
                  {generateDescriptionLoader ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  Generate with AI
                </Button>
              </div>

              <Textarea
                id="description"
                rows={4}
                placeholder="Enter product description..."
                {...register("description")}
              />
            </div>

            {/* Featured */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={formValues.featured}
                onCheckedChange={(checked) => setValue("featured", !!checked)}
              />
              <Label htmlFor="featured">Mark as featured</Label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-white/90 backdrop-blur sticky bottom-0 z-10 rounded-b-2xl flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="product-form"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            {editProduct ? "Update Product" : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
