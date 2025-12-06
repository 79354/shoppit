import CartitemCard from "@/components/CartitemCard";
import CartLoader from "@/components/CartLoader";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/services";
import { ICartitems } from "@/types/types";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const CartPage = () => {
  const { cart, cartTotal, cartitemCount, loading } = useCart();

  const shipping = cartTotal > 50 ? 0 : 9.99;
  const tax = cartTotal * 0.08;
  const finalTotal = cartTotal + shipping + tax;

  if (loading) {
    return <CartLoader />;
  }

  if (cart.cartitems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <ShoppingBag className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Link to="/">
              <Button size="lg">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cart | PurpleStore</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Shopping Cart
                    <span className="text-sm font-normal text-muted-foreground">
                      {cartitemCount} items
                    </span>
                  </CardTitle>
                </CardHeader>

                {/* Scrollable cart items container */}
                <CardContent
                  className="
                    space-y-4
                    max-h-[500px]
                    overflow-y-auto
                    pr-4 pl-1 pb-2 pt-2
                    scrollbar-thin
                    scrollbar-thumb-muted-foreground/50
                    hover:scrollbar-thumb-muted-foreground/70
                    scrollbar-track-transparent
                  "
                >
                  {cart.cartitems.map((item: ICartitems) => (
                    <CartitemCard key={item.id} item={item} />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24 border-0 shadow-lg rounded-2xl bg-gradient-to-b from-background to-muted/30 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold tracking-tight">
                    Order Summary
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5 text-sm sm:text-base">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Subtotal ({cartitemCount} items)</span>
                    <span className="font-medium text-foreground">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Shipping</span>
                    <span
                      className={`font-medium ${
                        shipping === 0 ? "text-green-600" : "text-foreground"
                      }`}
                    >
                      {shipping === 0 ? "FREE" : formatPrice(shipping)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Tax</span>
                    <span className="font-medium text-foreground">
                      {formatPrice(tax)}
                    </span>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex justify-between items-center text-lg font-semibold text-foreground">
                    <span>Total</span>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>

                  {cartTotal < 50 && (
                    <div className="text-sm text-center text-muted-foreground bg-muted/60 p-3 rounded-xl border border-muted">
                      🚚 Add{" "}
                      <span className="font-semibold text-foreground">
                        {formatPrice(50 - cartTotal)}
                      </span>{" "}
                      more to enjoy{" "}
                      <span className="text-green-600 font-medium">
                        FREE shipping!
                      </span>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <Link to="/checkout" className="w-full block">
                      <Button
                        size="lg"
                        className="w-full text-base font-medium transition-all duration-300 hover:scale-[1.02]"
                      >
                        Proceed to Checkout
                      </Button>
                    </Link>

                    <Link to="/" className="w-full block">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full text-base font-medium hover:bg-muted/50 transition-all duration-300"
                      >
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CartPage;
