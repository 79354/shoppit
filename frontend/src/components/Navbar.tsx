import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

// ✅ Active Link Helper
const NavLinkItem = ({
  to,
  children,
  className = "",
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`transition-colors text-sm font-medium ${
        isActive
          ? "text-primary underline underline-offset-4"
          : "text-muted-foreground hover:text-foreground"
      } ${className}`}
    >
      {children}
    </Link>
  );
};

export const Navbar = () => {
  const { cartitemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { userIsAuthenticated, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-light rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl text-foreground">Store</span>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <NavLinkItem to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartitemCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 px-1 min-w-[1.25rem] h-5 text-xs"
                  >
                    {cartitemCount}
                  </Badge>
                )}
              </Button>
            </NavLinkItem>

            {/* Auth or User */}
            {userIsAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <NavLinkItem to="/orders">Order History</NavLinkItem>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLinkItem to="/admin">Admin Dashboard</NavLinkItem>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <NavLinkItem to="/signin">
                  <Button
                    variant={location.pathname === "/signin" ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </NavLinkItem>
                <NavLinkItem to="/signup">
                  <Button
                    size="sm"
                    variant={location.pathname === "/signup" ? "default" : "outline"}
                    className="flex items-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Button>
                </NavLinkItem>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border animate-in slide-in-from-top duration-200">
            {/* Mobile Search */}
            <div className="py-3">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/50 border-0"
                  />
                </div>
              </form>
            </div>

            {/* Links */}
            <div className="flex flex-col space-y-2 pb-4">
              <NavLinkItem to="/" className="block px-2 py-1" onClick={() => setMenuOpen(false)}>
                Home
              </NavLinkItem>
              <NavLinkItem to="/products" className="block px-2 py-1" onClick={() => setMenuOpen(false)}>
                Products
              </NavLinkItem>
              <NavLinkItem to="/cart" className="block px-2 py-1" onClick={() => setMenuOpen(false)}>
                Cart
              </NavLinkItem>

              {userIsAuthenticated ? (
                <>
                  <NavLinkItem to="/orders" className="block px-2 py-1" onClick={() => setMenuOpen(false)}>
                    Orders
                  </NavLinkItem>
                  <NavLinkItem to="/admin" className="block px-2 py-1" onClick={() => setMenuOpen(false)}>
                    Admin Dashboard
                  </NavLinkItem>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="justify-start text-sm text-red-500 hover:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <Link to="/signin" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full flex items-center gap-1">
                      <LogIn className="w-4 h-4" /> Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMenuOpen(false)}>
                    <Button size="sm" className="w-full flex items-center gap-1">
                      <UserPlus className="w-4 h-4" /> Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
