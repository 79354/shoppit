import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { verifyPayment } from "@/lib/services";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { Helmet } from "react-helmet-async";

const PaymentStatusPage = () => {
  const [searchParams] = useSearchParams();
  const { resetCart, toggleCartCode } = useCart();
  //   const status = searchParams.get("status");
  //   const isSuccess = status === "success";
  //   const isPending = !status || status === "pending";

  const reference = searchParams.get("reference");
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | "pending"
  >("pending");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function handleVerifyPaymentStatus() {
      if (!reference) {
        setPaymentStatus("failed");
        return;
      }
      try {
        const response = await verifyPayment(reference);
        if (response.status === "success") {
          setPaymentStatus("success");
          localStorage.removeItem("cartCode");
          resetCart();
          toggleCartCode();
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          toast.error(err.message);
        }
        setPaymentStatus("failed");
      }
    }

    handleVerifyPaymentStatus();
  }, [reference]);

  return (
    <>
      <Helmet>
        <title>PaymentStatus | PurpleStore</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 py-16">
          <Card className="w-full max-w-md border-primary/20 shadow-lg">
            <CardContent className="pt-12 pb-8 px-8">
              <div className="flex flex-col items-center text-center space-y-6">
                {paymentStatus === "pending" ? (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                      <Loader2 className="w-20 h-20 text-primary relative animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold text-foreground">
                        Processing Payment
                      </h1>
                      <p className="text-muted-foreground text-lg">
                        Please wait while we confirm your payment
                      </p>
                    </div>
                    <div className="w-full space-y-3 pt-4">
                      <Progress value={66} className="w-full" />
                      <p className="text-sm text-muted-foreground">
                        This usually takes just a few moments. Please don't
                        close this page.
                      </p>
                    </div>
                  </>
                ) : paymentStatus == "success" ? (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                      <CheckCircle className="w-20 h-20 text-primary relative" />
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold text-foreground">
                        Payment Successful!
                      </h1>
                      <p className="text-muted-foreground text-lg">
                        Thank you for your purchase
                      </p>
                    </div>
                    <div className="w-full space-y-3 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Your order has been confirmed and will be processed
                        shortly. You'll receive a confirmation email with your
                        order details.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
                      <Button asChild className="flex-1">
                        <Link to="/orders">
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          View Orders
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="flex-1">
                        <Link to="/products">Continue Shopping</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full" />
                      <XCircle className="w-20 h-20 text-destructive relative" />
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold text-foreground">
                        Payment Failed
                      </h1>
                      <p className="text-muted-foreground text-lg">
                        Something went wrong
                      </p>
                    </div>
                    <div className="w-full space-y-3 pt-4">
                      <p className="text-sm text-muted-foreground">
                        We couldn't process your payment. Please check your
                        payment details and try again. If the problem persists,
                        contact your bank or try a different payment method.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
                      <Button asChild className="flex-1">
                        <Link to="/checkout">Try Again</Link>
                      </Button>
                      <Button asChild variant="outline" className="flex-1">
                        <Link to="/cart">
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Cart
                        </Link>
                      </Button>
                    </div>
                  </>
                )}

                <div className="pt-6 border-t w-full">
                  <Link
                    to="/"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Return to Home
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default PaymentStatusPage;
