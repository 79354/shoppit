import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

import { signInUser } from "@/lib/services";
import { useAuth } from "@/contexts/AuthContext";

interface SignInFormData {
  email: string;
  password: string;
}

const SignInPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>();

  const from = location.state?.from?.pathname || "/";

  async function handleSigninUser(data: SignInFormData) {
    setIsLoading(true);
    try {
      const response = await signInUser(data);

      localStorage.setItem("access_token", response.access);
      localStorage.setItem("refresh_token", response.refresh);
      localStorage.setItem("auth_username", response.user.username);

      login(response.user.username);
      toast.success(`Welcome back, ${response.user.username}!`);

      navigate(from, { replace: true });
    } catch (err:unknown) {
      if(err instanceof Error){

        toast.error(err.message);
      }
      console.error("Sign-in error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Sign In | PurpleStore</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
        <Navbar />

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-center">
                  Welcome back
                </CardTitle>
                <CardDescription className="text-center text-base">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form
                  onSubmit={handleSubmit(handleSigninUser)}
                  className="space-y-4"
                >
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Enter a valid email address",
                        },
                      })}
                      className="h-11"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...register("password", {
                          required: "Password is required",
                          minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters",
                          },
                        })}
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    )}
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </CardContent>

              <CardFooter>
                <div className="text-center text-sm text-muted-foreground w-full">
                  Don’t have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              </CardFooter>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              By signing in, you agree to our{" "}
              <Link to="/terms" className="text-primary hover:text-primary/80">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:text-primary/80">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default SignInPage;
