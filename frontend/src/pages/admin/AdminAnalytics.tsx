import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import api from "@/lib/api";
import { Helmet } from "react-helmet-async";

const AdminAnalytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/analytics/");
        setData(res.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="text-center py-10">Loading analytics...</div>;
  if (!data) return <div className="text-center py-10 text-red-500">Failed to load data</div>;

  const metrics = [
    {
      title: "Total Revenue",
      value: formatPrice(data.metrics.total_revenue),
      change: "+12.5%",
      isPositive: true,
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: data.metrics.total_orders.toString(),
      change: "+8.2%",
      isPositive: true,
      icon: ShoppingCart,
    },
    {
      title: "Average Order Value",
      value: formatPrice(data.metrics.average_order_value),
      change: "+4.3%",
      isPositive: true,
      icon: TrendingUp,
    },
    {
      title: "Conversion Rate",
      value: `${data.metrics.conversion_rate}%`,
      change: "-0.5%",
      isPositive: false,
      icon: Users,
    },
  ];

  return (
    <>

    <Helmet>
            <title>Analytics | PurpleStore</title>
          </Helmet>


    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your store performance and insights</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                <Icon className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center text-xs">
                  {metric.isPositive ? (
                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                  )}
                  <span className={metric.isPositive ? "text-green-500" : "text-red-500"}>{metric.change}</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader><CardTitle>Sales Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.sales_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [formatPrice(Number(value)), "Sales"]} />
                <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader><CardTitle>Sales by Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.category_data} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {data.category_data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top Selling Products</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.top_products.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sold} sold</p>
                    </div>
                  </div>
                  <span className="font-medium">{formatPrice(product.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Orders */}
        <Card>
          <CardHeader><CardTitle>Monthly Orders</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.sales_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>

    </>
  );
};

export default AdminAnalytics;
