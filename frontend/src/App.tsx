import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import Loader from "./components/Loader";

const queryClient = new QueryClient();

// Store Pages
const StorePage = lazy(() => import("./pages/StorePage"));
const ProductDetailPage = lazy(() =>
  import("./pages/ProductDetailPage")
);
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderHistoryPage = lazy(() =>
  import("./pages/OrderHistoryPage")
);
const SignInPage = lazy(() => import("./pages/SignInPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const PaymentStatusPage = lazy(() =>
  import("./pages/PaymentStatusPage")
);

// Admin Pages
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminDashboard = lazy(() =>
  import("./pages/admin/AdminDashboard")
);
const AdminProducts = lazy(() =>
  import("./pages/admin/AdminProducts")
);
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminAnalytics = lazy(() =>
  import("./pages/admin/AdminAnalytics")
);

// Misc
const NotFound = lazy(() => import("./pages/NotFound"));


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Sonner />

          <BrowserRouter>
            {/* Suspense Fallback */}
            <Suspense fallback={<Loader />}>
              <Routes>
                {/* Store Routes */}
                <Route path="/" element={<StorePage />} />
                <Route path="/products" element={<StorePage />} />
                <Route path="/product/:slug" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/payment-status" element={<PaymentStatusPage />} />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminLayout />
                    </AdminProtectedRoute>
                  }
                >
                  <Route
                    index
                    element={
                      <AdminProtectedRoute>
                        <AdminDashboard />
                      </AdminProtectedRoute>
                    }
                  />
                  <Route
                    path="products"
                    element={
                      <AdminProtectedRoute>
                        <AdminProducts />
                      </AdminProtectedRoute>
                    }
                  />
                  <Route
                    path="orders"
                    element={
                      <AdminProtectedRoute>
                        <AdminOrders />
                      </AdminProtectedRoute>
                    }
                  />
                  <Route
                    path="analytics"
                    element={
                      <AdminProtectedRoute>
                        <AdminAnalytics />
                      </AdminProtectedRoute>
                    }
                  />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
