import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAllProducts,
  getFeaturedProducts,
  toSnakeCase,
} from "@/lib/services";
import { IProduct } from "@/types/types";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";

// Categories List
const categories = [
  "All",
  "Electronics",
  "Clothing",
  "Home and Garden",
  "Sports",
  "Books",
];

// Simple shimmer skeleton card
const SkeletonCard = () => (
  <motion.div
    className="bg-muted rounded-xl h-64 animate-pulse"
    initial={{ opacity: 0.5 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
  />
);

const StorePage = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [featuredProducts, setFeaturedProducts] = useState<IProduct[]>([]);
  const [featuredProductsLoader, setFeaturedProductsLoader] = useState(false);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [page, setPage] = useState(1);

  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [loadingAllProducts, setLoadingAllProducts] = useState(true);

  /** Fetch All Products **/
  useEffect(() => {
    async function handleGetAllProducts() {
      setLoadingAllProducts(true);
      try {
        const res = await getAllProducts(
          page,
          searchQuery,
          toSnakeCase(selectedCategory)
        );
        setProducts(res.results);
        setNextPage(res.next);
        setPrevPage(res.previous);
        setCount(res.count);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingAllProducts(false);
      }
    }

    handleGetAllProducts();
  }, [page, searchQuery, selectedCategory]);

  /** Fetch Featured Products **/
  useEffect(() => {
    async function handleGetFeaturedProducts() {
      setFeaturedProductsLoader(true);
      try {
        const res = await getFeaturedProducts();
        setFeaturedProducts(res);
      } catch (err) {
        if (err instanceof Error) {
          console.error("Error fetching featured products:", err.message);
        }
      } finally {
        setFeaturedProductsLoader(false);
      }
    }

    handleGetFeaturedProducts();
  }, []);

  return (
    <>
      <Helmet>
        <title>Home | PurpleStore</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          {!searchQuery && (
            <section className="mb-12">
              <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-primary-foreground shadow-lg">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  Modern E-Commerce
                </h1>
                <p className="text-xl md:text-2xl mb-6 opacity-90">
                  Discover amazing products with our sleek shopping experience
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  onClick={() =>
                    document
                      .getElementById("all-products")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Shop Now
                </Button>
              </div>
            </section>
          )}

          {/* Search Results Header */}
          {searchQuery && (
            <section className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Search Results for "{searchQuery}"
              </h1>
              <p className="text-muted-foreground">{count} products found</p>
            </section>
          )}

          {/* Featured Products */}
          {!searchQuery && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Featured Products</h2>

              {featuredProductsLoader ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : (
                featuredProducts.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {featuredProducts.slice(0, 4).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )
              )}
            </section>
          )}

          {/* Category Filters */}
          <section className="mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </section>

          {/* Products Grid */}
          <section id="all-products">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {selectedCategory === "All" ? "All Products" : selectedCategory}
              </h2>
              <Badge variant="secondary" className="px-3 py-1">
                {count} products
              </Badge>
            </div>

            {loadingAllProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">
                  No products found matching your criteria.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory("All");
                    window.history.pushState({}, "", "/");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </section>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-3 mt-10">
            <Button
              variant="outline"
              disabled={!prevPage}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>

            <span className="text-sm">Page {page}</span>

            <Button
              variant="outline"
              disabled={!nextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default StorePage;
