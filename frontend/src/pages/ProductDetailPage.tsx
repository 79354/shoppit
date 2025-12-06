import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useProductCart } from "@/hooks/useProductCart";
import { baseURL } from "@/lib/api";
import { getProductsBySlug } from "@/lib/services";
import { IProduct } from "@/types/types";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Package,
  RotateCcw,
  ShoppingCart,
  Star
} from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";

const ProductDetailPage = () => {
  const [quantity, setQuantity] = useState(1);
  const { slug } = useParams();
  const { cartCode } = useCart();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const { addedToCart, addToCartLoader, handleAddToCart, handleProductInCart } =
    useProductCart();

  const productId = product?.id;
  const productName = product?.name;

  // ✅ Fetch product details
  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;
      setLoadingProduct(true);
      try {
        const response = await getProductsBySlug(slug);
        setProduct(response);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Error fetching product:", err.message);
        }
      } finally {
        setLoadingProduct(false);
      }
    }
    fetchProduct();
  }, [slug]);

  // ✅ Check if product is in cart
  useEffect(() => {
    if (productId && cartCode) handleProductInCart(productId, cartCode);
  }, [productId, cartCode, handleProductInCart]);

  // 💰 Price formatter
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);

  // 🌀 Sleek Loader UI
  if (loadingProduct) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
          <p className="text-muted-foreground text-sm font-medium">
            Loading product details...
          </p>
        </motion.div>
      </div>
    );
  }

  // ❌ Product not found
  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link to="/">
            <Button>Return to Store</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (

    <>


    <Helmet>
        <title>{product.name} | MyStore</title>
        <meta name="description" content={product.description?.slice(0, 160)} />
      </Helmet>



    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div>
            <Card className="overflow-hidden rounded-2xl shadow-md">
              <motion.img
                src={`${baseURL}${product.image}`}
                alt={product.name}
                className="w-full h-96 lg:h-[500px] object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            </Card>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="capitalize">
                  {product.category}
                </Badge>
                {product.featured && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Featured
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                  <span className="ml-2 text-muted-foreground">
                    (4.5) 127 reviews
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            <Separator />

            {/* Price and Stock */}
            <div className="space-y-4">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                <span className="text-muted-foreground line-through">
                  {formatPrice(product.price * 1.2)}
                </span>
                <Badge variant="destructive" className="px-2 py-1">
                  Save 20%
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Stock:</span>
                <Badge
                  variant={
                    product.quantity > 10
                      ? "default"
                      : product.quantity > 0
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {product.quantity > 0
                    ? `${product.quantity} available`
                    : "Out of stock"}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              

              <div className="flex gap-4">
                <Button
                  size="lg"
                  onClick={() =>
                    handleAddToCart(productId!, productName!, cartCode)
                  }
                  disabled={
                    product.quantity === 0 || addToCartLoader || addedToCart
                  }
                  className="flex-1"
                >
                  {addToCartLoader ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-5 h-5 mr-2" />
                  )}
                  {addedToCart ? "Added to Cart" : "Add to Cart"}
                </Button>

            
              </div>

              <p className="text-sm text-muted-foreground">
                Free shipping on orders over $50 • 30-day return policy
              </p>
            </div>
          </div>
        </div>

        {/* Product Features */}
        <Card className="mt-12 p-6">
          <h3 className="text-xl font-semibold mb-4">Product Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Package className="w-6 h-6 text-primary" />,
                title: "Fast Shipping",
                desc: "Free 2-day shipping on orders over $50",
              },
              {
                icon: <CheckCircle2 className="w-6 h-6 text-primary" />,
                title: "Premium Quality",
                desc: "Carefully selected premium materials",
              },
              {
                icon: <RotateCcw className="w-6 h-6 text-primary" />,
                title: "Easy Returns",
                desc: "30-day hassle-free return policy",
              },
            ].map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  {feature.icon}
                </div>
                <h4 className="font-medium mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>

      <Footer />
    </div>

    </>
  );
};

export default ProductDetailPage;
