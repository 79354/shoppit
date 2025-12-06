import { Link } from "react-router-dom";
import { Loader2, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { IProduct } from "@/types/types";
import { baseURL } from "@/lib/api";
import { useProductCart } from "@/hooks/useProductCart";
import { useEffect } from "react";

interface Props {
  product: IProduct;
}

export const ProductCard = ({ product }: Props) => {
  const { cartCode } = useCart();
  const productId = product?.id;
  const productName = product?.name;

  const {
    addedToCart,
    addToCartLoader,
    handleAddToCart,
    handleProductInCart,
  } = useProductCart();

  useEffect(() => {
    handleProductInCart(productId, cartCode);
  }, [productId, cartCode, handleProductInCart]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);

  return (
    <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card">
      <Link to={`/product/${product.slug}`}>
        <div className="relative overflow-hidden">
          <img
            src={`${baseURL}${product.image}`}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {product.featured && (
            <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">
              Featured
            </Badge>
          )}

          {product.quantity < 10 && product.quantity > 0 && (
            <Badge variant="secondary" className="absolute top-3 right-3">
              Low Stock
            </Badge>
          )}

          {product.quantity === 0 && (
            <Badge variant="destructive" className="absolute top-3 right-3">
              Out of Stock
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/product/${product.slug}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-muted-foreground capitalize mb-2">
                {product.category}
              </p>
            </div>

            <div className="flex items-center ml-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-muted-foreground ml-1">4.5</span>
            </div>
          </div>
        </Link>

        <Link to={`/product/${product.slug}`}>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {product.description}
          </p>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-muted-foreground">
              {product.quantity} in stock
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => handleAddToCart(productId, productName, cartCode)}
            disabled={product.quantity === 0 || addToCartLoader || addedToCart}
            className="px-3 py-2 rounded-xl bg-primary hover:bg-primary-dark transition-colors"
          >
            {addToCartLoader ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4 mr-2" />
            )}
            {addedToCart ? "In Cart" : "Add"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};