import { AddProductDialog } from "@/components/AddProductDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockProducts } from "@/data/mockData";
import { baseURL } from "@/lib/api";
import { adminProductSearch, getProducts } from "@/lib/services";
import { IProduct } from "@/types/types";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

const AdminProducts = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);

  const pageSize = 8;
  const totalPages = Math.ceil(count / pageSize);

  function frontendPopulateProduct(newProduct: IProduct) {
    setProducts([newProduct, ...products]);
  }

  function frontendUpdateProduct(id: number, obj: IProduct) {
    setProducts((curr) =>
      curr.map((product) => (product.id == id ? obj : product))
    );
  }

  function frontendDeleteProduct(id: number) {
    setProducts((items) => items.filter((item: IProduct) => item.id != id));
  }

  async function handleGetProducts(page = 1) {
    setLoading(true);
    try {
      const response = await getProducts(page);
      setProducts(response.results);
      setCount(response.count);
      setPage(page);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleGetProducts(1);
  }, []);

  async function handleProductSearch(page = 1) {
    setLoading(true);
    try {
      const response = await adminProductSearch(page, searchTerm);
      setProducts(response.results);
      setCount(response.count);
      setPage(page);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm) {
        handleProductSearch(1);
      }
    }, 500); // debounce delay (500ms)

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <>
      <Helmet>
        <title>Products Inventory | PurpleStore</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">
              Manage your product inventory
            </p>
          </div>
          <AddProductDialog frontendPopulateProduct={frontendPopulateProduct} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
            <div className="flex items-center space-x-2 justify-between">
              {/* <Search className="w-4 h-4 text-muted-foreground" /> */}
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              {/* <span className="px-4 py-1.5 text-sm font-semibold rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">
      {products.length} Products
    </span> */}
              <span className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
                {products.length} Products
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead> {/* ✅ New column */}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={`${baseURL}${product.image}`}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {product.sku}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {product.category}
                    </TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.quantity > 10
                            ? "default"
                            : product.quantity > 0
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {product.quantity > 10
                          ? "In Stock"
                          : product.quantity > 0
                          ? "Low Stock"
                          : "Out of Stock"}
                      </Badge>
                    </TableCell>

                    {/* ✅ Featured Column */}
                    <TableCell>
                      {product.featured ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button> */}
                        <AddProductDialog
                          editProduct
                          productId={product.id}
                          frontendUpdateProduct={frontendUpdateProduct}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <DeleteDialog
                            product={product}
                            frontendDeleteProduct={frontendDeleteProduct}
                          />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {products.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No products found matching your search.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- Pagination Controls --- */}
        <div className="flex justify-center space-x-2 mt-6">
          {/* Previous button */}
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => handleGetProducts(page - 1)}
          >
            Previous
          </Button>

          {/* Page number buttons */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              onClick={() => handleGetProducts(p)}
            >
              {p}
            </Button>
          ))}

          {/* Next button */}
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => handleGetProducts(page + 1)}
          >
            Next
          </Button>
        </div>

        {/* --- Pagination Controls ends --- */}
      </div>
    </>
  );
};

export default AdminProducts;
