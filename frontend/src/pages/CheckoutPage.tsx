import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { baseURL } from "@/lib/api";
import {
  createShippingAddress,
  getShippingInfo,
  initiatePayment,
} from "@/lib/services";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type ShippingFormData = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
};

const CheckoutPage = () => {
  const { cart, cartTotal, cartitemCount, cartCode } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ShippingFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);

  const shipping = cartTotal > 50 ? 0 : 9.99;
  const tax = cartTotal * 0.08;
  const finalTotal = cartTotal + shipping + tax;

  useEffect(() => {
    async function handleGetShippingInfo() {
      try {
        const response = await getShippingInfo();
        setValue("firstName", response.first_name);
        setValue("lastName", response.last_name);
        setValue("email", response.email);
        setValue("address", response.address);
        setValue("city", response.city);
        setValue("state", response.state);
        setValue("zipCode", response.zip_code);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Error getting user's shipping info", err.message);
        }
      }
    }

    handleGetShippingInfo();
  }, [setValue]);

  async function handleCreateShippingAddress(data: ShippingFormData) {
    setIsProcessing(true);
    try {
      await createShippingAddress(data);
      toast.success("Shipping address successfully saved!");
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleInitializePayment() {
    setIsProcessing(true);
    try {
      const response = await initiatePayment({ cart_code: cartCode });
      if (response.access_code && response.authorization_url) {
        window.location.href = response.authorization_url;
      }
      return response;
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
        throw new Error(err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  const onSubmit = async (data: ShippingFormData) => {
    setIsProcessing(true);
    try {
      await handleCreateShippingAddress(data);
      await handleInitializePayment();
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.cartitems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Link to="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout | PurpleStore</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/cart"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Secure Checkout
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Shipping Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Shipping Information
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            {...register("firstName", {
                              required: "First name is required",
                            })}
                          />
                          {errors.firstName && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.firstName.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            {...register("lastName", {
                              required: "Last name is required",
                            })}
                          />
                          {errors.lastName && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.lastName.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email", {
                            required: "Email is required",
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: "Enter a valid email address",
                            },
                          })}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          {...register("address", {
                            required: "Address is required",
                          })}
                        />
                        {errors.address && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.address.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            {...register("city", {
                              required: "City is required",
                            })}
                          />
                          {errors.city && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.city.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            {...register("state", {
                              required: "State is required",
                            })}
                          />
                          {errors.state && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.state.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="zipCode">ZIP Code</Label>
                          <Input
                            id="zipCode"
                            {...register("zipCode", {
                              required: "ZIP Code is required",
                            })}
                          />
                          {errors.zipCode && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.zipCode.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {isProcessing
                        ? "Processing..."
                        : `Place Order - ${formatPrice(finalTotal)}`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.cartitems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img
                          src={`${baseURL}${item.product.image}`}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({cartitemCount} items)</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span className={shipping === 0 ? "text-success" : ""}>
                        {shipping === 0
                          ? "FREE"
                          : formatPrice(shipping)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>{formatPrice(tax)}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg text-sm text-center">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Your payment information is secure and encrypted
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

export default CheckoutPage;
