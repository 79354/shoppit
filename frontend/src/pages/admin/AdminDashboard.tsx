import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import api from "@/lib/api";
import { Helmet } from "react-helmet-async";

interface Order {
  id: number;
  sku: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  quantity: number;
}

interface DashboardStats {
  total_products: number;
  total_orders: number;
  total_revenue: number;
  growth_rate: string;
  low_stock_products: Product[];
  recent_orders: Order[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard-stats/");
        console.log("dashboard stats", res);
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <p className="text-center py-8 text-muted-foreground">
        Loading dashboard data...
      </p>
    );
  }

  if (!stats) {
    return (
      <p className="text-center py-8 text-red-500">Failed to load dashboard.</p>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.total_products,
      icon: Package,
      description: "Active products in catalog",
    },
    {
      title: "Total Orders",
      value: stats.total_orders,
      icon: ShoppingCart,
      description: "Orders this month",
    },
    {
      title: "Revenue",
      value: formatPrice(stats.total_revenue),
      icon: DollarSign,
      description: "Total revenue this month",
    },
    {
      title: "Growth Rate",
      value: stats.growth_rate,
      icon: TrendingUp,
      description: "Compared to last month",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard | PurpleStore</title>
      </Helmet>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your admin dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recent_orders.length === 0 ? (
                  <p className="text-muted-foreground">
                    No recent orders found.
                  </p>
                ) : (
                  stats.recent_orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{order.sku}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            order.status === "success"
                              ? "default"
                              : order.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {order.status}
                        </Badge>
                        <span className="font-medium">
                          {formatPrice(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.low_stock_products.length === 0 ? (
                <p className="text-muted-foreground">
                  All products are well stocked
                </p>
              ) : (
                <div className="space-y-4">
                  {stats.low_stock_products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category}
                        </p>
                      </div>
                      <Badge
                        variant={
                          product.quantity === 0 ? "destructive" : "secondary"
                        }
                      >
                        {product.quantity === 0
                          ? "Out of stock"
                          : `${product.quantity} left`}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
