import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Package, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getUserOrders } from "@/lib/services";
import { IOrders } from "@/types/types";

// const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<IOrders[]>([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [prev, setPrev] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const pageSize = 5;
  const totalPages = Math.ceil(count / pageSize);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "default";
      case "shipped":
      case "processing":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const fetchOrders = async (pageNumber = 1) => {
    setLoading(true)
    try {
      const res = await getUserOrders(pageNumber)
      
      setOrders(res.results);
      setCount(res.count);
      setNext(res.next);
      setPrev(res.previous);
      setPage(pageNumber);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Fixed Navbar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-background border-b backdrop-blur-md">
        <Navbar />
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Store
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order History</h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't placed any orders yet.
              </p>
              <Link to="/">
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Order {order.sku}
                        </CardTitle>
                        <p className="text-muted-foreground mt-1">
                          Placed on {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusVariant(order.status)} className="mb-2 capitalize">
                          {order.status}
                        </Badge>
                        <p className="text-lg font-bold">{formatPrice(order.total_amount)}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {order.orderitems.map((item, index: number) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} × {formatPrice(item.product.price)}
                            </p>
                          </div>
                          <p className="font-medium">
                            {formatPrice(item.quantity * item.product.price)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {order.status === "delivered" && (
                          <Button variant="outline" size="sm">
                            Reorder
                          </Button>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.status === "delivered" && "✓ Delivered"}
                        {order.status === "shipped" && "🚚 In Transit"}
                        {order.status === "success" && "⏳ Processing"}
                        {order.status === "cancelled" && "❌ Cancelled"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-2 mt-10">
              <Button
                variant="outline"
                onClick={() => fetchOrders(page - 1)}
                disabled={!prev}
              >
                Prev
              </Button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, index) => (
                <Button
                  key={index}
                  variant={page === index + 1 ? "default" : "outline"}
                  onClick={() => fetchOrders(index + 1)}
                  className="w-10"
                >
                  {index + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                onClick={() => fetchOrders(page + 1)}
                disabled={!next}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default OrderHistoryPage;
